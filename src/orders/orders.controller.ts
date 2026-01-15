import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderStatus } from './entities/order.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Create a new order
   */
  @Post()
  create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(req.user.id, createOrderDto);
  }

  /**
   * Get all orders with optional filters
   */
  @Get()
  findAll(
    @Query('status') status?: OrderStatus,
    @Query('customerName') customerName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.findAll(
      status,
      customerName,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get orders statistics
   */
  @Get('statistics')
  getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.getStatistics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get one order by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  /**
   * Update an order
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  /**
   * Mark order as ready (PENDING -> READY)
   */
  @Patch(':id/ready')
  markAsReady(@Param('id') id: string) {
    return this.ordersService.markAsReady(id);
  }

  /**
   * Mark order as delivered (READY -> DELIVERED)
   */
  @Patch(':id/delivered')
  markAsDelivered(@Param('id') id: string) {
    return this.ordersService.markAsDelivered(id);
  }

  /**
   * Cancel an order
   */
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body('reason') reason: string) {
    return this.ordersService.cancel(id, reason);
  }
}
