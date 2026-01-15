import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductBatchesService } from './product-batches.service';
import { ProductBatchesController } from './product-batches.controller';
import { ProductBatch } from './entities/product-batch.entity';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../orders/entities/order-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductBatch, Product, OrderItem])],
  controllers: [ProductBatchesController],
  providers: [ProductBatchesService],
  exports: [ProductBatchesService],
})
export class ProductBatchesModule {}
