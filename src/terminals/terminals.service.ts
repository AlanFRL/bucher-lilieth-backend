import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Terminal } from './entities/terminal.entity';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { UpdateTerminalDto } from './dto/update-terminal.dto';

@Injectable()
export class TerminalsService {
  constructor(
    @InjectRepository(Terminal)
    private readonly terminalRepository: Repository<Terminal>,
  ) {}

  /**
   * Create a new terminal
   */
  async create(createTerminalDto: CreateTerminalDto): Promise<Terminal> {
    // Check if terminal name already exists
    const existingTerminal = await this.terminalRepository.findOne({
      where: { name: createTerminalDto.name },
    });

    if (existingTerminal) {
      throw new BadRequestException(
        `Terminal with name "${createTerminalDto.name}" already exists`,
      );
    }

    const terminal = this.terminalRepository.create(createTerminalDto);
    return await this.terminalRepository.save(terminal);
  }

  /**
   * Find all terminals with optional search
   */
  async findAll(search?: string): Promise<Terminal[]> {
    if (search) {
      return await this.terminalRepository.find({
        where: [
          { name: Like(`%${search}%`) },
          { location: Like(`%${search}%`) },
        ],
        order: { 
          isActive: 'DESC',
          name: 'ASC',
        },
      });
    }

    return await this.terminalRepository.find({
      order: { 
        isActive: 'DESC',
        name: 'ASC',
      },
    });
  }

  /**
   * Find all active terminals
   */
  async findAllActive(): Promise<Terminal[]> {
    return await this.terminalRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Find one terminal by ID
   */
  async findOne(id: string): Promise<Terminal> {
    const terminal = await this.terminalRepository.findOne({
      where: { id },
    });

    if (!terminal) {
      throw new NotFoundException(`Terminal with ID ${id} not found`);
    }

    return terminal;
  }

  /**
   * Update a terminal
   */
  async update(
    id: string,
    updateTerminalDto: UpdateTerminalDto,
  ): Promise<Terminal> {
    const terminal = await this.findOne(id);

    // If changing name, check if new name already exists
    if (
      updateTerminalDto.name &&
      updateTerminalDto.name !== terminal.name
    ) {
      const existingTerminal = await this.terminalRepository.findOne({
        where: { name: updateTerminalDto.name },
      });

      if (existingTerminal) {
        throw new BadRequestException(
          `Terminal with name "${updateTerminalDto.name}" already exists`,
        );
      }
    }

    Object.assign(terminal, updateTerminalDto);
    return await this.terminalRepository.save(terminal);
  }

  /**
   * Deactivate a terminal (soft delete)
   */
  async deactivate(id: string): Promise<Terminal> {
    const terminal = await this.findOne(id);
    terminal.isActive = false;
    return await this.terminalRepository.save(terminal);
  }

  /**
   * Permanently remove a terminal
   */
  async remove(id: string): Promise<void> {
    const terminal = await this.terminalRepository.findOne({
      where: { id },
    });

    if (!terminal) {
      throw new NotFoundException(`Terminal with ID ${id} not found`);
    }

    // Check if terminal has associated cash sessions
    const sessionCount = await this.terminalRepository.manager.query(
      'SELECT COUNT(*) as count FROM cash_sessions WHERE terminal_id = $1',
      [id],
    );

    const hasSessions = parseInt(sessionCount[0]?.count || '0') > 0;

    if (hasSessions) {
      throw new BadRequestException(
        'No se puede eliminar esta terminal porque tiene sesiones de caja asociadas. Por favor, desactívala en su lugar.',
      );
    }

    await this.terminalRepository.remove(terminal);
  }
}
