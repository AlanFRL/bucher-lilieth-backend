import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  console.log('🌱 Seeding database...');

  try {
    // Admin user
    const admin = await usersService.create({
      username: 'admin',
      fullName: 'Administrador',
      pin: '1234',
      role: UserRole.ADMIN,
    });
    console.log('✅ Admin created:', admin.username);

    // Manager user
    const manager = await usersService.create({
      username: 'gerente',
      fullName: 'Gerente',
      pin: '5678',
      role: UserRole.MANAGER,
    });
    console.log('✅ Manager created:', manager.username);

    // Cashier users
    const cashier1 = await usersService.create({
      username: 'cajero1',
      fullName: 'Cajero 1',
      pin: '1111',
      role: UserRole.CASHIER,
    });
    console.log('✅ Cashier 1 created:', cashier1.username);

    const cashier2 = await usersService.create({
      username: 'cajero2',
      fullName: 'Cajero 2',
      pin: '2222',
      role: UserRole.CASHIER,
    });
    console.log('✅ Cashier 2 created:', cashier2.username);

    console.log('\n🎉 Seed completed successfully!');
    console.log('\nLogin credentials:');
    console.log('- admin / 1234 (ADMIN)');
    console.log('- gerente / 5678 (MANAGER)');
    console.log('- cajero1 / 1111 (CASHIER)');
    console.log('- cajero2 / 2222 (CASHIER)');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
  }

  await app.close();
}

seed();
