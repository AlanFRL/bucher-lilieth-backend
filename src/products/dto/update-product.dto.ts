import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import {
  SaleType,
  BarcodeType,
} from '../entities/product.entity';

export class UpdateProductDto {
  // SKU is immutable and cannot be changed after creation

  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SaleType)
  @IsOptional()
  saleType?: SaleType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  costPrice?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  barcode?: string;

  @IsEnum(BarcodeType)
  @IsOptional()
  barcodeType?: BarcodeType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  stockQuantity?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minStock?: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  unit?: string;

  @IsBoolean()
  @IsOptional()
  trackInventory?: boolean;

  @IsUUID()
  @IsOptional()
  categoryId?: string;
}

