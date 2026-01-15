import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CashMovementType } from '../entities/cash-movement.entity';

export class CreateMovementDto {
  @IsEnum(CashMovementType)
  type: CashMovementType;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
