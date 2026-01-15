import { PartialType } from '@nestjs/mapped-types';
import { CreateProductBatchDto } from './create-product-batch.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateProductBatchDto extends PartialType(CreateProductBatchDto) {
  @IsBoolean()
  @IsOptional()
  isSold?: boolean;
}
