import { Injectable } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { UserRole } from './users/entities/user.entity';

@Injectable()
export class AppService {
  constructor(private readonly usersService: UsersService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async runSeed() {
    try {
      console.log('🌱 Running seeders...');

      // Check if admin already exists
      try {
        const existingAdmin = await this.usersService.findByUsername('admin');
        if (existingAdmin) {
          return {
            success: false,
            message: 'Database already seeded (admin user exists)',
          };
        }
      } catch (error) {
        // Admin doesn't exist, continue seeding
      }

      // Create users
      const admin = await this.usersService.create({
        username: 'admin',
        fullName: 'Administrador',
        pin: '1234',
        role: UserRole.ADMIN,
      });

      await this.usersService.create({
        username: 'gerente',
        fullName: 'Gerente',
        pin: '5678',
        role: UserRole.MANAGER,
      });

      await this.usersService.create({
        username: 'cajero1',
        fullName: 'Cajero 1',
        pin: '1111',
        role: UserRole.CASHIER,
      });

      await this.usersService.create({
        username: 'cajero2',
        fullName: 'Cajero 2',
        pin: '2222',
        role: UserRole.CASHIER,
      });

      console.log('✅ Seeders completed successfully!');

      return {
        success: true,
        message: 'Database seeded successfully',
        credentials: [
          { username: 'admin', pin: '1234', role: 'ADMIN' },
          { username: 'gerente', pin: '5678', role: 'MANAGER' },
          { username: 'cajero1', pin: '1111', role: 'CASHIER' },
          { username: 'cajero2', pin: '2222', role: 'CASHIER' },
        ],
      };
    } catch (error) {
      console.error('❌ Seed error:', error);
      return {
        success: false,
        message: 'Error seeding database',
        error: error.message,
      };
    }
  }
}
