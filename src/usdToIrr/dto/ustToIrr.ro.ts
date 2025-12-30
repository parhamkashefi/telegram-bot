import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

export class UsdToIrrRO {
  @Expose()
  @Transform(({ obj }) => obj._id?.toString())
  id: string;

  @ApiProperty()
  @Expose()
  tomanPerDollar: number;

  @ApiProperty()
  @Expose()
  irrPerDollar?: number;

  @ApiProperty()
  @Expose()
  source?: string;

  @ApiProperty()
  @Expose()
  fetchedAtIran?: string;

  @ApiProperty()
  @Expose()
  fetchedAtUtc?: Date;

  @ApiProperty()
  @Expose()
  isActive?: boolean;

  @ApiProperty()
  @Expose()
  createdAt?: Date;

  @ApiProperty()
  @Expose()
  updatedAt?: Date;
}
