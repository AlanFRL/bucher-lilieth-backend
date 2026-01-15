import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create({
      username: createUserDto.username,
      fullName: createUserDto.fullName,
      role: createUserDto.role,
      pin: await bcrypt.hash(createUserDto.pin, 10),
    });

    if (createUserDto.password) {
      user.passwordHash = await bcrypt.hash(createUserDto.password, 10);
    }

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: [
        'id',
        'username',
        'fullName',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
      order: {
        isActive: 'DESC',
        username: 'ASC',
      },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'fullName',
        'role',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username, isActive: true },
    });
  }

  async validatePassword(
    user: User,
    password: string,
  ): Promise<boolean> {
    if (!user.passwordHash) return false;
    return bcrypt.compare(password, user.passwordHash);
  }

  async validatePin(user: User, pin: string): Promise<boolean> {
    if (!user.pin) return false;
    return bcrypt.compare(pin, user.pin);
  }

  async update(id: string, updateData: { 
    username?: string; 
    fullName?: string; 
    role?: UserRole; 
    isActive?: boolean; 
    password?: string; 
    pin?: string; 
  }): Promise<User> {
    const user = await this.findOne(id);

    // Update basic fields
    if (updateData.username) user.username = updateData.username;
    if (updateData.fullName) user.fullName = updateData.fullName;
    if (updateData.role) user.role = updateData.role;
    if (updateData.isActive !== undefined) user.isActive = updateData.isActive;

    // Hash password if provided
    if (updateData.password) {
      user.passwordHash = await bcrypt.hash(updateData.password, 10);
    }

    // Hash PIN if provided
    if (updateData.pin) {
      user.pin = await bcrypt.hash(updateData.pin, 10);
    }

    return this.usersRepository.save(user);
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if user has associated cash sessions
    const cashSessionCount = await this.usersRepository.manager.query(
      'SELECT COUNT(*) as count FROM cash_sessions WHERE user_id = $1',
      [id],
    );

    // Check if user has associated sales
    const salesCount = await this.usersRepository.manager.query(
      'SELECT COUNT(*) as count FROM sales WHERE user_id = $1',
      [id],
    );

    const hasCashSessions = parseInt(cashSessionCount[0]?.count || '0') > 0;
    const hasSales = parseInt(salesCount[0]?.count || '0') > 0;

    if (hasCashSessions || hasSales) {
      throw new BadRequestException(
        'No se puede eliminar este usuario porque tiene registros asociados (sesiones de caja o ventas). Por favor, desactívalo en su lugar.',
      );
    }

    await this.usersRepository.remove(user);
  }
}
