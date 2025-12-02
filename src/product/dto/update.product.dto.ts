import { IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sellPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  buyPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  exist?: boolean;
}
