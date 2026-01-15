import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEmail,
  IsDateString,
  Min,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  batchId?: string;

  @IsNumber()
  @Min(0.001)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CreateOrderDto {
  @IsString()
  @MaxLength(200)
  customerName: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9\s\-\+\(\)]+$/, {
    message: 'Phone number must contain only digits, spaces, and +-()',
  })
  @MaxLength(20)
  customerPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  customerEmail?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deposit?: number;

  @IsDateString()
  deliveryDate: string;

  @IsOptional()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Delivery time must be in HH:mm format',
  })
  deliveryTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  internalNotes?: string;
}
