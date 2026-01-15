import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Terminal } from '../../terminals/entities/terminal.entity';
import { CashMovement } from './cash-movement.entity';

export enum CashSessionStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}

/**
 * CashSession entity represents a cash register session
 * Each session is associated with a terminal and a cashier user
 */
@Entity('cash_sessions')
export class CashSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'terminal_id' })
  terminalId: string;

  @ManyToOne(() => Terminal)
  @JoinColumn({ name: 'terminal_id' })
  terminal: Terminal;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true, name: 'closed_by_user_id' })
  closedByUserId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'closed_by_user_id' })
  closedByUser?: User;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    name: 'opening_amount',
  })
  openingAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    name: 'closing_amount',
  })
  closingAmount?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'expected_amount',
  })
  expectedAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: true,
    name: 'difference_amount',
  })
  differenceAmount?: number;

  @Column({
    type: 'enum',
    enum: CashSessionStatus,
    default: CashSessionStatus.OPEN,
  })
  status: CashSessionStatus;

  @Column({ type: 'text', nullable: true, name: 'opening_notes' })
  openingNotes?: string;

  @Column({ type: 'text', nullable: true, name: 'closing_notes' })
  closingNotes?: string;

  @CreateDateColumn({ name: 'opened_at' })
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'closed_at' })
  closedAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => CashMovement, (movement) => movement.session)
  movements: CashMovement[];
}
