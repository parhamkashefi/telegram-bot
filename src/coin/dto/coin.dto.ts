import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString } from 'class-validator';

export class CoinDto {
  @ApiProperty({ example: 'coin' })
  @IsString()
  productType: string;

  @ApiProperty({ example: ['tgju'] })
  @IsArray()
  @IsString({ each: true })
  siteNames: string[];

  @IsArray()
  prices: number[][];

  @IsArray()
  weights: number[][];
}
