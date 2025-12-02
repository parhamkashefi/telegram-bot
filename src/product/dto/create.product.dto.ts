import { IsEnum, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory, ProductType } from '../schema/product.schema';

export class CreateProductDto {
  @ApiProperty({ enum: ProductCategory })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiProperty()
  @IsNumber()
  karat: number;

  @ApiProperty()
  @IsNumber()
  weight: number;

  @ApiProperty()
  @IsNumber()
  sellPrice: number;

  @ApiProperty()
  @IsNumber()
  buyPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  exist?: boolean;
}
