import { IsString, IsOptional, IsEmail, MaxLength, ValidateIf } from 'class-validator';

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  company?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Custom validation: At least one of name or company must be provided
  @ValidateIf((o) => !o.name && !o.company)
  @IsString({ message: 'Either name or company must be provided' })
  nameOrCompany?: string;
}
