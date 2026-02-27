import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale, PaymentMethod, SaleStatus } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { CashSession, CashSessionStatus } from '../cash-sessions/entities/cash-session.entity';
import { User } from '../users/entities/user.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { CreateSaleDto } from './dto/create-sale.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(CashSession)
    private readonly sessionRepository: Repository<CashSession>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Create a new sale with items and update inventory
   */
  async create(userId: string, createSaleDto: CreateSaleDto): Promise<Sale> {
    // Use transaction to ensure data consistency
    const result = await this.dataSource.transaction(async (manager) => {
      // 1. Validate session
      const session = await manager.findOne(CashSession, {
        where: { id: createSaleDto.sessionId },
      });

      if (!session) {
        throw new NotFoundException(
          `Cash session with ID ${createSaleDto.sessionId} not found`,
        );
      }

      if (session.status !== CashSessionStatus.OPEN) {
        throw new BadRequestException('Cash session is not open');
      }

      // 🔒 VALIDACIÓN: Solo ADMIN, MANAGER o dueño de la sesión pueden hacer ventas
      const sessionUser = await manager.findOne(User, {
        where: { id: session.userId },
      });
      
      const currentUser = await manager.findOne(User, {
        where: { id: userId },
      });

      const isSessionOwner = session.userId === userId;
      const isAdminOrManager = currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER');
      
      if (!isSessionOwner && !isAdminOrManager) {
        throw new ForbiddenException(
          'You can only make sales in your own cash session. Contact an administrator if you need assistance.',
        );
      }

      // 2. Validate and prepare sale items
      const saleItems: Partial<SaleItem>[] = [];
      let subtotal = 0;

      for (const itemDto of createSaleDto.items) {
        const product = await manager.findOne(Product, {
          where: { id: itemDto.productId },
          relations: ['category'],
        });

        if (!product) {
          throw new NotFoundException(
            `Product with ID ${itemDto.productId} not found`,
          );
        }

        if (!product.isActive) {
          throw new BadRequestException(
            `Product "${product.name}" is not active`,
          );
        }

        // Validate stock if tracking is enabled
        // Solo validar stock para productos UNIT (no WEIGHT)
        if (product.saleType === 'UNIT') {
          const availableStock = Number(product.stockQuantity || 0);
          if (availableStock < itemDto.quantity) {
            throw new BadRequestException(
              `Insufficient stock for product "${product.name}". Available: ${availableStock}, Requested: ${itemDto.quantity}`,
            );
          }
        }

        // Calculate item totals (all rounded to integers)
        const unitPrice = itemDto.unitPrice !== undefined ? Number(itemDto.unitPrice) : Number(product.price);
        const quantity = Number(itemDto.quantity);
        const discount = Math.round(Number(itemDto.discount || 0));
        const itemSubtotal = Math.round(unitPrice * quantity - discount);

        // Prepare sale item data with optional batch fields
        const saleItemData: any = {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity,
          unit: product.unit,
          unitPrice,
          discount,
          subtotal: itemSubtotal,
        };

        // Add optional fields if provided
        if (itemDto.pieces !== undefined) {
          saleItemData.pieces = itemDto.pieces;
        }
        
        // Add batch fields if provided (for batch-tracked products)
        if (itemDto.batchId) {
          saleItemData.batchId = itemDto.batchId;
        }
        if (itemDto.batchNumber) {
          saleItemData.batchNumber = itemDto.batchNumber;
        }
        if (itemDto.actualWeight !== undefined) {
          saleItemData.actualWeight = Number(itemDto.actualWeight);
        }

        saleItems.push(saleItemData);

        subtotal += itemSubtotal;

        // Update product stock - Solo para productos UNIT
        // Si la venta está asociada a un pedido (orderId), NO descontar stock
        // porque el pedido ya lo descontó al crearse
        if (product.saleType === 'UNIT' && !createSaleDto.orderId) {
          product.stockQuantity = Number(product.stockQuantity || 0) - quantity;
          await manager.save(Product, product);
        }
      }

      // 3. Calculate sale totals (all rounded to integers)
      const saleDiscount = Math.round(Number(createSaleDto.discount || 0));
      const total = Math.round(subtotal - saleDiscount);

      // 4. Validate payment method and amounts
      const paymentMethodUpper = createSaleDto.paymentMethod.toUpperCase();
      if (!Object.values(PaymentMethod).includes(paymentMethodUpper as PaymentMethod)) {
        throw new BadRequestException(
          `Invalid payment method: ${createSaleDto.paymentMethod}. Allowed: CASH, CARD, TRANSFER, MIXED`,
        );
      }
      const paymentMethod = paymentMethodUpper as PaymentMethod;
      let changeAmount = 0;

      if (paymentMethod === PaymentMethod.CASH) {
        const cashReceived = Number(createSaleDto.cashAmount || 0);
        if (cashReceived < total) {
          throw new BadRequestException(
            `Insufficient cash amount. Required: ${total}, Received: ${cashReceived}`,
          );
        }
        changeAmount = cashReceived - total;
      } else if (paymentMethod === PaymentMethod.MIXED) {
        const cashAmount = Number(createSaleDto.cashAmount || 0);
        const cardAmount = Number(createSaleDto.cardAmount || 0);
        const transferAmount = Number(createSaleDto.transferAmount || 0);
        const totalPaid = cashAmount + cardAmount + transferAmount;

        if (Math.abs(totalPaid - total) > 0.01) {
          // Allow 1 cent difference for rounding
          throw new BadRequestException(
            `Payment amounts don't match total. Required: ${total}, Paid: ${totalPaid}`,
          );
        }
      }

      // 5. Create sale
      const sale = manager.create(Sale, {
        sessionId: createSaleDto.sessionId,
        cashierId: userId,
        subtotal,
        discount: saleDiscount,
        total,
        paymentMethod,
        cashAmount: createSaleDto.cashAmount,
        cardAmount: createSaleDto.cardAmount,
        transferAmount: createSaleDto.transferAmount,
        changeAmount,
        status: SaleStatus.COMPLETED,
        notes: createSaleDto.notes,
        customerId: createSaleDto.customerId,
        orderId: createSaleDto.orderId,
      });

      const savedSale = await manager.save(Sale, sale);

      // 6. Create sale items
      for (const itemData of saleItems) {
        const saleItem = manager.create(SaleItem, {
          ...itemData,
          saleId: savedSale.id,
        });
        await manager.save(SaleItem, saleItem);
      }

      // 7. Update session expected amount (only for cash sales)
      if (paymentMethod === PaymentMethod.CASH || paymentMethod === PaymentMethod.MIXED) {
        const cashToAdd = Number(createSaleDto.cashAmount || 0) - changeAmount;
        session.expectedAmount = Number(session.expectedAmount) + cashToAdd;
        await manager.save(CashSession, session);
      }

      // 8. If this sale is linked to an order, update the order's saleId
      if (createSaleDto.orderId) {
        await manager.query(
          `UPDATE orders SET sale_id = $1, status = 'DELIVERED', delivered_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [savedSale.id, createSaleDto.orderId]
        );
      }

      // Return sale with items
      return await manager.findOne(Sale, {
        where: { id: savedSale.id },
        relations: ['items', 'items.product', 'cashier', 'session'],
      });
    });

    if (!result) {
      throw new Error('Failed to create sale');
    }

    return result;
  }

  /**
   * Find all sales with optional filters and pagination
   */
  async findAll(
    sessionId?: string,
    cashierId?: string,
    startDate?: Date,
    endDate?: Date,
    page?: number,
    limit?: number,
  ): Promise<Sale[] | { data: Sale[]; total: number; page: number; totalPages: number }> {
    console.log('🔍 [SalesService] findAll called with:', {
      sessionId,
      cashierId,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      page,
      limit,
      hasPage: page !== undefined,
      hasLimit: limit !== undefined,
    });

    const queryBuilder = this.saleRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('sale.cashier', 'cashier')
      .leftJoinAndSelect('sale.session', 'session')
      .orderBy('sale.createdAt', 'DESC');

    if (sessionId) {
      queryBuilder.andWhere('sale.sessionId = :sessionId', { sessionId });
    }

    if (cashierId) {
      queryBuilder.andWhere('sale.cashierId = :cashierId', { cashierId });
    }

    if (startDate) {
      // Usar directamente la fecha ISO recibida del frontend (ya viene con offset de Bolivia)
      queryBuilder.andWhere('sale.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      // Usar directamente el endDate con hora 23:59:59 que viene del frontend
      // No manipular fechas manualmente, confiar en el ISO string con offset
      queryBuilder.andWhere('sale.createdAt <= :endDate', { endDate });
    }

    // Si se especifican page y limit, retornar con paginación
    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      queryBuilder.skip(skip).take(limit);

      const [data, total] = await queryBuilder.getManyAndCount();
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        totalPages,
      };
    }

    // Backward compatibility: sin paginación retornar array directo
    return await queryBuilder.getMany();
  }

  /**
   * Find one sale by ID
   */
  async findOne(id: string): Promise<Sale> {
    const sale = await this.saleRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'cashier', 'session', 'session.terminal'],
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  /**
   * Cancel a sale and restore inventory
   */
  async cancel(id: string, reason: string): Promise<Sale> {
    return await this.dataSource.transaction(async (manager) => {
      const sale = await manager.findOne(Sale, {
        where: { id },
        relations: ['items', 'items.product', 'session'],
      });

      if (!sale) {
        throw new NotFoundException(`Sale with ID ${id} not found`);
      }

      if (sale.status === SaleStatus.CANCELLED) {
        throw new BadRequestException('Sale is already cancelled');
      }

      // Restore inventory for each item
      for (const item of sale.items) {
        if (item.product.saleType === 'UNIT') {
          item.product.stockQuantity =
            Number(item.product.stockQuantity) + Number(item.quantity);
          await manager.save(Product, item.product);
        }
      }

      // Update session expected amount if it was a cash sale
      if (
        sale.paymentMethod === PaymentMethod.CASH ||
        sale.paymentMethod === PaymentMethod.MIXED
      ) {
        const cashToRemove = Number(sale.cashAmount || 0) - Number(sale.changeAmount || 0);
        sale.session.expectedAmount =
          Number(sale.session.expectedAmount) - cashToRemove;
        await manager.save(CashSession, sale.session);
      }

      // Mark sale as cancelled
      sale.status = SaleStatus.CANCELLED;
      sale.notes = (sale.notes || '') + `\nCANCELLED: ${reason}`;

      return await manager.save(Sale, sale);
    });
  }

  /**
   * Get sales statistics for a session
   */
  async getSessionStats(sessionId: string) {
    const salesResult = await this.findAll(sessionId);
    // When no pagination params, findAll returns array directly
    const sales = Array.isArray(salesResult) ? salesResult : salesResult.data;

    const completedSales = sales.filter((s) => s.status === SaleStatus.COMPLETED);

    const totalSales = completedSales.length;
    const totalRevenue = completedSales.reduce(
      (sum, s) => sum + Number(s.total),
      0,
    );
    const totalDiscount = completedSales.reduce(
      (sum, s) => sum + Number(s.discount),
      0,
    );

    const cashSales = completedSales.filter(
      (s) => s.paymentMethod === PaymentMethod.CASH,
    );
    const cardSales = completedSales.filter(
      (s) => s.paymentMethod === PaymentMethod.CARD,
    );
    const transferSales = completedSales.filter(
      (s) => s.paymentMethod === PaymentMethod.TRANSFER,
    );
    const mixedSales = completedSales.filter(
      (s) => s.paymentMethod === PaymentMethod.MIXED,
    );

    return {
      totalSales,
      totalRevenue,
      totalDiscount,
      averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
      paymentMethods: {
        cash: {
          count: cashSales.length,
          total: cashSales.reduce((sum, s) => sum + Number(s.total), 0),
        },
        card: {
          count: cardSales.length,
          total: cardSales.reduce((sum, s) => sum + Number(s.total), 0),
        },
        transfer: {
          count: transferSales.length,
          total: transferSales.reduce((sum, s) => sum + Number(s.total), 0),
        },
        mixed: {
          count: mixedSales.length,
          total: mixedSales.reduce((sum, s) => sum + Number(s.total), 0),
        },
      },
    };
  }

  /**
   * Get general sales statistics by date range
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
    const salesResult = await this.findAll(
      undefined,
      undefined,
      startDate,
      endDate,
    );
    // When no pagination params, findAll returns array directly
    const sales = Array.isArray(salesResult) ? salesResult : salesResult.data;

    const completedSales = sales.filter((s) => s.status === SaleStatus.COMPLETED);
    const cancelledSales = sales.filter((s) => s.status === SaleStatus.CANCELLED);

    const totalSales = completedSales.length;
    const totalRevenue = completedSales.reduce(
      (sum, s) => sum + Number(s.total),
      0,
    );
    const totalDiscount = completedSales.reduce(
      (sum, s) => sum + Number(s.discount),
      0,
    );

    // Payment methods breakdown
    const cashSales = completedSales.filter(
      (s) => s.paymentMethod === PaymentMethod.CASH,
    );
    const cardSales = completedSales.filter(
      (s) => s.paymentMethod === PaymentMethod.CARD,
    );
    const transferSales = completedSales.filter(
      (s) => s.paymentMethod === PaymentMethod.TRANSFER,
    );
    const mixedSales = completedSales.filter(
      (s) => s.paymentMethod === PaymentMethod.MIXED,
    );

    // Top products sold
    const productSales: Record<string, {
      productId: string;
      productName: string;
      productSku: string;
      quantity: number;
      revenue: number;
      salesCount: number;
    }> = {};

    for (const sale of completedSales) {
      for (const item of sale.items) {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity: 0,
            revenue: 0,
            salesCount: 0,
          };
        }
        productSales[item.productId].quantity += Number(item.quantity);
        productSales[item.productId].revenue += Number(item.subtotal);
        productSales[item.productId].salesCount += 1;
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Sales by date
    const salesByDate: Record<string, {
      date: string;
      totalSales: number;
      revenue: number;
      salesCount: number;
    }> = {};

    for (const sale of completedSales) {
      const date = new Date(sale.createdAt).toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = {
          date,
          totalSales: 0,
          revenue: 0,
          salesCount: 0,
        };
      }
      salesByDate[date].revenue += Number(sale.total);
      salesByDate[date].salesCount += 1;
    }

    const dailySales = Object.values(salesByDate).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return {
      summary: {
        totalSales,
        totalRevenue,
        totalDiscount,
        averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
        cancelledSales: cancelledSales.length,
      },
      paymentMethods: {
        cash: {
          count: cashSales.length,
          total: cashSales.reduce((sum, s) => sum + Number(s.total), 0),
        },
        card: {
          count: cardSales.length,
          total: cardSales.reduce((sum, s) => sum + Number(s.total), 0),
        },
        transfer: {
          count: transferSales.length,
          total: transferSales.reduce((sum, s) => sum + Number(s.total), 0),
        },
        mixed: {
          count: mixedSales.length,
          total: mixedSales.reduce((sum, s) => sum + Number(s.total), 0),
        },
      },
      topProducts,
      dailySales,
    };
  }

  /**
   * Delete a sale (ADMIN only, current session only)
   * Restores inventory and cleans up associated order
   */
  async remove(id: string, userId: string): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Find sale with items
      const sale = await manager.findOne(Sale, {
        where: { id },
        relations: ['items', 'items.product'],
      });

      if (!sale) {
        throw new NotFoundException(`Sale with ID ${id} not found`);
      }

      // 2. Verify sale belongs to user's current open session
      const currentSession = await manager.findOne(CashSession, {
        where: {
          userId,
          status: CashSessionStatus.OPEN,
        },
      });

      if (!currentSession) {
        throw new ForbiddenException('No open session found for current user');
      }

      if (sale.sessionId !== currentSession.id) {
        throw new ForbiddenException(
          'Cannot delete sales from other sessions. Only sales from current open session can be deleted.'
        );
      }

      // 3. Restore inventory (for UNIT products)
      // Si la venta tiene orderId asociado, NO restaurar stock porque el pedido
      // hizo el descuento. Solo restaurar stock para ventas directas (sin pedido)
      if (!sale.orderId) {
        for (const item of sale.items) {
          const product = await manager.findOne(Product, {
            where: { id: item.productId },
          });

          if (product && product.saleType === 'UNIT') {
            product.stockQuantity = Number(product.stockQuantity || 0) + Number(item.quantity);
            await manager.save(Product, product);
          }
        }
      }

      // 4. Clean up associated order (if exists)
      if (sale.orderId) {
        const order = await manager.findOne(Order, {
          where: { id: sale.orderId },
        });

        if (order) {
          order.saleId = undefined;
          order.status = OrderStatus.READY; // Return to READY state
          await manager.save(Order, order);
        }
      }

      // 5. Recalculate session expected amount
      const sessionSales = await manager.find(Sale, {
        where: { sessionId: currentSession.id },
      });

      const newExpectedAmount = sessionSales
        .filter((s) => s.id !== sale.id) // Exclude the sale being deleted
        .reduce((sum, s) => sum + Number(s.total), 0);

      currentSession.expectedAmount = newExpectedAmount;
      await manager.save(CashSession, currentSession);

      // 6. Delete sale (sale_items will be cascade deleted)
      await manager.remove(Sale, sale);
    });
  }
}
