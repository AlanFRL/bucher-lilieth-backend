import { Injectable } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { UserRole } from './users/entities/user.entity';
import { TerminalsService } from './terminals/terminals.service';
import { CategoriesService } from './products/categories.service';
import { ProductsService } from './products/products.service';
import { SaleType, InventoryType, BarcodeType } from './products/entities/product.entity';

@Injectable()
export class AppService {
  constructor(
    private readonly usersService: UsersService,
    private readonly terminalsService: TerminalsService,
    private readonly categoriesService: CategoriesService,
    private readonly productsService: ProductsService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async runSeed() {
    try {
      console.log('🌱 Running seeders...');

      let usersCreated = 0;
      let terminalsCreated = 0;
      let categoriesCreated = 0;
      let productsCreated = 0;

      // === USERS ===
      console.log('Creating users...');
      try {
        const existingAdmin = await this.usersService.findByUsername('admin');
        console.log('⏭️  User admin already exists, skipping users...');
      } catch (error) {
        // Users don't exist, create them
        await this.usersService.create({
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
        usersCreated = 4;
        console.log('✅ Created 4 users');
      }

      // === TERMINALS ===
      console.log('Creating terminals...');
      const existingTerminals = await this.terminalsService.findAll();
      if (existingTerminals.length > 0) {
        console.log(`⏭️  Found ${existingTerminals.length} terminals, skipping...`);
      } else {
        await this.terminalsService.create({
          name: 'Caja Principal',
          location: 'Entrada principal del local',
          description: 'Terminal principal de cobro',
        });

        await this.terminalsService.create({
          name: 'Caja 1',
          location: 'Área de mostrador',
          description: 'Terminal secundaria',
        });

        await this.terminalsService.create({
          name: 'Caja 2',
          location: 'Área de despacho',
          description: 'Terminal para despacho',
        });
        terminalsCreated = 3;
        console.log('✅ Created 3 terminals');
      }

      // === CATEGORIES ===
      console.log('Creating categories...');
      const existingCategories = await this.categoriesService.findAll('', true);
      if (existingCategories.length > 0) {
        console.log(`⏭️  Found ${existingCategories.length} categories, skipping...`);
      } else {
        const carnes = await this.categoriesService.create({
          name: 'Carnes Rojas',
          description: 'Res, cerdo, cordero',
        });

        const aves = await this.categoriesService.create({
          name: 'Aves',
          description: 'Pollo, pavo, pato',
        });

        const embutidos = await this.categoriesService.create({
          name: 'Embutidos',
          description: 'Chorizos, salchichas, jamones',
        });

        const alVacio = await this.categoriesService.create({
          name: 'Productos al Vacío',
          description: 'Productos empacados al vacío',
        });

        const otros = await this.categoriesService.create({
          name: 'Otros Productos',
          description: 'Productos varios',
        });
        categoriesCreated = 5;
        console.log('✅ Created 5 categories');

        // === PRODUCTS (algunos ejemplos) ===
        console.log('Creating sample products...');
        
        // Carnes por peso
        await this.productsService.create({
          sku: 'CARNE-001',
          name: 'Lomo de Res',
          saleType: SaleType.WEIGHT,
          inventoryType: InventoryType.WEIGHT,
          price: 45.0,
          unit: 'kg',
          categoryId: carnes.id,
        });

        await this.productsService.create({
          sku: 'CARNE-002',
          name: 'Bistec de Res',
          saleType: SaleType.WEIGHT,
          inventoryType: InventoryType.WEIGHT,
          price: 38.0,
          unit: 'kg',
          categoryId: carnes.id,
        });

        // Aves
        await this.productsService.create({
          sku: 'AVE-001',
          name: 'Pechuga de Pollo',
          saleType: SaleType.WEIGHT,
          inventoryType: InventoryType.WEIGHT,
          price: 28.0,
          unit: 'kg',
          categoryId: aves.id,
        });

        // Productos al vacío (por unidad)
        await this.productsService.create({
          sku: 'VAC-001',
          name: 'Costillas al Vacío',
          saleType: SaleType.UNIT,
          inventoryType: InventoryType.VACUUM_PACKED,
          price: 85.0,
          unit: 'paquete',
          categoryId: alVacio.id,
        });

        // Embutidos
        await this.productsService.create({
          sku: 'EMB-001',
          name: 'Chorizo Argentino',
          saleType: SaleType.WEIGHT,
          inventoryType: InventoryType.WEIGHT,
          price: 42.0,
          unit: 'kg',
          categoryId: embutidos.id,
        });

        await this.productsService.create({
          sku: 'EMB-002',
          name: 'Salchicha Parrillera',
          saleType: SaleType.UNIT,
          inventoryType: InventoryType.UNIT,
          price: 3.5,
          unit: 'unidad',
          categoryId: embutidos.id,
        });
        productsCreated = 6;
        console.log('✅ Created 6 sample products');
      }

      console.log('✅ Seeders completed successfully!');

      return {
        success: true,
        message: 'Database seeded successfully',
        summary: {
          users: usersCreated,
          terminals: terminalsCreated,
          categories: categoriesCreated,
          products: productsCreated,
        },
        credentials: usersCreated > 0 ? [
          { username: 'admin', pin: '1234', role: 'ADMIN' },
          { username: 'gerente', pin: '5678', role: 'MANAGER' },
          { username: 'cajero1', pin: '1111', role: 'CASHIER' },
          { username: 'cajero2', pin: '2222', role: 'CASHIER' },
        ] : 'Users already existed',
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
