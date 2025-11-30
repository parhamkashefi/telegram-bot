import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ProductRo {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  category: string;

  @ApiProperty()
  @Expose()
  productType: string;

  @ApiProperty()
  @Expose()
  weight: number;

  @ApiProperty()
  @Expose()
  sellPrice: number;

  @ApiProperty()
  @Expose()
  buyPrice: number;

  @ApiProperty()
  @Expose()
  exist: boolean;
}
