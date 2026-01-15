import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Sale, SaleStatus } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { CashSession, CashSessionStatus } from '../cash-sessions/entities/cash-session.entity';
import { CashMovement, CashMovementType } from '../cash-sessions/entities/cash-movement.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(CashSession)
    private readonly cashSessionRepository: Repository<CashSession>,
    @InjectRepository(CashMovement)
    private readonly cashMovementRepository: Repository<CashMovement>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Sales Report
   * Returns sales statistics for a given date range
   */
  async getSalesReport(startDate?: string, endDate?: string) {
    const whereClause: any = { status: SaleStatus.COMPLETED };

    if (startDate && endDate) {
      whereClause.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereClause.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereClause.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const sales = await this.saleRepository.find({
      where: whereClause,
      relations: ['items', 'cashier'],
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Payment methods breakdown
    const paymentMethods = sales.reduce(
      (acc, sale) => {
        acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + Number(sale.total);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Sales by cashier
    const salesByCashier = sales.reduce(
      (acc, sale) => {
        const cashierName = sale.cashier.fullName;
        if (!acc[cashierName]) {
          acc[cashierName] = { count: 0, revenue: 0 };
        }
        acc[cashierName].count++;
        acc[cashierName].revenue += Number(sale.total);
        return acc;
      },
      {} as Record<string, { count: number; revenue: number }>,
    );

    // Daily sales trend (group by date)
    const dailySales = sales.reduce(
      (acc, sale) => {
        const date = sale.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { count: 0, revenue: 0 };
        }
        acc[date].count++;
        acc[date].revenue += Number(sale.total);
        return acc;
      },
      {} as Record<string, { count: number; revenue: number }>,
    );

    return {
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary: {
        totalSales,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageTicket: Math.round(averageTicket * 100) / 100,
      },
      paymentMethods,
      salesByCashier,
      dailySales,
    };
  }

  /**
   * Products Report
   * Returns product sales statistics
   */
  async getProductsReport(startDate?: string, endDate?: string) {
    const whereClause: any = { sale: { status: SaleStatus.COMPLETED } };

    if (startDate && endDate) {
      whereClause.sale = {
        ...whereClause.sale,
        createdAt: Between(new Date(startDate), new Date(endDate)),
      };
    } else if (startDate) {
      whereClause.sale = {
        ...whereClause.sale,
        createdAt: MoreThanOrEqual(new Date(startDate)),
      };
    } else if (endDate) {
      whereClause.sale = {
        ...whereClause.sale,
        createdAt: LessThanOrEqual(new Date(endDate)),
      };
    }

    const saleItems = await this.saleItemRepository.find({
      where: whereClause,
      relations: ['product', 'sale'],
    });

    // Group by product
    const productStats = saleItems.reduce(
      (acc, item) => {
        const productId = item.productId;
        if (!acc[productId]) {
          acc[productId] = {
            productId,
            productName: item.productName,
            productSku: item.productSku,
            quantitySold: 0,
            revenue: 0,
            timesOrdered: 0,
            unit: item.unit || '',
          };
        }
        acc[productId].quantitySold += Number(item.quantity);
        acc[productId].revenue += Number(item.subtotal);
        acc[productId].timesOrdered++;
        return acc;
      },
      {} as Record<
        string,
        {
          productId: string;
          productName: string;
          productSku: string;
          quantitySold: number;
          revenue: number;
          timesOrdered: number;
          unit: string;
        }
      >,
    );

    const productsArray = Object.values(productStats).map((p) => ({
      ...p,
      quantitySold: Math.round(p.quantitySold * 1000) / 1000,
      revenue: Math.round(p.revenue * 100) / 100,
    }));

    // Sort by revenue (best sellers first)
    productsArray.sort((a, b) => b.revenue - a.revenue);

    // Get top 10 best sellers
    const topProducts = productsArray.slice(0, 10);

    // Get current inventory status
    const allProducts = await this.productRepository.find({
      where: { isActive: true },
      select: ['id', 'name', 'sku', 'stockQuantity', 'minStock', 'unit'],
    });

    const lowStock = allProducts.filter(
      (p) => Number(p.stockQuantity) <= Number(p.minStock),
    );

    return {
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary: {
        totalProducts: productsArray.length,
        totalQuantitySold: Math.round(
          productsArray.reduce((sum, p) => sum + p.quantitySold, 0) * 1000,
        ) / 1000,
        totalRevenue: Math.round(
          productsArray.reduce((sum, p) => sum + p.revenue, 0) * 100,
        ) / 100,
      },
      topProducts,
      allProducts: productsArray,
      inventory: {
        totalProducts: allProducts.length,
        lowStockCount: lowStock.length,
        lowStockProducts: lowStock.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          currentStock: Number(p.stockQuantity),
          minStock: Number(p.minStock),
          unit: p.unit,
        })),
      },
    };
  }

  /**
   * Cash Sessions Report
   * Returns cash session statistics
   */
  async getCashSessionsReport(startDate?: string, endDate?: string) {
    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.openedAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereClause.openedAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereClause.openedAt = LessThanOrEqual(new Date(endDate));
    }

    const sessions = await this.cashSessionRepository.find({
      where: whereClause,
      relations: ['terminal', 'user', 'movements'],
      order: { openedAt: 'DESC' },
    });

    const totalSessions = sessions.length;
    const openSessions = sessions.filter((s) => s.status === 'OPEN').length;
    const closedSessions = sessions.filter((s) => s.status === 'CLOSED').length;

    let totalCashIn = 0;
    let totalCashOut = 0;
    let totalExpected = 0;
    let totalActual = 0;
    let totalDifference = 0;

    sessions.forEach((session) => {
      if (session.status === CashSessionStatus.CLOSED) {
        totalExpected += Number(session.expectedAmount || 0);
        totalActual += Number(session.closingAmount || 0);
        totalDifference += Number(session.differenceAmount || 0);
      }
      
      // Sum movements
      session.movements.forEach((movement) => {
        if (movement.type === CashMovementType.DEPOSIT) {
          totalCashIn += Number(movement.amount);
        } else if (movement.type === CashMovementType.WITHDRAWAL) {
          totalCashOut += Number(movement.amount);
        }
      });
    });

    // Sessions by terminal
    const sessionsByTerminal = sessions.reduce(
      (acc, session) => {
        const terminalName = session.terminal.name;
        if (!acc[terminalName]) {
          acc[terminalName] = { count: 0 };
        }
        acc[terminalName].count++;
        return acc;
      },
      {} as Record<string, { count: number }>,
    );

    return {
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary: {
        totalSessions,
        openSessions,
        closedSessions,
        totalCashIn: Math.round(totalCashIn * 100) / 100,
        totalCashOut: Math.round(totalCashOut * 100) / 100,
        totalExpected: Math.round(totalExpected * 100) / 100,
        totalActual: Math.round(totalActual * 100) / 100,
        totalDifference: Math.round(totalDifference * 100) / 100,
      },
      sessionsByTerminal,
      recentSessions: sessions.slice(0, 10).map((s) => ({
        id: s.id,
        terminalName: s.terminal.name,
        openedBy: s.user.fullName,
        openedAt: s.openedAt,
        closedAt: s.closedAt,
        status: s.status,
        difference: s.differenceAmount ? Number(s.differenceAmount) : null,
      })),
    };
  }

  /**
   * Orders Report
   * Returns order statistics
   */
  async getOrdersReport(startDate?: string, endDate?: string) {
    const whereClause: any = {};

    if (startDate && endDate) {
      whereClause.createdAt = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      whereClause.createdAt = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      whereClause.createdAt = LessThanOrEqual(new Date(endDate));
    }

    const orders = await this.orderRepository.find({
      where: whereClause,
      relations: ['items', 'creator'],
    });

    const totalOrders = orders.length;

    // Count by status
    const statusCounts = {
      pending: orders.filter((o) => o.status === OrderStatus.PENDING).length,
      ready: orders.filter((o) => o.status === OrderStatus.READY).length,
      delivered: orders.filter((o) => o.status === OrderStatus.DELIVERED).length,
      cancelled: orders.filter((o) => o.status === OrderStatus.CANCELLED).length,
    };

    const totalRevenue = orders
      .filter((o) => o.status === OrderStatus.DELIVERED)
      .reduce((sum, order) => sum + Number(order.total), 0);

    const totalDeposits = orders.reduce(
      (sum, order) => sum + Number(order.deposit || 0),
      0,
    );

    const averageOrderValue =
      totalOrders > 0
        ? orders.reduce((sum, order) => sum + Number(order.total), 0) / totalOrders
        : 0;

    // Upcoming deliveries (orders that are ready or pending with future delivery dates)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingOrders = orders
      .filter(
        (o) =>
          (o.status === OrderStatus.PENDING || o.status === OrderStatus.READY) &&
          new Date(o.deliveryDate) >= today,
      )
      .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
      .slice(0, 10)
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        deliveryDate: o.deliveryDate,
        deliveryTime: o.deliveryTime,
        status: o.status,
        total: Number(o.total),
        deposit: Number(o.deposit || 0),
      }));

    return {
      period: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
      summary: {
        totalOrders,
        ...statusCounts,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalDeposits: Math.round(totalDeposits * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      },
      upcomingDeliveries: upcomingOrders,
    };
  }

  /**
   * Dashboard Summary
   * Returns key metrics for dashboard
   */
  async getDashboardSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's sales
    const todaySales = await this.saleRepository.find({
      where: {
        status: SaleStatus.COMPLETED,
        createdAt: Between(today, tomorrow),
      },
    });

    const todayRevenue = todaySales.reduce(
      (sum, sale) => sum + Number(sale.total),
      0,
    );

    // Open sessions
    const openSessions = await this.cashSessionRepository.count({
      where: { status: CashSessionStatus.OPEN },
    });

    // Pending orders
    const pendingOrders = await this.orderRepository.count({
      where: { status: OrderStatus.PENDING },
    });

    // Low stock products
    const allProducts = await this.productRepository.find({
      where: { isActive: true },
    });
    const lowStockCount = allProducts.filter(
      (p) => Number(p.stockQuantity) <= Number(p.minStock),
    ).length;

    // Upcoming deliveries (today and tomorrow)
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const upcomingDeliveries = await this.orderRepository.count({
      where: {
        status: OrderStatus.READY,
        deliveryDate: Between(today, dayAfterTomorrow),
      },
    });

    return {
      today: {
        sales: todaySales.length,
        revenue: Math.round(todayRevenue * 100) / 100,
      },
      alerts: {
        openSessions,
        pendingOrders,
        lowStockProducts: lowStockCount,
        upcomingDeliveries,
      },
    };
  }
}
