import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ordersService = app.get(OrdersService);
  const usersService = app.get(UsersService);
  const productsService = app.get(ProductsService);

  try {
    console.log('🌱 Seeding orders...\n');

    // Get users
    const users = await usersService.findAll();
    const admin = users.find((u) => u.username === 'admin');
    const cajero = users.find((u) => u.username === 'cajero1');

    if (!admin || !cajero) {
      throw new Error('Required users not found');
    }

    // Get products by SKU
    const lomo = await productsService.findBySku('CARNE-001');
    const pechugas = await productsService.findBySku('AVE-001');
    const chorizo = await productsService.findBySku('EMB-001');
    const salchicha = await productsService.findBySku('EMB-002');
    const fileteVacio = await productsService.findBySku('VAC-001');

    if (!lomo || !pechugas || !chorizo || !salchicha || !fileteVacio) {
      throw new Error('Required products not found. Make sure seed-products has run.');
    }

    // Get today and future dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    let created = 0;

    // Order 1: Pending order for tomorrow
    try {
      console.log('📋 Creating Order 1: Pending order for tomorrow...');
      const order1 = await ordersService.create(cajero.id, {
        customerName: 'Juan Pérez',
        customerPhone: '+591 77123456',
        customerEmail: 'juan.perez@email.com',
        items: [
          { productId: lomo.id, quantity: 5, discount: 0 }, // Lomo 5kg
          { productId: pechugas.id, quantity: 3, discount: 0 }, // Pechugas 3kg
        ],
        discount: 0,
        deposit: 50,
        deliveryDate: tomorrow.toISOString().split('T')[0],
        deliveryTime: '10:00',
        notes: 'Cliente prefiere corte grueso en el lomo',
      });

      console.log(`   ✅ Order created: ${order1.orderNumber}`);
      console.log(`   Customer: ${order1.customerName}`);
      console.log(`   Total: $${order1.total}`);
      console.log(`   Deposit: $${order1.deposit}`);
      console.log(`   Delivery: ${order1.deliveryDate.toLocaleDateString()} ${order1.deliveryTime}`);
      console.log(`   Items: ${order1.items.length}\n`);
      created++;
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Order 2: Confirmed order for next week
    try {
      console.log('📋 Creating Order 2: Confirmed order for party...');
      const order2 = await ordersService.create(admin.id, {
        customerName: 'María García',
        customerPhone: '+591 76654321',
        items: [
          { productId: chorizo.id, quantity: 10, discount: 0 }, // Chorizo 10 paq
          { productId: salchicha.id, quantity: 15, discount: 0 }, // Salchicha 15 paq
          { productId: fileteVacio.id, quantity: 8, discount: 0 },  // Filete al vacío 8 paq
        ],
        discount: 50, // Descuento por cantidad
        deposit: 200,
        deliveryDate: nextWeek.toISOString().split('T')[0],
        deliveryTime: '08:00',
        notes: 'Pedido para fiesta - necesita entrega temprano',
        internalNotes: 'Cliente frecuente - dar prioridad',
      });

      console.log(`   ✅ Order created: ${order2.orderNumber}`);
      console.log(`   Customer: ${order2.customerName}`);
      console.log(`   Total: $${order2.total}`);
      console.log(`   Discount: $${order2.discount}`);
      console.log(`   Delivery: ${order2.deliveryDate.toLocaleDateString()} ${order2.deliveryTime}`);
      console.log(`   Items: ${order2.items.length}\n`);
      created++;
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Order 3: Ready order for today
    try {
      console.log('📋 Creating Order 3: Ready for pickup today...');
      const order3 = await ordersService.create(cajero.id, {
        customerName: 'Carlos Rodríguez',
        customerPhone: '+591 75987654',
        items: [
          { productId: lomo.id, quantity: 2, discount: 5 }, // Lomo 2kg con descuento
          { productId: fileteVacio.id, quantity: 3, discount: 0 },  // Filete 3 paq
        ],
        deposit: 100,
        deliveryDate: today.toISOString().split('T')[0],
        deliveryTime: '16:00',
        notes: 'Llamar 30 minutos antes de la entrega',
      });

      // Mark as ready
      await ordersService.markAsReady(order3.id);

      console.log(`   ✅ Order created and ready: ${order3.orderNumber}`);
      console.log(`   Customer: ${order3.customerName}`);
      console.log(`   Total: $${order3.total}`);
      console.log(`   Status: READY`);
      console.log(`   Pickup time: ${order3.deliveryTime}\n`);
      created++;
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Display statistics
    console.log('📊 Orders statistics:');
    const stats = await ordersService.getStatistics();
    console.log(`   Total orders: ${stats.totalOrders}`);
    console.log(`   Pending: ${stats.pending}`);
    console.log(`   Ready: ${stats.ready}`);
    console.log(`   Total deposits: $${stats.totalDeposits}`);
    console.log(`   Average order value: $${stats.averageOrderValue.toFixed(2)}`);

    console.log(`\n🎉 Orders seed completed successfully!`);
    console.log(`\n📊 Summary:`);
    console.log(`   Orders created: ${created}\n`);
    console.log('✨ Process completed.');
  } catch (error) {
    console.error('Error seeding orders:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
