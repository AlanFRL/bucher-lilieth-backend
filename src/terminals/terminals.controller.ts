import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TerminalsService } from './terminals.service';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { UpdateTerminalDto } from './dto/update-terminal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('terminals')
@UseGuards(JwtAuthGuard)
export class TerminalsController {
  constructor(private readonly terminalsService: TerminalsService) {}

  @Post()
  create(@Body() createTerminalDto: CreateTerminalDto) {
    return this.terminalsService.create(createTerminalDto);
  }

  @Get()
  findAll(@Query('search') search?: string) {
    return this.terminalsService.findAll(search);
  }

  @Get('active')
  findAllActive() {
    return this.terminalsService.findAllActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.terminalsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTerminalDto: UpdateTerminalDto) {
    return this.terminalsService.update(id, updateTerminalDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.terminalsService.remove(id);
  }
}
