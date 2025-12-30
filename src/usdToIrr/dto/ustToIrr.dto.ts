import {IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUsdToIrrDto {
  @IsNumber()
  tomanPerDollar: number;

  @IsOptional()
  @IsNumber()
  irrPerDollar?: number;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  fetchedAtIran?: string;

}
