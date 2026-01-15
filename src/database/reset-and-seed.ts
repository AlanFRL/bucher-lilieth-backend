#!/usr/bin/env ts-node
/**
 * Script completo para reestablecer la base de datos y ejecutar todos los seeders
 * 
 * Este script:
 * 1. Elimina todas las tablas (schema:drop)
 * 2. Sincroniza el schema (crea todas las tablas)
 * 3. Ejecuta todos los seeders en orden:
 *    - Usuarios
 *    - Categorías y Productos
 *    - Terminales
 *    - Sesiones de Caja
 *    - Ventas
 *    - Pedidos
 * 
 * Uso:
 *   npm run db:reset-all
 * 
 * ⚠️ ADVERTENCIA: Este script ELIMINA TODOS LOS DATOS de la base de datos
 */

import { execSync } from 'child_process';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function executeCommand(command: string, description: string) {
  console.log(`\n🔧 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname + '/../..' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ Error in ${description}`);
    return false;
  }
}

async function resetDatabase() {
  console.log('\n' + '='.repeat(70));
  console.log('⚠️  DATABASE RESET - TODOS LOS DATOS SERÁN ELIMINADOS');
  console.log('='.repeat(70));
  console.log('\nEste proceso:');
  console.log('1. Eliminará todas las tablas de la base de datos');
  console.log('2. Recreará el schema desde cero');
  console.log('3. Ejecutará todos los seeders para crear datos de prueba\n');

  // Preguntar confirmación
  rl.question('¿Estás seguro de continuar? (escribe "SI" para confirmar): ', (answer) => {
    if (answer.toUpperCase() !== 'SI') {
      console.log('\n❌ Operación cancelada por el usuario\n');
      rl.close();
      process.exit(0);
    }

    console.log('\n🚀 Iniciando reset de base de datos...\n');

    let success = true;

    // 1. Eliminar todas las tablas
    success = executeCommand('npm run schema:drop', 'Eliminando todas las tablas') && success;
    if (!success) {
      console.error('\n❌ Error al eliminar tablas. Proceso abortado.\n');
      rl.close();
      process.exit(1);
    }

    // 2. Sincronizar schema (crear tablas)
    success = executeCommand('npm run schema:sync', 'Creando tablas desde entidades') && success;
    if (!success) {
      console.error('\n❌ Error al crear tablas. Proceso abortado.\n');
      rl.close();
      process.exit(1);
    }

    // 3. Ejecutar seeders en orden
    console.log('\n' + '='.repeat(70));
    console.log('📦 EJECUTANDO SEEDERS');
    console.log('='.repeat(70));

    success = executeCommand('npm run seed', '1. Usuarios') && success;
    success = executeCommand('npm run seed:products', '2. Categorías y Productos') && success;
    success = executeCommand('npm run seed:terminals', '3. Terminales') && success;
    success = executeCommand('npm run seed:cash-sessions', '4. Sesiones de Caja') && success;
    success = executeCommand('npm run seed:sales', '5. Ventas') && success;
    success = executeCommand('npm run seed:orders', '6. Pedidos') && success;

    console.log('\n' + '='.repeat(70));
    if (success) {
      console.log('✅ BASE DE DATOS REESTABLECIDA EXITOSAMENTE');
      console.log('='.repeat(70));
      console.log('\n📊 Base de datos lista con datos de prueba:');
      console.log('   - 4 usuarios (admin, gerente, cajero1, cajero2)');
      console.log('   - 4 categorías de productos');
      console.log('   - 8 productos (4 por peso, 2 unitarios, 2 al vacío)');
      console.log('   - 2 terminales');
      console.log('   - 1 sesión de caja abierta');
      console.log('   - 3 ventas de ejemplo');
      console.log('   - 3 pedidos en diferentes estados\n');
      console.log('🔑 Credenciales de login:');
      console.log('   - admin / 1234 (ADMIN)');
      console.log('   - gerente / 5678 (MANAGER)');
      console.log('   - cajero1 / 1111 (CASHIER)');
      console.log('   - cajero2 / 2222 (CASHIER)\n');
    } else {
      console.log('⚠️  PROCESO COMPLETADO CON ALGUNOS ERRORES');
      console.log('='.repeat(70));
      console.log('\nRevisa los mensajes anteriores para más detalles.\n');
    }

    rl.close();
    process.exit(success ? 0 : 1);
  });
}

resetDatabase();
