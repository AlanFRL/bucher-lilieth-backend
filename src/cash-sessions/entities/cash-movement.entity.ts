import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CashSession } from './cash-session.entity';
import { User } from '../../users/entities/user.entity';

export enum CashMovementType {
  DEPOSIT = 'DEPOSIT', // Entrada de efectivo (agregar dinero)
  WITHDRAWAL = 'WITHDRAWAL', // Retiro de efectivo (sacar dinero)
  ADJUSTMENT = 'ADJUSTMENT', // Ajuste manual
}

/**
 * CashMovement entity represents a cash movement during a session
 * Such as deposits, withdrawals, or adjustments
 */
@Entity('cash_movements')
export class CashMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'session_id' })
  sessionId: string;

  @ManyToOne(() => CashSession, (session) => session.movements)
  @JoinColumn({ name: 'session_id' })
  session: CashSession;

  @Column({
    type: 'enum',
    enum: CashMovementType,
  })
  type: CashMovementType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  amount: number;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
