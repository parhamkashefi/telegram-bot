import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WeightPriceRO {
  @ApiProperty({ example: '1oz' })
  weight: string;

  @ApiProperty({ example: 2730000 })
  price: number;

  @ApiProperty({ example: true })
  available: boolean;
}

export class SiteWeightPricesRO {
  @ApiProperty({ example: 'silverin.ir' })
  site: string;

  @ApiProperty({ type: [WeightPriceRO] })
  weights: WeightPriceRO[];
}

export class PriceRo {
  @ApiProperty({ example: 'gold' })
  @Expose()
  productMaterial: string;

  @ApiProperty({ example: 'bar' })
  @Expose()
  productType: string;

  @ApiProperty({
    example: {
      globalOunce: 2350,
      iranOunce: 128_000_000,
    },
  })
  @Expose()
  prices?: Record<string, number>;

  @ApiProperty({
    type: [SiteWeightPricesRO],
    example: [
      {
        site: 'zioto.gold',
        weights: [
          { weight: '1oz', price: 9009000, available: true },
          { weight: '50g', price: 14333000, available: true },
        ],
      },
    ],
  })
  @Expose()
  weightPrices?: SiteWeightPricesRO[];

  @ApiProperty({
    example: {
      kitcoGold: 2350,
      kitcoSilver: 29.1,
    },
  })
  @Expose()
  dollarPrices?: Record<string, number>;

  @ApiProperty({ example: 116900 })
  @Expose()
  tomanPerDollar?: number;

  @ApiProperty({ example: '2025-02-15 12:45:00' })
  @Expose()
  fetchedAtIran?: string;

  @ApiProperty({ example: '2025-02-15T09:15:00.000Z' })
  @Expose()
  fetchedAtUtc?: Date;

  @ApiProperty({ example: '2025-02-15T09:15:00.000Z' })
  @Expose()
  createdAt?: Date;

  @ApiProperty({ example: '2025-02-15T09:15:02.000Z' })
  @Expose()
  updatedAt?: Date;
}
