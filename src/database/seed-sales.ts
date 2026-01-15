import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SalesService } from '../sales/sales.service';
import { CashSessionsService } from '../cash-sessions/cash-sessions.service';
import { ProductsService } from '../products/products.service';
import { UsersService } from '../users/users.service';

async function seedSales() {
  console.log('🌱 Seeding sales...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const salesService = app.get(SalesService);
  const sessionsService = app.get(CashSessionsService);
  const productsService = app.get(ProductsService);
  const usersService = app.get(UsersService);

  try {
    // Get required data
    const users = await usersService.findAll();
    const cashier = users.find((u) => u.role === 'CASHIER') || users[0];

    // Get open session
    let session = await sessionsService.getOpenSessionByUser(cashier.id);
    
    if (!session) {
      console.log('⚠️  No open session found. Please run seed:cash-sessions first.\n');
      await app.close();
      return;
    }

    console.log(`📂 Using session: ${session.terminal.name}`);
    console.log(`👤 Cashier: ${cashier.username}\n`);

    // Get some products
    const products = await productsService.findAll();
    if (products.length === 0) {
      console.log('❌ No products found. Please run seed:products first.\n');
      await app.close();
      return;
    }

    let created = 0;

    // Sale 1: Simple cash sale with 2 items
    try {
      console.log('💰 Creating Sale 1: Cash sale with meat products...');
      
      const lomoRes = products.find((p) => p.sku === 'CARNE-001');
      const pechugas = products.find((p) => p.sku === 'AVE-001');

      if (lomoRes && pechugas) {
        const sale1 = await salesService.create(cashier.id, {
          sessionId: session.id,
          items: [
            { productId: lomoRes.id, quantity: 2.5, discount: 0 }, // 2.5 kg @ $45 = $112.50
            { productId: pechugas.id, quantity: 3, discount: 0 },   // 3 kg @ $28 = $84
          ],
          discount: 0,
          paymentMethod: 'CASH',
          cashAmount: 200,
          notes: 'Venta de prueba - Efectivo',
        });

        console.log(`   ✅ Sale created: ${sale1.id}`);
        console.log(`   Total: $${sale1.total}`);
        console.log(`   Change: $${sale1.changeAmount}`);
        console.log(`   Items: ${sale1.items.length}\n`);
        created++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Sale 2: Transfer payment
    try {
      console.log('🏦 Creating Sale 2: Transfer payment...');
      
      const chorizo = products.find((p) => p.sku === 'EMB-001');
      const salchicha = products.find((p) => p.sku === 'EMB-002');

      if (chorizo && salchicha) {
        const sale2 = await salesService.create(cashier.id, {
          sessionId: session.id,
          items: [
            { productId: chorizo.id, quantity: 2, discount: 0 },    // 2 paq @ $35 = $70
            { productId: salchicha.id, quantity: 3, discount: 0 },  // 3 paq @ $25 = $75
          ],
          discount: 10, // $10 discount
          paymentMethod: 'TRANSFER',
          transferAmount: 135,
          notes: 'Venta de prueba - Transferencia',
          customerName: 'Juan Pérez',
        });

        console.log(`   ✅ Sale created: ${sale2.id}`);
        console.log(`   Total: $${sale2.total}`);
        console.log(`   Customer: ${sale2.customerName}`);
        console.log(`   Items: ${sale2.items.length}\n`);
        created++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Sale 3: Mixed payment (Cash + Transfer)
    try {
      console.log('💰🏦 Creating Sale 3: Mixed payment...');
      
      const vacPack = products.find((p) => p.sku === 'VAC-001');

      if (vacPack) {
        const sale3 = await salesService.create(cashier.id, {
          sessionId: session.id,
          items: [
            { productId: vacPack.id, quantity: 5, discount: 0 }, // 5 paq @ $55 = $275
          ],
          discount: 0,
          paymentMethod: 'MIXED',
          cashAmount: 100,
          transferAmount: 175,
          notes: 'Venta de prueba - Pago mixto (Efectivo + Transferencia)',
          customerName: 'María García',
        });

        console.log(`   ✅ Sale created: ${sale3.id}`);
        console.log(`   Total: $${sale3.total}`);
        console.log(`   Cash: $${sale3.cashAmount}, Transfer: $${sale3.transferAmount}`);
        console.log(`   Customer: ${sale3.customerName}`);
        console.log(`   Items: ${sale3.items.length}\n`);
        created++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Get session stats
    console.log('📊 Session statistics after sales:');
    const stats = await salesService.getSessionStats(session.id);
    console.log(`   Total sales: ${stats.totalSales}`);
    console.log(`   Total revenue: $${stats.totalRevenue.toFixed(2)}`);
    console.log(`   Average ticket: $${stats.averageTicket.toFixed(2)}`);
    console.log(`   Cash sales: ${stats.paymentMethods.cash.count} ($${stats.paymentMethods.cash.total.toFixed(2)})`);
    console.log(`   Transfer sales: ${stats.paymentMethods.transfer.count} ($${stats.paymentMethods.transfer.total.toFixed(2)})`);
    console.log(`   Mixed sales: ${stats.paymentMethods.mixed.count} ($${stats.paymentMethods.mixed.total.toFixed(2)})\n`);

    console.log('🎉 Sales seed completed successfully!\n');
    console.log(`📊 Summary:`);
    console.log(`   Sales created: ${created}\n`);
  } catch (error) {
    console.error('❌ Error seeding sales:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await app.close();
  }
}

seedSales()
  .then(() => {
    console.log('✨ Process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
