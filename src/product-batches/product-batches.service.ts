import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductBatch } from './entities/product-batch.entity';
import { CreateProductBatchDto } from './dto/create-product-batch.dto';
import { UpdateProductBatchDto } from './dto/update-product-batch.dto';
import { Product } from '../products/entities/product.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class ProductBatchesService {
  constructor(
    @InjectRepository(ProductBatch)
    private batchesRepository: Repository<ProductBatch>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
  ) {}

  async create(createDto: CreateProductBatchDto): Promise<ProductBatch> {
    // Validar que el producto existe y es VACUUM_PACKED
    const product = await this.productsRepository.findOne({
      where: { id: createDto.productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.inventoryType !== 'VACUUM_PACKED') {
      throw new BadRequestException('Product must be VACUUM_PACKED type');
    }

    const batch = this.batchesRepository.create(createDto);
    return await this.batchesRepository.save(batch);
  }

  async findAll(filters?: {
    productId?: string;
    isSold?: boolean;
    includeReservationStatus?: boolean;
  }): Promise<any[]> {
    const query = this.batchesRepository
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.product', 'product')
      .orderBy('batch.packedAt', 'DESC');

    if (filters?.productId) {
      query.andWhere('batch.productId = :productId', {
        productId: filters.productId,
      });
    }

    if (filters?.isSold !== undefined) {
      query.andWhere('batch.isSold = :isSold', { isSold: filters.isSold });
    }

    const batches = await query.getMany();

    // Si se solicita información de reserva, agregar el campo
    if (filters?.includeReservationStatus) {
      const batchesWithStatus = await Promise.all(
        batches.map(async (batch) => {
          const orderItem = await this.orderItemsRepository.findOne({
            where: { batchId: batch.id },
            relations: ['order'],
          });

          // Batch is reserved if it's in an active order (PENDING or READY)
          const isReserved = orderItem && 
            orderItem.order.status !== OrderStatus.CANCELLED &&
            orderItem.order.status !== OrderStatus.DELIVERED;

          return {
            ...batch,
            isReserved,
            reservedInOrder: isReserved ? orderItem.order.orderNumber : null,
          };
        }),
      );

      return batchesWithStatus;
    }

    return batches;
  }

  async findOne(id: string): Promise<ProductBatch> {
    const batch = await this.batchesRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return batch;
  }

  async update(
    id: string,
    updateDto: UpdateProductBatchDto,
  ): Promise<ProductBatch> {
    const batch = await this.findOne(id);
    Object.assign(batch, updateDto);
    return await this.batchesRepository.save(batch);
  }

  async remove(id: string): Promise<void> {
    const batch = await this.findOne(id);
    
    if (batch.isSold) {
      throw new BadRequestException('Cannot delete sold batch');
    }

    await this.batchesRepository.remove(batch);
  }

  async markAsSold(id: string): Promise<ProductBatch> {
    const batch = await this.findOne(id);
    
    if (batch.isSold) {
      throw new BadRequestException('Batch already sold');
    }

    batch.isSold = true;
    return await this.batchesRepository.save(batch);
  }

  async getAvailableByProduct(productId: string): Promise<ProductBatch[]> {
    return await this.batchesRepository.find({
      where: {
        productId,
        isSold: false,
      },
      order: {
        packedAt: 'ASC', // FIFO: First In, First Out
      },
    });
  }
}
