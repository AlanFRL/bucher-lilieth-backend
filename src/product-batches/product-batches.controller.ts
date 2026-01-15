import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductBatchesService } from './product-batches.service';
import { CreateProductBatchDto } from './dto/create-product-batch.dto';
import { UpdateProductBatchDto } from './dto/update-product-batch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('product-batches')
@UseGuards(JwtAuthGuard)
export class ProductBatchesController {
  constructor(private readonly batchesService: ProductBatchesService) {}

  @Post()
  create(@Body() createDto: CreateProductBatchDto) {
    return this.batchesService.create(createDto);
  }

  @Get()
  findAll(
    @Query('productId') productId?: string,
    @Query('isSold') isSold?: string,
    @Query('includeReservationStatus') includeReservationStatus?: string,
  ) {
    const filters: any = {};
    
    if (productId) filters.productId = productId;
    if (isSold !== undefined) filters.isSold = isSold === 'true';
    if (includeReservationStatus !== undefined) {
      filters.includeReservationStatus = includeReservationStatus === 'true';
    }

    return this.batchesService.findAll(filters);
  }

  @Get('available/:productId')
  getAvailableByProduct(@Param('productId') productId: string) {
    return this.batchesService.getAvailableByProduct(productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.batchesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateProductBatchDto) {
    return this.batchesService.update(id, updateDto);
  }

  @Patch(':id/mark-sold')
  markAsSold(@Param('id') id: string) {
    return this.batchesService.markAsSold(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.batchesService.remove(id);
  }
}
