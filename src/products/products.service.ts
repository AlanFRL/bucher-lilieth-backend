import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Check if SKU already exists
    const existingSku = await this.productsRepository.findOne({
      where: { sku: createProductDto.sku },
    });

    if (existingSku) {
      throw new BadRequestException(`SKU ${createProductDto.sku} already exists`);
    }

    // Check if barcode already exists
    if (createProductDto.barcode) {
      const existingBarcode = await this.productsRepository.findOne({
        where: { barcode: createProductDto.barcode },
      });

      if (existingBarcode) {
        throw new BadRequestException(
          `Barcode ${createProductDto.barcode} already exists`,
        );
      }
    }

    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  async findAll(search?: string, categoryId?: string): Promise<Product[]> {
    const queryBuilder = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search OR product.barcode ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }

    return queryBuilder.orderBy('product.name', 'ASC').getMany();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id, isActive: true },
      relations: ['category'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    return this.productsRepository.findOne({
      where: { barcode, isActive: true },
      relations: ['category'],
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.productsRepository.findOne({
      where: { sku, isActive: true },
      relations: ['category'],
    });
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Check SKU uniqueness if changing
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingSku = await this.productsRepository.findOne({
        where: { sku: updateProductDto.sku },
      });

      if (existingSku) {
        throw new BadRequestException(`SKU ${updateProductDto.sku} already exists`);
      }
    }

    // Check barcode uniqueness if changing
    if (updateProductDto.barcode && updateProductDto.barcode !== product.barcode) {
      const existingBarcode = await this.productsRepository.findOne({
        where: { barcode: updateProductDto.barcode },
      });

      if (existingBarcode) {
        throw new BadRequestException(
          `Barcode ${updateProductDto.barcode} already exists`,
        );
      }
    }

    Object.assign(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const product = await this.findOne(id);
    
    if (!product.trackInventory) {
      throw new BadRequestException('Product does not track inventory');
    }

    product.stockQuantity = quantity;
    return this.productsRepository.save(product);
  }

  async adjustStock(id: string, adjustment: number): Promise<Product> {
    const product = await this.findOne(id);
    
    if (!product.trackInventory) {
      throw new BadRequestException('Product does not track inventory');
    }

    product.stockQuantity = Number(product.stockQuantity) + adjustment;
    
    if (product.stockQuantity < 0) {
      throw new BadRequestException('Insufficient stock');
    }

    return this.productsRepository.save(product);
  }

  async deactivate(id: string): Promise<void> {
    const product = await this.findOne(id);
    product.isActive = false;
    await this.productsRepository.save(product);
  }

  async getLowStock(): Promise<Product[]> {
    return this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.trackInventory = :trackInventory', { trackInventory: true })
      .andWhere('product.stockQuantity <= product.minStock')
      .orderBy('product.stockQuantity', 'ASC')
      .getMany();
  }
}
