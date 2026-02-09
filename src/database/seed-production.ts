/**
 * SEED DE PRODUCCIÓN - BUTCHER LILIETH
 * 
 * Este seeder crea:
 * - 6 categorías de productos (Cortes Tradicionales, Cortes Parrilleros, Elaborados, Pollo, Cerdo, Al Vacío)
 * - 2 terminales (Caja 1 y Caja 2)
 * - 4 usuarios administradores
 * - Productos desde Excel (Merchandise - copia.xls)
 * 
 * IMPORTANTE: 
 * - Este seed está diseñado para producción.
 * - NO crea ventas de prueba ni sesiones de caja de prueba.
 * - TODOS los productos son pesados (WEIGHT) y se venden por kg.
 * - "Al Vacío" son productos pesados normales, NO son lotes.
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

    const cortesTradicionales = await categoriesService.create({
      name: 'Cortes Tradicionales',
      description: 'Cortes tradicionales de carne',
    });
    categoryMap.set('Cortes Tradicionales', cortesTradicionales.id);
    console.log('  ✅ Cortes Tradicionales');

    const cortesParrilleros = await categoriesService.create({
      name: 'Cortes Parrilleros',
      description: 'Cortes especiales para parrilla',
    });
    categoryMap.set('Cortes Parrilleros', cortesParrilleros.id);
    console.log('  ✅ Cortes Parrilleros');

    const elaborados = await categoriesService.create({
      name: 'Elaborados',
      description: 'Productos elaborados y procesados',
    });
    categoryMap.set('Elaborados', elaborados.id);
    console.log('  ✅ Elaborados');

    const pollo = await categoriesService.create({
      name: 'Pollo',
      description: 'Productos de pollo y aves',
    });
    categoryMap.set('Pollo', pollo.id);
    console.log('  ✅ Pollo');

    const cerdo = await categoriesService.create({
      name: 'Cerdo',
      description: 'Cortes y productos de carne de cerdo',
    });
    categoryMap.set('Cerdo', cerdo.id);
    console.log('  ✅ Cerdo');

    const alVacio = await categoriesService.create({
      name: 'Al Vacío',
      description: 'Productos empacados al vacío (pesados por kg)',
    });
    categoryMap.set('Al Vacío', alVacio.id);
    categoryMap.set('Al Vacio', alVacio.id); // Variante sin tilde
    categoryMap.set('Al vacío', alVacio.id); // Variante lowercase
    console.log('  ✅ Al Vacío');

    console.log('\n✅ 6 categorías creadas exitosamente\n');

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
        // TODOS los productos son pesados (WEIGHT) en balanza
        // Ya no hay diferencia entre "Al Vacío" y otros productos pesados
        const productData: any = {
          name: productName,
          barcode: barcode, // 6 dígitos
          barcodeType: BarcodeType.WEIGHT_EMBEDDED, // Todos son de balanza
          categoryId: categoryId,
          saleType: SaleType.WEIGHT, // TODOS son pesados
          unit: 'kg', // TODOS se venden por kg
          price: precio,
          taxRate: 0,
          isActive: true,
        };

        await productsService.create(productData);
        console.log(`  ✅ ${productName} (${barcode}) - ${categoria} - Bs ${precio}`);
        created++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.log(`  ❌ ERROR al crear ${productName}: ${message}`);
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
    console.log('✅ Categorías: 6');
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
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error('\n❌ ERROR FATAL EN SEED:', message);
    console.error(stack);
  }

  await app.close();
}

// Ejecutar seed
seedProduction().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
