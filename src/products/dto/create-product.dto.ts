import {
  IsString,
  IsNotEmpty,
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
  InventoryType,
  BarcodeType,
} from '../entities/product.entity';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  sku: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(SaleType)
  saleType: SaleType;

  @IsEnum(InventoryType)
  inventoryType: InventoryType;

  @IsNumber()
  @Min(0)
  price: number;

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
  categoryId: string;
}
