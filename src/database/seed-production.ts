/**
 * SEED DE PRODUCCIÓN - BUTCHER LILIETH
 * 
 * Este seeder crea:
 * - 7 categorías de productos
 * - 2 terminales (Caja 1 y Caja 2)
 * - 4 usuarios administradores
 * - Productos desde Excel (Merchandise - copia.xls)
 * 
 * IMPORTANTE: Este seed está diseñado para producción.
 * NO crea ventas de prueba ni sesiones de caja de prueba.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CategoriesService } from '../products/categories.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';
import { TerminalsService } from '../terminals/terminals.service';
import { UserRole } from '../users/entities/user.entity';
import {
  SaleType,
  InventoryType,
  BarcodeType,
} from '../products/entities/product.entity';
import * as XLSX from 'xlsx';
import * as path from 'path';

async function seedProduction() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const categoriesService = app.get(CategoriesService);
  const productsService = app.get(ProductsService);
  const usersService = app.get(UsersService);
  const terminalsService = app.get(TerminalsService);

  console.log('🌱 INICIANDO SEED DE PRODUCCIÓN - BUTCHER LILIETH');
  console.log('================================================\n');

  try {
    // ==========================================
    // 1. CREAR CATEGORÍAS
    // ==========================================
    console.log('📁 Creando categorías...');
    
    const categoryMap = new Map();

    const abarrotes = await categoriesService.create({
      name: 'Abarrotes',
      description: 'Productos de abarrotes y consumo general',
    });
    categoryMap.set('Abarrotes', abarrotes.id);
    console.log('  ✅ Abarrotes');

    const res = await categoriesService.create({
      name: 'Res',
      description: 'Cortes y productos de carne de res',
    });
    categoryMap.set('Res', res.id);
    console.log('  ✅ Res');

    const cerdo = await categoriesService.create({
      name: 'Cerdo',
      description: 'Cortes y productos de carne de cerdo',
    });
    categoryMap.set('Cerdo', cerdo.id);
    console.log('  ✅ Cerdo');

    const pollo = await categoriesService.create({
      name: 'Pollo',
      description: 'Productos de pollo y aves',
    });
    categoryMap.set('Pollo', pollo.id);
    console.log('  ✅ Pollo');

    const alVacio = await categoriesService.create({
      name: 'Al Vacío',
      description: 'Productos empacados al vacío con peso variable',
    });
    categoryMap.set('Al Vacío', alVacio.id);
    categoryMap.set('Al Vacio', alVacio.id); // Variante sin tilde
    categoryMap.set('Al vacío', alVacio.id); // Variante lowercase
    console.log('  ✅ Al Vacío');

    const embutidos = await categoriesService.create({
      name: 'Embutidos',
      description: 'Embutidos y productos procesados',
    });
    categoryMap.set('Embutidos', embutidos.id);
    console.log('  ✅ Embutidos');

    const pescado = await categoriesService.create({
      name: 'Pescado',
      description: 'Productos de pescado y mariscos',
    });
    categoryMap.set('Pescado', pescado.id);
    console.log('  ✅ Pescado');

    console.log('\n✅ 7 categorías creadas exitosamente\n');

    // ==========================================
    // 2. CREAR TERMINALES
    // ==========================================
    console.log('💻 Creando terminales...');

    try {
      await terminalsService.create({
        name: 'Caja 1',
        location: 'Carnicería',
        isActive: true,
      });
      console.log('  ✅ Caja 1 - Carnicería');
    } catch (error) {
      console.log('  ⏭️  Caja 1 ya existe');
    }

    try {
      await terminalsService.create({
        name: 'Caja 2',
        location: 'Carnicería',
        isActive: true,
      });
      console.log('  ✅ Caja 2 - Carnicería');
    } catch (error) {
      console.log('  ⏭️  Caja 2 ya existe');
    }

    console.log('\n✅ Terminales verificadas\n');

    // ==========================================
    // 3. CREAR USUARIOS ADMINISTRADORES
    // ==========================================
    console.log('👥 Creando usuarios administradores...');

    try {
      await usersService.create({
        username: 'mishel1234',
        fullName: 'Mishel Romero',
        pin: '1234',
        role: UserRole.ADMIN,
      });
      console.log('  ✅ Mishel Romero (mishel1234 / PIN: 1234)');
    } catch (error) {
      console.log('  ⏭️  mishel1234 ya existe');
    }

    try {
      await usersService.create({
        username: 'alan1234',
        fullName: 'Alan Romero',
        pin: '1234',
        role: UserRole.ADMIN,
      });
      console.log('  ✅ Alan Romero (alan1234 / PIN: 1234)');
    } catch (error) {
      console.log('  ⏭️  alan1234 ya existe');
    }

    try {
      await usersService.create({
        username: 'henry1234',
        fullName: 'Henry Romero',
        pin: '1234',
        role: UserRole.ADMIN,
      });
      console.log('  ✅ Henry Romero (henry1234 / PIN: 1234)');
    } catch (error) {
      console.log('  ⏭️  henry1234 ya existe');
    }

    try {
      await usersService.create({
        username: 'ario1234',
        fullName: 'Ario Romero',
        pin: '1234',
        role: UserRole.ADMIN,
      });
      console.log('  ✅ Ario Romero (ario1234 / PIN: 1234)');
    } catch (error) {
      console.log('  ⏭️  ario1234 ya existe');
    }

    console.log('\n✅ Usuarios verificados\n');

    // ==========================================
    // 4. CARGAR PRODUCTOS DESDE EXCEL
    // ==========================================
    console.log('📊 Cargando productos desde Excel...');

    const excelPath = path.join(__dirname, '../../Merchandise - copia.xls');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const productsData: any[] = XLSX.utils.sheet_to_json(worksheet);

    console.log(`  📄 Excel leído: ${productsData.length} filas encontradas\n`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of productsData) {
      const productName = (row['Nombre'] || '').toString().trim();
      const codigoCompleto = (row['Codigo'] || '').toString().trim();
      const precio = parseFloat(row['Precio']) || 0;
      const categoria = (row['Categoria'] || '').toString().trim();

      // IGNORAR productos con nombre "DISPONIBLE"
      if (productName === 'DISPONIBLE') {
        console.log(`  ⏭️  SKIP: ${productName} (espacio disponible en balanza)`);
        skipped++;
        continue;
      }

      // Validar que tenga todos los campos necesarios
      if (!productName || !codigoCompleto || !categoria || precio <= 0) {
        console.log(`  ⚠️  ERROR: Producto incompleto - ${productName || 'SIN NOMBRE'}`);
        errors++;
        continue;
      }

      // IMPORTANTE: Quitar el PRIMER dígito del código
      // Ejemplo: Excel tiene "2200001" (7 dígitos) → guardamos "200001" (6 dígitos)
      const barcode = codigoCompleto.length === 7 ? codigoCompleto.substring(1) : codigoCompleto;

      // Validar que el barcode resultante sea de 6 dígitos
      if (!/^\d{6}$/.test(barcode)) {
        console.log(`  ⚠️  ERROR: Barcode inválido para ${productName} - código: ${codigoCompleto} → ${barcode}`);
        errors++;
        continue;
      }

      // Obtener categoryId del mapa
      const categoryId = categoryMap.get(categoria);
      if (!categoryId) {
        console.log(`  ⚠️  ERROR: Categoría no encontrada "${categoria}" para ${productName}`);
        errors++;
        continue;
      }

      try {
        // Determinar tipo de producto según categoría
        const isVacuumPacked = categoria === 'Al Vacío' || categoria === 'Al Vacio' || categoria === 'Al vacío';

        const productData: any = {
          name: productName,
          barcode: barcode, // 6 dígitos
          barcodeType: BarcodeType.WEIGHT_EMBEDDED, // Todos son de balanza
          categoryId: categoryId,
          price: precio,
          taxRate: 0,
          isActive: true,
          trackInventory: false, // Los productos pesados y al vacío no manejan stock tradicional
        };

        if (isVacuumPacked) {
          // Productos AL VACÍO: UNIT + VACUUM_PACKED
          productData.saleType = SaleType.UNIT;
          productData.inventoryType = InventoryType.VACUUM_PACKED;
          productData.unit = 'paquete';
        } else {
          // Productos PESADOS normales: WEIGHT + WEIGHT
          productData.saleType = SaleType.WEIGHT;
          productData.inventoryType = InventoryType.WEIGHT;
          productData.unit = 'kg';
        }

        await productsService.create(productData);
        console.log(`  ✅ ${productName} (${barcode}) - ${categoria} - Bs ${precio}`);
        created++;
      } catch (error) {
        console.log(`  ❌ ERROR al crear ${productName}: ${error.message}`);
        errors++;
      }
    }

    console.log('\n================================================');
    console.log('📊 RESUMEN DE PRODUCTOS:');
    console.log(`  ✅ Creados: ${created}`);
    console.log(`  ⏭️  Saltados (DISPONIBLE): ${skipped}`);
    console.log(`  ❌ Errores: ${errors}`);
    console.log(`  📄 Total procesados: ${productsData.length}`);

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('\n================================================');
    console.log('🎉 SEED DE PRODUCCIÓN COMPLETADO EXITOSAMENTE');
    console.log('================================================\n');
    console.log('✅ Categorías: 7');
    console.log('✅ Terminales: 2');
    console.log('✅ Usuarios Admin: 4');
    console.log(`✅ Productos: ${created}\n`);
    console.log('📝 CREDENCIALES DE ACCESO:');
    console.log('  - mishel1234 / PIN: 1234 (ADMIN)');
    console.log('  - alan1234 / PIN: 1234 (ADMIN)');
    console.log('  - henry1234 / PIN: 1234 (ADMIN)');
    console.log('  - ario1234 / PIN: 1234 (ADMIN)\n');
    console.log('💻 TERMINALES DISPONIBLES:');
    console.log('  - Caja 1 (Carnicería)');
    console.log('  - Caja 2 (Carnicería)\n');

  } catch (error) {
    console.error('\n❌ ERROR FATAL EN SEED:', error.message);
    console.error(error.stack);
  }

  await app.close();
}

// Ejecutar seed
seedProduction().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
