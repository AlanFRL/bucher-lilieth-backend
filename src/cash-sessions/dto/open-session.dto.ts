import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class OpenSessionDto {
  @IsUUID()
  terminalId: string;

  @IsNumber()
  @Min(0)
  openingAmount: number;

  @IsOptional()
  @IsString()
  openingNotes?: string;
}
