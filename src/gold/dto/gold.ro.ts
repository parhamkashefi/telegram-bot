import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class GoldRo {
  @ApiProperty({ example: 'gold' })
  @Expose()
  productMaterial: string;

  @ApiProperty({ example: 'ball' })
  @Expose()
  productType: string;

  @ApiProperty({ example: 'estjt' })
  @Expose()
  stieName: string[];

  @ApiProperty({})
  @Expose()
  prices: number[][];

  @ApiProperty({})
  @Expose()
  dollarPrices: number[];

  @ApiProperty()
  @Expose()
  weights?: number[][];

  @ApiProperty({ example: ['kitco'] })
  @Expose()
  globalSiteNames: string[];

  @ApiProperty()
  @Expose()
  globalPrices: number[];

  @ApiProperty({ example: 116900 })
  @Expose()
  tomanPerDollar: number;
  
  @ApiProperty()
  @Expose()
  average: number;

  @ApiProperty()
  @Expose()
  tomanGlobalPrice: number;

  @ApiProperty()
  @Expose()
  bubble: number;

  @ApiProperty({ example: '2025-12-07T00:40:57.771Z' })
  @Expose()
  createdAt: Date;
}
