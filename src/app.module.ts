import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { ProductBatchesModule } from './product-batches/product-batches.module';
import { TerminalsModule } from './terminals/terminals.module';
import { CashSessionsModule } from './cash-sessions/cash-sessions.module';
import { SalesModule } from './sales/sales.module';
import { OrdersModule } from './orders/orders.module';
import { ReportsModule } from './reports/reports.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    ProductBatchesModule,
    TerminalsModule,
    CashSessionsModule,
    SalesModule,
    OrdersModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
