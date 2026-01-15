import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TerminalsService } from '../terminals/terminals.service';

async function seedTerminals() {
  console.log('🌱 Seeding terminals...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const terminalsService = app.get(TerminalsService);

  try {
    // Check if terminals already exist
    const existingTerminals = await terminalsService.findAll();
    if (existingTerminals.length > 0) {
      console.log('⚠️  Terminals already exist in the database.');
      console.log(`   Found ${existingTerminals.length} terminal(s).\n`);
      
      const response = await new Promise<string>((resolve) => {
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
        
        rl.question('   Do you want to add more terminals? (y/n): ', (answer: string) => {
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

    // Define terminals to create
    const terminalsData = [
      {
        name: 'Caja Principal',
        location: 'Entrada principal del local',
        description: 'Terminal principal de cobro, utilizada para ventas generales',
        isActive: true,
      },
      {
        name: 'Caja 1',
        location: 'Área de mostrador',
        description: 'Terminal secundaria para atención de clientes',
        isActive: true,
      },
      {
        name: 'Caja 2',
        location: 'Área de despacho',
        description: 'Terminal para ventas rápidas y despacho de pedidos',
        isActive: true,
      },
      {
        name: 'Tablet Móvil',
        location: 'Móvil',
        description: 'Terminal portátil para tomar pedidos en el local',
        isActive: true,
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const terminalData of terminalsData) {
      try {
        const terminal = await terminalsService.create(terminalData);
        console.log(`✅ Terminal created: ${terminal.name}`);
        console.log(`   Location: ${terminal.location}`);
        console.log(`   ID: ${terminal.id}\n`);
        created++;
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Skipped: ${terminalData.name} (already exists)\n`);
          skipped++;
        } else {
          throw error;
        }
      }
    }

    console.log('🎉 Terminal seed completed successfully!\n');
    console.log(`📊 Summary:`);
    console.log(`   Terminals created: ${created}`);
    console.log(`   Terminals skipped: ${skipped}`);
    console.log(`   Total in database: ${(await terminalsService.findAll()).length}\n`);
  } catch (error) {
    console.error('❌ Error seeding terminals:', error.message);
    throw error;
  } finally {
    await app.close();
  }
}

seedTerminals()
  .then(() => {
    console.log('✨ Process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
