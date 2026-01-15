import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: configService.get('cors.origin'),
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  const port = configService.get('port');
  await app.listen(port);

  console.log(`🚀 Backend running on: http://localhost:${port}/api`);
}
bootstrap();
