import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CashSessionsService } from './cash-sessions.service';
import { OpenSessionDto } from './dto/open-session.dto';
import { CloseSessionDto } from './dto/close-session.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CashSessionStatus } from './entities/cash-session.entity';

@Controller('cash-sessions')
@UseGuards(JwtAuthGuard)
export class CashSessionsController {
  constructor(private readonly cashSessionsService: CashSessionsService) {}

  /**
   * Open a new cash session
   */
  @Post('open')
  openSession(@Request() req, @Body() openSessionDto: OpenSessionDto) {
    return this.cashSessionsService.openSession(req.user.id, openSessionDto);
  }

  /**
   * Close a cash session
   */
  @Patch(':id/close')
  closeSession(
    @Param('id') id: string,
    @Request() req,
    @Body() closeSessionDto: CloseSessionDto,
  ) {
    return this.cashSessionsService.closeSession(
      id,
      req.user.id,
      req.user.role,
      closeSessionDto,
    );
  }

  /**
   * Get all sessions with optional filters
   */
  @Get()
  findAll(
    @Query('terminalId') terminalId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: CashSessionStatus,
  ) {
    return this.cashSessionsService.findAll(terminalId, userId, status);
  }

  /**
   * Get current user's open session
   */
  @Get('my-session')
  getMyOpenSession(@Request() req) {
    return this.cashSessionsService.getOpenSessionByUser(req.user.userId);
  }

  /**
   * Get open session for a specific terminal
   */
  @Get('terminal/:terminalId/open')
  getTerminalOpenSession(@Param('terminalId') terminalId: string) {
    return this.cashSessionsService.getOpenSessionByTerminal(terminalId);
  }

  /**
   * Get session by ID
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashSessionsService.findOne(id);
  }

  /**
   * Get session statistics
   */
  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.cashSessionsService.getSessionStats(id);
  }

  /**
   * Add a cash movement to a session
   */
  @Post(':id/movements')
  addMovement(
    @Param('id') id: string,
    @Request() req,
    @Body() createMovementDto: CreateMovementDto,
  ) {
    return this.cashSessionsService.addMovement(id, req.user.userId, createMovementDto);
  }

  /**
   * Get movements for a session
   */
  @Get(':id/movements')
  getMovements(@Param('id') id: string) {
    return this.cashSessionsService.getSessionMovements(id);
  }
}
