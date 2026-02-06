/**
 * RESET Y SEED DE PRODUCCIÓN
 * 
 * Este script:
 * 1. Elimina TODAS las tablas de la base de datos
 * 2. Recrea el esquema completo
 * 3. Ejecuta el seeder de producción
 * 
 * ⚠️ ADVERTENCIA: Esto eliminará TODOS los datos existentes
 * 
 * Uso local:
 *   npm run db:reset-production
 * 
 * Uso en Heroku:
 *   heroku run npm run db:reset-production --app tu-app-name
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function resetProduction() {
  console.log('⚠️  ================================================');
  console.log('⚠️  RESET DE BASE DE DATOS DE PRODUCCIÓN');
  console.log('⚠️  ================================================');
  console.log('⚠️  ADVERTENCIA: Esto eliminará TODOS los datos');
  console.log('⚠️  ================================================\n');

  try {
    // 1. Drop all tables
    console.log('🗑️  Paso 1/3: Eliminando todas las tablas...');
    await execAsync('npm run schema:drop');
    console.log('✅ Tablas eliminadas\n');

    // 2. Recreate schema
    console.log('🏗️  Paso 2/3: Recreando esquema de base de datos...');
    await execAsync('npm run schema:sync');
    console.log('✅ Esquema recreado\n');

    // 3. Run production seed
    console.log('🌱 Paso 3/3: Ejecutando seeder de producción...');
    await execAsync('npm run seed:production');
    console.log('✅ Seed de producción completado\n');

    console.log('================================================');
    console.log('🎉 RESET DE PRODUCCIÓN COMPLETADO EXITOSAMENTE');
    console.log('================================================\n');
    console.log('Base de datos lista con:');
    console.log('  ✅ 7 categorías de productos');
    console.log('  ✅ 2 terminales (Caja 1 y Caja 2)');
    console.log('  ✅ 4 usuarios administradores');
    console.log('  ✅ ~40 productos desde Excel\n');
    console.log('Credenciales:');
    console.log('  - mishel1234 / PIN: 1234');
    console.log('  - alan1234 / PIN: 1234');
    console.log('  - henry1234 / PIN: 1234');
    console.log('  - ario1234 / PIN: 1234\n');
  } catch (error) {
    console.error('\n❌ ERROR durante el reset:', error.message);
    process.exit(1);
  }
}

resetProduction();
