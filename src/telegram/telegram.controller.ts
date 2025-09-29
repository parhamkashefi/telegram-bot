import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GoldService } from './gold.service';
import { SilverService } from './silver.service';

@ApiTags('Prices')
@Controller('prices')
export class TelegramController {
  constructor(
    private readonly goldService: GoldService,
    private readonly silverService: SilverService,
  ) {}

  @Get('goldPrice')
  @ApiOperation({ summary: 'Get all gold prices' })
  @ApiResponse({ status: 200, description: 'Returns all gold prices' })
  async getAllGoldPrices() {
    return await this.goldService.getAllGoldPrices();
  }

  @Get('silverPrice')
  @ApiOperation({ summary: 'Get all silver prices' })
  @ApiResponse({ status: 200, description: 'Returns all silver prices' })
  async getAllSilverPrices() {
    return await this.silverService.getAllSilverPrices();
  }
}
