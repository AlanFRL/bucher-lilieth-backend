import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * Create a new sale
   */
  @Post()
  create(@Request() req, @Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(req.user.id, createSaleDto);
  }

  /**
   * Get sales statistics (general)
   */
  @Get('statistics')
  getStatistics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.salesService.getStatistics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get all sales with optional filters and pagination
   */
  @Get()
  findAll(
    @Query('sessionId') sessionId?: string,
    @Query('cashierId') cashierId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    console.log('🔍 [SalesController] Query params received:', {
      sessionId,
      cashierId,
      startDate,
      endDate,
      page,
      limit,
      pageType: typeof page,
      limitType: typeof limit,
    });

    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;

    console.log('🔍 [SalesController] Parsed pagination:', {
      pageNum,
      limitNum,
      pageNumType: typeof pageNum,
      limitNumType: typeof limitNum,
    });

    return this.salesService.findAll(
      sessionId,
      cashierId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      pageNum,
      limitNum,
    );
  }

  /**
   * Get sales statistics for a session
   */
  @Get('session/:sessionId/stats')
  getSessionStats(@Param('sessionId') sessionId: string) {
    return this.salesService.getSessionStats(sessionId);
  }

  /**
   * Get sale by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  /**
   * Cancel a sale
   */
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Body('reason') reason: string) {
    return this.salesService.cancel(id, reason);
  }
}
