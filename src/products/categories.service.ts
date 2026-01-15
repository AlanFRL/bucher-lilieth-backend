import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findAll(search?: string): Promise<ProductCategory[]> {
    const where: any = { isActive: true };
    
    if (search) {
      where.name = Like(`%${search}%`);
    }

    return this.categoriesRepository.find({
      where,
      order: { name: 'ASC' },
    });
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
    updateData: Partial<CreateCategoryDto>,
  ): Promise<ProductCategory> {
    const category = await this.findOne(id);
    Object.assign(category, updateData);
    return this.categoriesRepository.save(category);
  }

  async deactivate(id: string): Promise<void> {
    const category = await this.findOne(id);
    category.isActive = false;
    await this.categoriesRepository.save(category);
  }
}
