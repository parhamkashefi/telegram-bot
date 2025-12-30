import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class GoldDto {
  @ApiProperty({ example: 'ball' })
  productType: string;

  @ApiProperty({ example: ['site1', 'site1', 'site1', 'site1'] })
  @IsArray()
  siteNames: string[];

  @ApiProperty({
    example: [
      [1, 2, 3, 4, 5],
      [1, 2, 3, 4, 5],
      [1, 2, 3, 4, 5],
      [1, 2, 3, 4, 5],
    ],
  })
  @IsArray()
  prices: [number][];

  @ApiProperty({
    example: ['kitco'],
  })
  @IsArray()
  globalSiteNames: string[];

  @ApiProperty({
    example: [17],
  })
  @IsArray()
  globalPrices: [number][];

  @ApiProperty({ example: 400 })
  @IsNumber()
  average?: number;

  @ApiProperty({ example: 400 })
  @IsNumber()
  tomanGlobalPrice?: number;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  tomanPerDollar?: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  bubble?: number;
}
