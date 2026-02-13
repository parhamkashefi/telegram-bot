import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class CoinRo {
  @Expose()
  @Transform(({ obj }) => obj._id.toString())
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
}
