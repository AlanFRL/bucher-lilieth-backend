import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not, DataSource } from 'typeorm';
import { CashSession, CashSessionStatus } from './entities/cash-session.entity';
import { CashMovement, CashMovementType } from './entities/cash-movement.entity';
import { Sale } from '../sales/entities/sale.entity';
import { SaleItem } from '../sales/entities/sale-item.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { OpenSessionDto } from './dto/open-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';
import { CreateMovementDto } from './dto/create-movement.dto';

@Injectable()
export class CashSessionsService {
  constructor(
    @InjectRepository(CashSession)
    private readonly sessionRepository: Repository<CashSession>,
    @InjectRepository(CashMovement)
    private readonly movementRepository: Repository<CashMovement>,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Open a new cash session
   */
  async openSession(
    userId: string,
    openSessionDto: OpenSessionDto,
  ): Promise<CashSession> {
    // 1. Check if terminal already has an open session
    const existingTerminalSession = await this.sessionRepository.findOne({
      where: {
        terminalId: openSessionDto.terminalId,
        status: CashSessionStatus.OPEN,
      },
      relations: ['user', 'terminal'],
    });

    if (existingTerminalSession) {
      throw new BadRequestException(
        `Terminal "${existingTerminalSession.terminal.name}" already has an open session (opened by ${existingTerminalSession.user.fullName})`,
      );
    }

    // 2. Check if user already has an open session in ANY terminal
    const existingUserSession = await this.sessionRepository.findOne({
      where: {
        userId,
        status: CashSessionStatus.OPEN,
      },
      relations: ['user', 'terminal'],
    });

    if (existingUserSession) {
      throw new BadRequestException(
        `You already have an open session in terminal "${existingUserSession.terminal.name}". Please close it before opening a new one.`,
      );
    }

    // 3. Create new session
    const session = this.sessionRepository.create({
      ...openSessionDto,
      userId,
      expectedAmount: openSessionDto.openingAmount,
      status: CashSessionStatus.OPEN,
    });

    return await this.sessionRepository.save(session);
  }

  /**
   * Close a cash session
   * @param sessionId - ID of the session to close
   * @param userId - ID of the user closing the session
   * @param userRole - Role of the user (ADMIN, MANAGER, CASHIER)
   * @param closeSessionDto - Closing information
   */
  async closeSession(
    sessionId: string,
    userId: string,
    userRole: string,
    closeSessionDto: CloseSessionDto,
  ): Promise<CashSession> {
    const session = await this.findOne(sessionId);

    if (session.status === CashSessionStatus.CLOSED) {
      throw new BadRequestException('Session is already closed');
    }

    // Verificar permisos de cierre
    const isOwnSession = session.userId === userId;
    const isAdmin = userRole === 'ADMIN';
    const isManager = userRole === 'MANAGER';
    const canClose = isOwnSession || isAdmin || isManager;

    if (!canClose) {
      throw new ForbiddenException(
        'You can only close your own cash sessions. Contact an administrator or manager for assistance.',
      );
    }

    // Calculate difference
    const differenceAmount =
      closeSessionDto.closingAmount - session.expectedAmount;

    session.closingAmount = closeSessionDto.closingAmount;
    session.closingNotes = closeSessionDto.closingNotes;
    session.differenceAmount = differenceAmount;
    session.closedByUserId = userId; // Registrar quién cerró la sesión
    session.status = CashSessionStatus.CLOSED;
    session.closedAt = new Date();

    return await this.sessionRepository.save(session);
  }

  /**
   * Get all sessions with optional filters and pagination
   */
  async findAll(
    terminalId?: string,
    userId?: string,
    status?: CashSessionStatus,
    startDate?: Date,
    endDate?: Date,
    page?: number,
    limit?: number,
  ): Promise<CashSession[] | { data: CashSession[]; total: number; page: number; totalPages: number }> {
    const queryBuilder = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.terminal', 'terminal')
      .leftJoinAndSelect('session.user', 'user')
      .orderBy('session.openedAt', 'DESC');

    if (terminalId) {
      queryBuilder.andWhere('session.terminalId = :terminalId', { terminalId });
    }

    if (userId) {
      queryBuilder.andWhere('session.userId = :userId', { userId });
    }

    if (status) {
      queryBuilder.andWhere('session.status = :status', { status });
    }

    // Filtros de fecha: buscar por openedAt o closedAt dentro del rango
    // Usa directamente las fechas ISO recibidas del frontend (ya vienen con offset de Bolivia)
    if (startDate) {
      // Sesiones que se abrieron o cerraron después de startDate
      queryBuilder.andWhere(
        '(session.openedAt >= :startDate OR session.closedAt >= :startDate)',
        { startDate },
      );
    }

    if (endDate) {
      // Sesiones que se abrieron antes o en endDate
      // No sumar 1 día, usar directamente el endDate con hora 23:59:59 que viene del frontend
      queryBuilder.andWhere(
        'session.openedAt <= :endDate',
        { endDate },
      );
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
   * Get currently open session for a terminal
   */
  async getOpenSessionByTerminal(terminalId: string): Promise<CashSession | null> {
    return await this.sessionRepository.findOne({
      where: {
        terminalId,
        status: CashSessionStatus.OPEN,
      },
      relations: ['terminal', 'user', 'movements'],
    });
  }

  /**
   * Get currently open session for a user
   */
  async getOpenSessionByUser(userId: string): Promise<CashSession | null> {
    return await this.sessionRepository.findOne({
      where: {
        userId,
        status: CashSessionStatus.OPEN,
      },
      relations: ['terminal', 'user', 'movements'],
    });
  }

  /**
   * Find one session by ID
   */
  async findOne(id: string): Promise<CashSession> {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: ['terminal', 'user', 'movements', 'movements.creator'],
    });

    if (!session) {
      throw new NotFoundException(`Cash session with ID ${id} not found`);
    }

    return session;
  }

  /**
   * Add a cash movement to a session
   */
  async addMovement(
    sessionId: string,
    userId: string,
    createMovementDto: CreateMovementDto,
  ): Promise<CashMovement> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException(`Cash session with ID ${sessionId} not found`);
    }

