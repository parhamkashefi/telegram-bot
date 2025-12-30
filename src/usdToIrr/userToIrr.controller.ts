import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Model } from 'mongoose';
import { UsdToIrrDocument } from './schema/usdToIrr.schema';
import { UsdToIrrService } from './usdToIrr.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('UsdToIrr')
@Controller('usdToIrr')
export class UsdToIrrController {
  constructor(private readonly usdToIrrService: UsdToIrrService) {}

  @Get('tomanPerDollar')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the latest USD-to-Toman price saved in DB' })
  @ApiResponse({
    status: 200,
    description: 'Returns the latest saved Toman per Dollar rate from DB.',
    schema: {
      example: {
        tomanPerDollar: 116900,
        fetchedAtUtc: '2025-11-29T13:22:10.123Z',
      },
    },
  })
  async getTomanPerDollarFromDB() {
    return await this.usdToIrrService.getTomanPerDollarFromDB();
  }
}
