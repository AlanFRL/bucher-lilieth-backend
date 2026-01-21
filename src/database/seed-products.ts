import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CategoriesService } from '../products/categories.service';
import { ProductsService } from '../products/products.service';
import {
  SaleType,
  InventoryType,
  BarcodeType,
} from '../products/entities/product.entity';

async function seedProducts() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const categoriesService = app.get(CategoriesService);
  const productsService = app.get(ProductsService);

  console.log('🌱 Seeding products...');

  try {
    // Create categories
    const carnes = await categoriesService.create({
      name: 'Carnes Rojas',
      description: 'Res, cerdo, cordero',
    });
    console.log('✅ Category created:', carnes.name);

    const aves = await categoriesService.create({
      name: 'Aves',
      description: 'Pollo, pavo, pato',
    });
    console.log('✅ Category created:', aves.name);

    const embutidos = await categoriesService.create({
      name: 'Embutidos',
      description: 'Chorizos, salchichas, jamones',
    });
    console.log('✅ Category created:', embutidos.name);

    const alVacio = await categoriesService.create({
      name: 'Productos al Vacío',
      description: 'Productos empacados al vacío',
    });
    console.log('✅ Category created:', alVacio.name);

    // Create products - Carnes Rojas (por peso)
    await productsService.create({
      name: 'Lomo de Res',
      description: 'Corte premium de res',
      saleType: SaleType.WEIGHT,
      inventoryType: InventoryType.WEIGHT,
      price: 45.0,
      costPrice: 30.0,
      barcode: '200001',
      barcodeType: BarcodeType.WEIGHT_EMBEDDED,
      stockQuantity: 50.0,
      minStock: 10.0,
      unit: 'kg',
      trackInventory: true,
      categoryId: carnes.id,
    });
    console.log('✅ Product created: Lomo de Res');

    await productsService.create({
      name: 'Costilla de Cerdo',
      description: 'Costilla con hueso',
      saleType: SaleType.WEIGHT,
      inventoryType: InventoryType.WEIGHT,
      price: 38.0,
      costPrice: 25.0,
      barcode: '200002',
      barcodeType: BarcodeType.WEIGHT_EMBEDDED,
      stockQuantity: 40.0,
      minStock: 8.0,
      unit: 'kg',
      trackInventory: true,
      categoryId: carnes.id,
    });
    console.log('✅ Product created: Costilla de Cerdo');

    // Create products - Aves (por peso)
    await productsService.create({
      name: 'Pechuga de Pollo',
      description: 'Pechuga sin hueso',
      saleType: SaleType.WEIGHT,
      inventoryType: InventoryType.WEIGHT,
      price: 28.0,
      costPrice: 18.0,
      barcode: '200003',
      barcodeType: BarcodeType.WEIGHT_EMBEDDED,
      stockQuantity: 60.0,
      minStock: 15.0,
      unit: 'kg',
      trackInventory: true,
      categoryId: aves.id,
    });
    console.log('✅ Product created: Pechuga de Pollo');

    await productsService.create({
      name: 'Muslos de Pollo',
      description: 'Muslos con hueso',
      saleType: SaleType.WEIGHT,
      inventoryType: InventoryType.WEIGHT,
      price: 22.0,
      costPrice: 14.0,
      barcode: '200004',
      barcodeType: BarcodeType.WEIGHT_EMBEDDED,
      stockQuantity: 45.0,
      minStock: 10.0,
      unit: 'kg',
      trackInventory: true,
      categoryId: aves.id,
    });
    console.log('✅ Product created: Muslos de Pollo');

    // Create products - Embutidos (unitarios)
    await productsService.create({
      name: 'Chorizo Argentino',
      description: 'Paquete de 500g',
      saleType: SaleType.UNIT,
      inventoryType: InventoryType.UNIT,
      price: 35.0,
      costPrice: 22.0,
      barcode: '7501234567890',
      barcodeType: BarcodeType.STANDARD,
      stockQuantity: 100.0,
      minStock: 20.0,
      unit: 'paquete',
      trackInventory: true,
      categoryId: embutidos.id,
    });
    console.log('✅ Product created: Chorizo Argentino');

    await productsService.create({
      name: 'Salchicha Hot Dog',
      description: 'Paquete de 10 unidades',
      saleType: SaleType.UNIT,
      inventoryType: InventoryType.UNIT,
      price: 25.0,
      costPrice: 16.0,
      barcode: '7501234567891',
      barcodeType: BarcodeType.STANDARD,
      stockQuantity: 80.0,
      minStock: 15.0,
      unit: 'paquete',
      trackInventory: true,
      categoryId: embutidos.id,
    });
    console.log('✅ Product created: Salchicha Hot Dog');

    // Create products - Al Vacío
    await productsService.create({
      name: 'Filete de Res al Vacío',
      description: 'Empaque al vacío - peso variable',
      saleType: SaleType.UNIT,
      inventoryType: InventoryType.VACUUM_PACKED,
      price: 55.0,
      costPrice: 38.0,
      barcode: '200005',
      barcodeType: BarcodeType.WEIGHT_EMBEDDED,
      stockQuantity: 30.0,
      minStock: 5.0,
      unit: 'paquete',
      trackInventory: true,
      categoryId: alVacio.id,
    });
    console.log('✅ Product created: Filete de Res al Vacío');

    await productsService.create({
      name: 'Pechuga de Pollo al Vacío',
      description: 'Empaque al vacío - peso variable',
      saleType: SaleType.UNIT,
      inventoryType: InventoryType.VACUUM_PACKED,
      price: 32.0,
      costPrice: 21.0,
      barcode: '200006',
      barcodeType: BarcodeType.WEIGHT_EMBEDDED,
      stockQuantity: 50.0,
      minStock: 10.0,
      unit: 'paquete',
      trackInventory: true,
      categoryId: alVacio.id,
    });
    console.log('✅ Product created: Pechuga al Vacío');

    console.log('\n🎉 Product seed completed successfully!');
    console.log('\nCategories created: 4');
    console.log('Products created: 8');
    console.log('\nProduct types:');
    console.log('- Weight (por peso): 4 productos');
    console.log('- Unit (unitarios): 2 productos');
    console.log('- Vacuum Packed (al vacío): 2 productos');
  } catch (error) {
    console.error('❌ Error seeding products:', error.message);
  }

  await app.close();
}

seedProducts();
