import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { CashSessionsService } from '../cash-sessions/cash-sessions.service';
import { TerminalsService } from '../terminals/terminals.service';
import { UsersService } from '../users/users.service';
import { CashMovementType } from '../cash-sessions/entities/cash-movement.entity';

async function seedCashSessions() {
  console.log('🌱 Seeding cash sessions...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const cashSessionsService = app.get(CashSessionsService);
  const terminalsService = app.get(TerminalsService);
  const usersService = app.get(UsersService);

  try {
    // Get all terminals and users
    const terminals = await terminalsService.findAllActive();
    const users = await usersService.findAll();

    if (terminals.length === 0) {
      console.log('❌ No terminals found. Please run seed:terminals first.\n');
      await app.close();
      return;
    }

    if (users.length === 0) {
      console.log('❌ No users found. Please run seed (users) first.\n');
      await app.close();
      return;
    }

    // Find a cashier user
    const cashier = users.find((u) => u.role === 'CASHIER') || users[0];
    console.log(`📋 Using user: ${cashier.username} (${cashier.role})\n`);

    // Check if there are already open sessions
    const existingSessionsResult = await cashSessionsService.findAll();
    const existingSessions = Array.isArray(existingSessionsResult) ? existingSessionsResult : existingSessionsResult.data;
    if (existingSessions.length > 0) {
      console.log('⚠️  Cash sessions already exist in the database.');
      console.log(`   Found ${existingSessions.length} session(s).\n`);
      
      const openSessions = existingSessions.filter(s => s.status === 'OPEN');
      if (openSessions.length > 0) {
        console.log(`   ⚠️  Warning: ${openSessions.length} session(s) are currently OPEN.\n`);
      }

      const response = await new Promise<string>((resolve) => {
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        
        rl.question('   Do you want to create test sessions anyway? (y/n): ', (answer: string) => {
          rl.close();
          resolve(answer.toLowerCase());
        });
      });

      if (response !== 'y' && response !== 'yes') {
        console.log('✅ Seed cancelled by user.\n');
        await app.close();
        return;
      }
      console.log('');
    }

    let created = 0;

    // Create one sample session for the first terminal
    const terminal = terminals[0];
    
    try {
      console.log(`📂 Opening session for terminal: ${terminal.name}`);
      
      const session = await cashSessionsService.openSession(cashier.id, {
        terminalId: terminal.id,
        openingAmount: 500,
        openingNotes: 'Sesión de prueba - Fondo de caja inicial',
      });

      console.log(`   ✅ Session opened`);
      console.log(`   ID: ${session.id}`);
      console.log(`   Opening amount: $${session.openingAmount}`);
      console.log(`   Status: ${session.status}\n`);
      created++;

      // Add some sample movements
      console.log(`💰 Adding sample movements to session...\n`);

      // Deposit
      const deposit = await cashSessionsService.addMovement(
        session.id,
        cashier.id,
        {
          type: CashMovementType.DEPOSIT,
          amount: 200,
          reason: 'Depósito adicional para cambio',
        },
      );
      console.log(`   ✅ Deposit added: $${deposit.amount}`);

      // Withdrawal
      const withdrawal = await cashSessionsService.addMovement(
        session.id,
        cashier.id,
        {
          type: CashMovementType.WITHDRAWAL,
          amount: 100,
          reason: 'Retiro para gastos menores',
        },
      );
      console.log(`   ✅ Withdrawal added: $${withdrawal.amount}`);

      // Get updated session stats
      const stats = await cashSessionsService.getSessionStats(session.id);
      console.log(`\n📊 Session Statistics:`);
      console.log(`   Expected amount: $${stats.session.expectedAmount}`);
      console.log(`   Total deposits: $${stats.stats.totalDeposits}`);
      console.log(`   Total withdrawals: $${stats.stats.totalWithdrawals}`);
      console.log(`   Net movements: $${stats.stats.netMovements}`);
      console.log(`   Movement count: ${stats.stats.movementCount}\n`);

    } catch (error) {
      if (error.message.includes('already has an open session')) {
        console.log(`   ⏭️  Skipped: ${terminal.name} (already has open session)\n`);
      } else {
        throw error;
      }
    }

    console.log('🎉 Cash sessions seed completed successfully!\n');
    console.log(`📊 Summary:`);
    console.log(`   Sessions created: ${created}`);
    const allSessionsResult = await cashSessionsService.findAll();
    const allSessions = Array.isArray(allSessionsResult) ? allSessionsResult : allSessionsResult.data;
    console.log(`   Total sessions in database: ${allSessions.length}\n`);
  } catch (error) {
    console.error('❌ Error seeding cash sessions:', error.message);
    throw error;
  } finally {
    await app.close();
  }
}

seedCashSessions()
  .then(() => {
    console.log('✨ Process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