    if (session.status === CashSessionStatus.CLOSED) {
      throw new BadRequestException('Cannot add movements to a closed session');
    }

    // Create movement
    const movement = this.movementRepository.create({
      ...createMovementDto,
      sessionId,
      createdBy: userId,
    });

    const savedMovement = await this.movementRepository.save(movement);

    // Update expected amount based on movement type
    if (createMovementDto.type === CashMovementType.DEPOSIT) {
      session.expectedAmount = Number(session.expectedAmount) + Number(createMovementDto.amount);
    } else if (createMovementDto.type === CashMovementType.WITHDRAWAL) {
      session.expectedAmount = Number(session.expectedAmount) - Number(createMovementDto.amount);
    }
    // ADJUSTMENT doesn't change expected amount, it's just for records

    await this.sessionRepository.save(session);

    return savedMovement;
  }

  /**
   * Get movements for a session
   */
  async getSessionMovements(sessionId: string): Promise<CashMovement[]> {
    const session = await this.findOne(sessionId);
    
    return await this.movementRepository.find({
      where: { sessionId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string) {
    const session = await this.findOne(sessionId);
    const movements = await this.getSessionMovements(sessionId);

    const deposits = movements
      .filter((m) => m.type === CashMovementType.DEPOSIT)
      .reduce((sum, m) => sum + Number(m.amount), 0);

    const withdrawals = movements
      .filter((m) => m.type === CashMovementType.WITHDRAWAL)
      .reduce((sum, m) => sum + Number(m.amount), 0);

    return {
      session,
      movements,
      stats: {
        totalDeposits: deposits,
        totalWithdrawals: withdrawals,
        netMovements: deposits - withdrawals,
        movementCount: movements.length,
      },
    };
  }

  /**
   * Delete a closed session (ADMIN only)
   * Deletes all sales, movements, restores inventory, and cleans up orders
   */
  async remove(id: string, userId: string): Promise<void> {
    return await this.dataSource.transaction(async (manager) => {
      // 1. Find session
      const session = await manager.findOne(CashSession, {
        where: { id },
      });

      if (!session) {
        throw new NotFoundException(`Session with ID ${id} not found`);
      }

      // 2. Verify session is CLOSED
      if (session.status !== CashSessionStatus.CLOSED) {
        throw new BadRequestException(
          'Cannot delete an open session. Close the session first.'
        );
      }

      // 3. Verify it's not the user's current session
      const currentSession = await manager.findOne(CashSession, {
        where: {
          userId,
          status: CashSessionStatus.OPEN,
        },
      });

      if (currentSession && currentSession.id === id) {
        throw new BadRequestException(
          'Cannot delete your current open session'
        );
      }

      // 4. Get all sales from this session
      const sales = await manager.find(Sale, {
        where: { sessionId: id },
        relations: ['items', 'items.product'],
      });

      // 5. For each sale: restore inventory and clean up orders
      for (const sale of sales) {
        // Restore inventory for UNIT products
        for (const item of sale.items) {
          const product = await manager.findOne(Product, {
            where: { id: item.productId },
          });

          if (product && product.saleType === 'UNIT') {
            product.stockQuantity = Number(product.stockQuantity || 0) + Number(item.quantity);
            await manager.save(Product, product);
          }
        }

        // Clean up associated order
        if (sale.orderId) {
          const order = await manager.findOne(Order, {
            where: { id: sale.orderId },
          });

          if (order) {
            order.saleId = undefined;
            order.status = OrderStatus.READY;
            await manager.save(Order, order);
          }
        }

        // Delete sale (sale_items will be cascade deleted)
        await manager.remove(Sale, sale);
      }

      // 6. Delete all cash movements
      const movements = await manager.find(CashMovement, {
        where: { sessionId: id },
      });
      await manager.remove(CashMovement, movements);

      // 7. Delete the session itself
      await manager.remove(CashSession, session);
    });
  }
}
