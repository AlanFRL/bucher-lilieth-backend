import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Product, BarcodeType } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(ProductCategory)
    private categoriesRepository: Repository<ProductCategory>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Validate barcode format only if not NONE
    if (createProductDto.barcodeType !== BarcodeType.NONE) {
      if (!createProductDto.barcode) {
        throw new BadRequestException('Barcode is required when barcodeType is not NONE');
      }
      
      this.validateBarcodeFormat(createProductDto.barcode, createProductDto.barcodeType);

      // Check if barcode already exists
      const existingBarcode = await this.productsRepository.findOne({
        where: { barcode: createProductDto.barcode },
      });

      if (existingBarcode) {
        throw new ConflictException(
          `Barcode ${createProductDto.barcode} already exists`,
        );
      }
    }

    // Auto-generate SKU based on category
    const sku = await this.generateSku(createProductDto.categoryId);

    const product = this.productsRepository.create({
      ...createProductDto,
      sku,
      barcode: createProductDto.barcodeType === BarcodeType.NONE ? undefined : createProductDto.barcode,
    });

    return this.productsRepository.save(product);
  }

  /**
   * Generate SKU automatically based on category
   * Format: {PREFIX}-{NUMBER}
   * Example: CARN-0001, AVES-0002
   */
  private async generateSku(categoryId: string): Promise<string> {
    // Get category to generate prefix
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${categoryId} not found`);
    }

    const prefix = this.generatePrefix(category.name);

    // Find last SKU with this prefix
    const lastProduct = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.sku LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('product.sku', 'DESC')
      .getOne();

    let nextNumber = 1;

    if (lastProduct) {
      // Extract number from SKU: "CARN-0042" → 42
      const match = lastProduct.sku.match(/-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Format: CARN-0001
    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Generate prefix from category name
   * Takes first 2 letters of each word, up to 4 characters
   * Examples:
   * - "Carnes de Res" → "CARN" (CA + RN)
   * - "Aves" → "AVES" (AVES + padding)
   * - "Embutidos" → "EMBU" (first 4 letters)
   */
  private generatePrefix(categoryName: string): string {
    return categoryName
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .split(/\s+/) // Split by spaces
      .map(word => word.substring(0, 2)) // Take first 2 letters of each word
      .join('') // Join
      .substring(0, 4) // Max 4 characters
      .toUpperCase() // Uppercase
      .padEnd(4, 'X'); // Pad with X if too short
  }

  /**
   * Validate barcode format based on type
   */
  private validateBarcodeFormat(barcode: string, barcodeType: BarcodeType): void {
    if (barcodeType === BarcodeType.WEIGHT_EMBEDDED) {
      // For weight-embedded (scale), should be 6 digits (W segment)
      if (!/^\d{6}$/.test(barcode)) {
        throw new BadRequestException(
          'For weight-embedded products, barcode must be 6 digits (W segment from scale)',
        );
      }
    } else if (barcodeType === BarcodeType.STANDARD) {
      // For standard barcodes, should be 8-14 digits
      if (!/^\d{8,14}$/.test(barcode)) {
        throw new BadRequestException(
          'Standard barcode must be between 8 and 14 digits',
        );
      }
    }
    // NONE type has no barcode, no validation needed
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

    // SKU is immutable - cannot be changed after creation
    // It's not even in UpdateProductDto anymore

    // Validate barcode format if changing
    if (updateProductDto.barcode && updateProductDto.barcodeType) {
      this.validateBarcodeFormat(updateProductDto.barcode, updateProductDto.barcodeType);
    }

    // Check barcode uniqueness if changing
    if (updateProductDto.barcode && updateProductDto.barcode !== product.barcode) {
      const existingBarcode = await this.productsRepository.findOne({
        where: { barcode: updateProductDto.barcode },
      });

      if (existingBarcode && existingBarcode.id !== id) {
        throw new ConflictException(
          `Barcode ${updateProductDto.barcode} already exists`,
        );
      }
    }

    // Merge updates but preserve SKU
    Object.assign(product, updateProductDto);
    // Ensure SKU never changes
    product.sku = product.sku;

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
