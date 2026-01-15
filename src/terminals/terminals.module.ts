import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Terminal } from './entities/terminal.entity';
import { TerminalsService } from './terminals.service';
import { TerminalsController } from './terminals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Terminal])],
  controllers: [TerminalsController],
  providers: [TerminalsService],
  exports: [TerminalsService],
})
export class TerminalsModule {}
