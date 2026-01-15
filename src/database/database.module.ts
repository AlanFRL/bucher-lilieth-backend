import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true, // TEMPORAL: Crear tablas automáticamente (cambiar a false después)
        logging: configService.get('nodeEnv') === 'development',
        // SSL requerido para Heroku PostgreSQL y otras bases de datos en la nube
        ssl: configService.get('nodeEnv') === 'production' ? {
          rejectUnauthorized: false
        } : false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
