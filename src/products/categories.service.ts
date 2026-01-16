import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ProductCategory } from './entities/product-category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(ProductCategory)
    private categoriesRepository: Repository<ProductCategory>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<ProductCategory> {
    const category = this.categoriesRepository.create(createCategoryDto);
    return this.categoriesRepository.save(category);
  }

  async findAll(search?: string, includeInactive = false): Promise<any[]> {
    const where: any = {};
    
    if (!includeInactive) {
      where.isActive = true;
    }
    
    if (search) {
      where.name = Like(`%${search}%`);
    }

    const categories = await this.categoriesRepository.find({
      where,
      relations: ['products'],
      order: { name: 'ASC' },
    });

    // Agregar productCount a cada categoría
    return categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
      productCount: category.products?.filter(p => p.isActive).length || 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
  }

  async findOne(id: string): Promise<ProductCategory> {
    const category = await this.categoriesRepository.findOne({
      where: { id, isActive: true },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async update(
    id: string,
    updateData: Partial<CreateCategoryDto & { isActive?: boolean }>,
  ): Promise<ProductCategory> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    Object.assign(category, updateData);
    return this.categoriesRepository.save(category);
  }

  async deactivate(id: string): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    category.isActive = false;
    await this.categoriesRepository.save(category);
  }

  async getProductCount(id: string): Promise<number> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category.products?.filter(p => p.isActive).length || 0;
  }

  async delete(id: string): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    // Validar que no tenga productos activos asociados
    const activeProductsCount = category.products?.filter(p => p.isActive).length || 0;
    if (activeProductsCount > 0) {
      throw new BadRequestException(
        `No se puede eliminar la categoría "${category.name}" porque tiene ${activeProductsCount} producto(s) asociado(s). ` +
        'Debes reasignar los productos a otra categoría, eliminarlos, o desactivar la categoría en su lugar.'
      );
    }

    await this.categoriesRepository.remove(category);
  }
}
