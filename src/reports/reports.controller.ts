import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DateFilterDto } from './dto/date-filter.dto';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  async getSalesReport(@Query() filters: DateFilterDto) {
    return this.reportsService.getSalesReport(filters.startDate, filters.endDate);
  }

  @Get('products')
  async getProductsReport(@Query() filters: DateFilterDto) {
    return this.reportsService.getProductsReport(filters.startDate, filters.endDate);
  }

  @Get('cash-sessions')
  async getCashSessionsReport(@Query() filters: DateFilterDto) {
    return this.reportsService.getCashSessionsReport(
      filters.startDate,
      filters.endDate,
    );
  }

  @Get('orders')
  async getOrdersReport(@Query() filters: DateFilterDto) {
    return this.reportsService.getOrdersReport(filters.startDate, filters.endDate);
  }

  @Get('dashboard')
  async getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }
}
