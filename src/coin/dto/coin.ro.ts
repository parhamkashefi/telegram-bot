import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class CoinRo {
  @Expose()
  @Transform(({ obj }) => obj._id?.toString?.() ?? obj.id)
  id: string;

  @ApiProperty({ example: 'coin' })
  @Expose()
  productType: string;

  @ApiProperty({ example: 'tgju' })
  @Expose()
  siteNames: string[];

  @ApiProperty({ example: 'coin' })
  @Expose()
  prices: number[][];

  @ApiProperty({ example: [[8.133],[8.13]] })
  @Expose()
  weights: number[][];

  @Expose()
  fetchedAtUtc: Date;

  @Expose()
  createdAt: Date;

  @ApiProperty({ example: 188000000 })
  @Expose()
  oldCoin: number;

  @ApiProperty({ example: 189600000 })
  @Expose()
  newCoin: number;

  @ApiProperty({ example: 96500000 })
  @Expose()
  halfCoin: number;

  @ApiProperty({ example: 53000000 })
  @Expose()
  quarterCoin: number;

  @ApiProperty({ example: 28000000 })
  @Expose()
  gramCoin: number;
}
