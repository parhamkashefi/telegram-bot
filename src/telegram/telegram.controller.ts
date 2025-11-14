import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Price, PriceDocument } from './schemas/prices.schema';

@ApiTags('Prices')
@Controller('prices')
export class TelegramController {
  constructor(
    @InjectModel(Price.name) private readonly priceModel: Model<PriceDocument>,
  ) {}

  @Get('gold')
  @ApiOperation({ summary: 'Get last saved gold price' })
  @ApiResponse({ status: 200, description: 'Returns latest gold price from DB' })
  async getLatestGoldPrice() {
    return await this.priceModel
      .findOne({ productMaterial: 'gold' })
      .sort({ createdAt: -1 })
      .lean();
  }

  @Get('silver')
  @ApiOperation({ summary: 'Get last saved silver price' })
  @ApiResponse({
    status: 200,
    description: 'Returns latest silver price from DB',
  })
  async getLatestSilverPrice() {
    return await this.priceModel
      .findOne({ productMaterial: 'silver' })
      .sort({ createdAt: -1 })
      .lean();
  }
}
