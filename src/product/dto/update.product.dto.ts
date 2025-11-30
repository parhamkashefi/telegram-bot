import { IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductCategory, ProductType } from '../schema/product.schema';

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
