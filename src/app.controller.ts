import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'butcher-lilieth-backend',
      version: '0.1.0',
    };
  }

  @Post('seed')
  async runSeed() {
    return this.appService.runSeed();
  }
}
