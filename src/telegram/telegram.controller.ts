import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Price, PriceDocument } from './schemas/prices.schema';

@ApiTags('Prices')
@Controller('prices')
export class TelegramController {
  constructor(
    @InjectModel(Price.name)
    private readonly priceModel: Model<PriceDocument>,
  ) {}

  private mergeWithPreviousNonZero(
  latest: PriceDocument,
  source: PriceDocument | null,
) {
  if (!latest || !source) return latest;

  const latestObj = latest.toObject();
  const sourceObj = source.toObject();

  const latestPrices = latestObj.prices || {};
  const sourcePrices = sourceObj.prices || {};

  const mergedPrices: Record<string, number> = { ...latestPrices };

  for (const key of Object.keys(mergedPrices)) {
    const latestVal = mergedPrices[key];
    const sourceVal = sourcePrices[key];

    if (latestVal === 0 && typeof sourceVal === 'number' && sourceVal > 0) {
      mergedPrices[key] = sourceVal;
    }
  }

  return { ...latestObj, prices: mergedPrices };
}
  


  private async findNonZeroRecord(material: string): Promise<PriceDocument | null> {
    const records = await this.priceModel
      .find({ productMaterial: material })
      .sort({ createdAt: -1 })
      .limit(10); // scan last 10 docs

    for (const rec of records) {
      if (!rec || !rec.prices) continue;

      const hasNonZero = Object.values(rec.prices).some((v: any) => v > 0);

      if (hasNonZero) return rec;
    }

    return null;
  }


  @Get('gold')
  @ApiOperation({ summary: 'Get last saved gold price (auto-repaired)' })
  @ApiResponse({
    status: 200,
    description: 'Returns latest gold price with zero corrected from history',
  })
  async getLatestGoldPrice() {
    const latest = await this.priceModel
      .findOne({ productMaterial: 'gold' })
      .sort({ createdAt: -1 });

    if (!latest) return null;

    // find last valid price record
    const valid = await this.findNonZeroRecord('gold');

    return this.mergeWithPreviousNonZero(latest, valid);
  }


  @Get('silver')
  @ApiOperation({ summary: 'Get last saved silver price (auto-repaired)' })
  @ApiResponse({
    status: 200,
    description:
      'Returns latest silver price with zero corrected from history',
  })
  async getLatestSilverPrice() {
    const latest = await this.priceModel
      .findOne({ productMaterial: 'silver' })
      .sort({ createdAt: -1 });

    if (!latest) return null;

    const valid = await this.findNonZeroRecord('silver');

    return this.mergeWithPreviousNonZero(latest, valid);
  }
}
