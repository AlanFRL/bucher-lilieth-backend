import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // Validate that at least name or company is provided
    if (!createCustomerDto.name && !createCustomerDto.company) {
      throw new BadRequestException('Either name or company must be provided');
    }

    const customer = this.customersRepository.create(createCustomerDto);
    return this.customersRepository.save(customer);
  }

  async findAll(search?: string): Promise<Customer[]> {
    if (search) {
      return this.customersRepository.find({
        where: [
          { name: ILike(`%${search}%`) },
          { company: ILike(`%${search}%`) },
          { phone: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
        ],
        order: {
          createdAt: 'DESC',
        },
      });
    }

    return this.customersRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customersRepository.findOne({
      where: { id },
      relations: ['orders', 'sales'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);

    // If updating name or company, ensure at least one remains
    const updatedName = updateCustomerDto.name !== undefined ? updateCustomerDto.name : customer.name;
    const updatedCompany = updateCustomerDto.company !== undefined ? updateCustomerDto.company : customer.company;

    if (!updatedName && !updatedCompany) {
      throw new BadRequestException('Either name or company must be provided');
    }

    Object.assign(customer, updateCustomerDto);
    return this.customersRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findOne(id);

    // Check if customer has orders or sales
    const orderCount = await this.customersRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.orders', 'order')
      .where('customer.id = :id', { id })
      .andWhere('order.id IS NOT NULL')
      .getCount();

    const saleCount = await this.customersRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.sales', 'sale')
      .where('customer.id = :id', { id })
      .andWhere('sale.id IS NOT NULL')
      .getCount();

    if (orderCount > 0 || saleCount > 0) {
      throw new BadRequestException(
        'Cannot delete customer with associated orders or sales',
      );
    }

    await this.customersRepository.remove(customer);
  }

  async search(query: string): Promise<Customer[]> {
    return this.findAll(query);
  }
}
