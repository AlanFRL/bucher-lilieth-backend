import { IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDiscountDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0, { message: 'El precio de descuento no puede ser negativo' })
  discountPrice?: number;

  @IsBoolean()
  discountActive!: boolean;
}
