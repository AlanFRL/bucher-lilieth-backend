import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDateString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductBatchDto {
  @IsUUID()
  productId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  batchNumber: string;

  @IsNumber()
  @Min(0)
  actualWeight: number;

  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsDateString()
  packedAt: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
