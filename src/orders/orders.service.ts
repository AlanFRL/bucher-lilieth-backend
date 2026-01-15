import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/entities/product.entity';
import { ProductBatch } from '../product-batches/entities/product-batch.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductBatch)
    private readonly productBatchRepository: Repository<ProductBatch>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Generate unique order number
   */
  private async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const prefix = `ORD${year}${month}${day}`;

    // Find last order number for today
    const lastOrder = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.order_number LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('order.order_number', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Create a new order
   */
  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const result = await this.dataSource.transaction(async (manager) => {
      // 1. Generate order number
      const orderNumber = await this.generateOrderNumber();

      // 2. Validate products and prepare order items
      const orderItems: Partial<OrderItem>[] = [];
      let subtotal = 0;

      for (const itemDto of createOrderDto.items) {
        const product = await manager.findOne(Product, {
          where: { id: itemDto.productId },
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

        // Validate batch if provided (for VACUUM_PACKED products)
        let batchId: string | undefined;
        let unitPrice = Number(product.price);
        
        if (itemDto.batchId) {
          const batch = await manager.findOne(ProductBatch, {
            where: { id: itemDto.batchId },
          });

          if (!batch) {
            throw new NotFoundException(
              `Batch with ID ${itemDto.batchId} not found`,
            );
          }

          if (batch.productId !== product.id) {
            throw new BadRequestException(
              `Batch ${batch.batchNumber} does not belong to product ${product.name}`,
            );
          }

          if (batch.isSold) {
            throw new BadRequestException(
              `Batch ${batch.batchNumber} is already sold`,
            );
          }

          // Check if batch is already reserved in another order
          const existingOrderItem = await manager.findOne(OrderItem, {
            where: { batchId: batch.id },
            relations: ['order'],
          });

          if (existingOrderItem && 
              existingOrderItem.order.status !== OrderStatus.CANCELLED &&
              existingOrderItem.order.status !== OrderStatus.DELIVERED) {
            throw new BadRequestException(
              `Batch ${batch.batchNumber} is already reserved in order ${existingOrderItem.order.orderNumber}`,
            );
          }

          batchId = batch.id;
          unitPrice = Number(batch.unitPrice);
        }

        // Calculate item totals
        const quantity = Number(itemDto.quantity);
        const discount = Number(itemDto.discount || 0);
        const itemSubtotal = unitPrice * quantity - discount;

        orderItems.push({
          productId: product.id,
          batchId,
          productName: product.name,
          productSku: product.sku,
          quantity,
          unit: product.unit,
          unitPrice,
          discount,
          subtotal: itemSubtotal,
          notes: itemDto.notes,
        });

        subtotal += itemSubtotal;
      }

      // 3. Calculate order totals
      const orderDiscount = Number(createOrderDto.discount || 0);
      const total = subtotal - orderDiscount;
      const deposit = Number(createOrderDto.deposit || 0);

      if (deposit > total) {
        throw new BadRequestException('Deposit cannot exceed order total');
      }

      // 4. Create order
      const order = manager.create(Order, {
        orderNumber,
        customerName: createOrderDto.customerName,
        customerPhone: createOrderDto.customerPhone,
        customerEmail: createOrderDto.customerEmail,
        subtotal,
        discount: orderDiscount,
        total,
        deposit,
        deliveryDate: new Date(createOrderDto.deliveryDate),
        deliveryTime: createOrderDto.deliveryTime,
        notes: createOrderDto.notes,
        internalNotes: createOrderDto.internalNotes,
        createdBy: userId,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await manager.save(Order, order);

      // 5. Create order items
      for (const itemData of orderItems) {
        const orderItem = manager.create(OrderItem, {
          ...itemData,
          orderId: savedOrder.id,
        });
        await manager.save(OrderItem, orderItem);
      }

      // Return order with items
      return await manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['items', 'items.product', 'items.batch', 'creator'],
      });
    });

    if (!result) {
      throw new Error('Failed to create order');
    }

    return result;
  }

  /**
   * Find all orders with optional filters
   */
  async findAll(
    status?: OrderStatus,
    customerName?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Order[]> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.batch', 'batch')
      .leftJoinAndSelect('order.creator', 'creator');

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (customerName) {
      queryBuilder.andWhere('order.customer_name ILIKE :customerName', {
        customerName: `%${customerName}%`,
      });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('order.delivery_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    } else if (startDate) {
      queryBuilder.andWhere('order.delivery_date >= :startDate', { startDate });
    } else if (endDate) {
      queryBuilder.andWhere('order.delivery_date <= :endDate', { endDate });
    }

    return queryBuilder.orderBy('order.delivery_date', 'ASC').getMany();
  }

  /**
   * Find one order by ID
   */
  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'items.batch', 'creator'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  /**
   * Update order
   */
  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    return await this.dataSource.transaction(async (manager) => {
      // Load order WITHOUT items relation to avoid TypeORM tracking issues
      const order = await manager.findOne(Order, {
        where: { id },
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      // Check if order can be modified
      if (order.status === OrderStatus.DELIVERED) {
        throw new BadRequestException('Cannot modify delivered order');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Cannot modify cancelled order');
      }

      // Update basic fields
      if (updateOrderDto.customerName)
        order.customerName = updateOrderDto.customerName;
      if (updateOrderDto.customerPhone)
        order.customerPhone = updateOrderDto.customerPhone;
      if (updateOrderDto.customerEmail)
        order.customerEmail = updateOrderDto.customerEmail;
      if (updateOrderDto.deliveryDate)
        order.deliveryDate = new Date(updateOrderDto.deliveryDate);
      if (updateOrderDto.deliveryTime)
        order.deliveryTime = updateOrderDto.deliveryTime;
      if (updateOrderDto.notes !== undefined) order.notes = updateOrderDto.notes;
      if (updateOrderDto.internalNotes !== undefined)
        order.internalNotes = updateOrderDto.internalNotes;
      if (updateOrderDto.deposit !== undefined)
        order.deposit = updateOrderDto.deposit;
      if (updateOrderDto.discount !== undefined)
        order.discount = updateOrderDto.discount;

      // Handle items update if provided
      if (updateOrderDto.items && updateOrderDto.items.length > 0) {
        // 1. Get old batch IDs by querying directly (order.items is not loaded)
        const oldItems = await manager.find(OrderItem, {
          where: { orderId: order.id },
        });
        const oldBatchIds = oldItems
          .filter((item) => item.batchId)
          .map((item) => item.batchId as string);

        // 2. Delete existing order items
        await manager.delete(OrderItem, { orderId: order.id });

        // 3. Create new order items
        const newOrderItems: Partial<OrderItem>[] = [];
        let subtotal = 0;
        const newBatchIds: string[] = [];

        for (const itemDto of updateOrderDto.items) {
          const product = await manager.findOne(Product, {
            where: { id: itemDto.productId },
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

          let batchId: string | undefined;
          let unitPrice = Number(product.price);

          // Validate and reserve batch if provided
          if (itemDto.batchId) {
            const batch = await manager.findOne(ProductBatch, {
              where: { id: itemDto.batchId },
            });

            if (!batch) {
              throw new NotFoundException(
                `Batch with ID ${itemDto.batchId} not found`,
              );
            }

            if (batch.productId !== product.id) {
              throw new BadRequestException(
                `Batch ${batch.batchNumber} does not belong to product ${product.name}`,
              );
            }

            if (batch.isSold) {
              throw new BadRequestException(
                `Batch ${batch.batchNumber} is already sold`,
              );
            }

            // Check if batch is already reserved in another order (excluding current order)
            const existingOrderItem = await manager.findOne(OrderItem, {
              where: { batchId: batch.id },
              relations: ['order'],
            });

            if (existingOrderItem && existingOrderItem.orderId !== order.id) {
              const existingOrder = existingOrderItem.order;
              // Only block if the other order is active (not delivered or cancelled)
              if (
                existingOrder.status !== OrderStatus.DELIVERED &&
                existingOrder.status !== OrderStatus.CANCELLED
              ) {
                throw new BadRequestException(
                  `Batch ${batch.batchNumber} is already reserved in order ${existingOrder.orderNumber}`,
                );
              }
            }

            batchId = batch.id;
            unitPrice = Number(batch.unitPrice);
            newBatchIds.push(batch.id);
          }

          const quantity = itemDto.quantity;
          const discount = itemDto.discount || 0;
          const itemSubtotal = unitPrice * quantity - discount;

          subtotal += itemSubtotal;

          newOrderItems.push({
            productId: product.id,
            batchId,
            productName: product.name,
            productSku: product.sku,
            quantity,
            unit: product.unit || '',
            unitPrice,
            discount,
            subtotal: itemSubtotal,
            notes: itemDto.notes,
          } as Partial<OrderItem>);
        }

        // 4. Save new items
        for (const itemData of newOrderItems) {
          const orderItem = manager.create(OrderItem, {
            ...itemData,
            orderId: order.id,
          });
          await manager.save(OrderItem, orderItem);
        }

        // 5. Release old batches that are no longer in the order
        const batchesToRelease = oldBatchIds.filter(
          (id) => !newBatchIds.includes(id),
        );
        
        if (batchesToRelease.length > 0) {
          // Note: We don't actually "release" batches here because they're not marked
          // as reserved during order creation. Batches are only marked as sold when
          // the order is delivered or when sold through POS.
          // This is just for future reference if we implement a reservation system.
        }

        // 6. Update order totals
        const orderDiscount = updateOrderDto.discount || order.discount || 0;
        order.subtotal = subtotal;
        order.discount = orderDiscount;
        order.total = subtotal - orderDiscount;
      }

      // Handle status changes
      if (updateOrderDto.status && updateOrderDto.status !== order.status) {
        order.status = updateOrderDto.status;

        if (updateOrderDto.status === OrderStatus.DELIVERED) {
          order.deliveredAt = new Date();
        } else if (updateOrderDto.status === OrderStatus.CANCELLED) {
          order.cancelledAt = new Date();
          order.cancellationReason = updateOrderDto.cancellationReason;
        }
      }

      await manager.save(Order, order);

      // Return updated order with relations
      const updatedOrder = await manager.findOne(Order, {
        where: { id: order.id },
        relations: ['items', 'items.product', 'items.batch', 'creator'],
      });

      if (!updatedOrder) {
        throw new NotFoundException(`Order with ID ${id} not found after update`);
      }

      return updatedOrder;
    });
  }

  /**
   * Cancel order
   */
  async cancel(id: string, reason: string): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel delivered order');
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    return this.orderRepository.save(order);
  }

  /**
   * Mark order as ready (PENDING -> READY)
   */
  async markAsReady(id: string): Promise<Order> {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be marked as ready');
    }

    order.status = OrderStatus.READY;

    return this.orderRepository.save(order);
  }

  /**
   * Mark order as delivered (READY -> DELIVERED)
   * This also handles stock deduction and batch marking if no sale was made
   */
  async markAsDelivered(id: string): Promise<Order> {
    return await this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(Order, {
        where: { id },
        relations: ['items', 'items.product', 'items.batch'],
      });

      if (!order) {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }

      if (order.status !== OrderStatus.READY) {
        throw new BadRequestException(
          'Only ready orders can be marked as delivered',
        );
      }

      // If order was not paid through POS (no saleId), we need to handle stock
      if (!order.saleId) {
        for (const item of order.items) {
          // If item has a batch, mark it as sold
          if (item.batchId) {
            await manager.update(
              ProductBatch,
              { id: item.batchId },
              { isSold: true },
            );
          }
          // If product tracks inventory, deduct stock
          else if (item.product.trackInventory) {
            const currentStock = Number(item.product.stockQuantity);
            const quantity = Number(item.quantity);
            const newStock = currentStock - quantity;

            if (newStock < 0) {
              throw new BadRequestException(
                `Insufficient stock for product ${item.product.name}. Available: ${currentStock}, Required: ${quantity}`,
              );
            }

            await manager.update(
              Product,
              { id: item.productId },
              { stockQuantity: newStock },
            );
          }
        }
      }

      order.status = OrderStatus.DELIVERED;
      order.deliveredAt = new Date();

      return await manager.save(Order, order);
    });
  }

  /**
   * Get orders statistics
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
    const queryBuilder = this.orderRepository.createQueryBuilder('order');

    if (startDate && endDate) {
      queryBuilder.where('order.delivery_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const orders = await queryBuilder.getMany();

    const stats = {
      totalOrders: orders.length,
      pending: orders.filter((o) => o.status === OrderStatus.PENDING).length,
      ready: orders.filter((o) => o.status === OrderStatus.READY).length,
      delivered: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
      cancelled: orders.filter((o) => o.status === OrderStatus.CANCELLED).length,
      totalRevenue: orders
        .filter((o) => o.status === OrderStatus.DELIVERED)
        .reduce((sum, order) => sum + Number(order.total), 0),
      totalDeposits: orders.reduce((sum, order) => sum + Number(order.deposit || 0), 0),
      averageOrderValue:
        orders.length > 0
          ? orders.reduce((sum, order) => sum + Number(order.total), 0) / orders.length
          : 0,
    };

    return stats;
  }
}
