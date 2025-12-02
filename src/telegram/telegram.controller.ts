import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Price, PriceDocument } from './schemas/prices.schema';
import { AuthService } from '../auth/auth.service';
import { LoginDto } from '../auth/dto/login.dto';
import { LoginRO } from '../auth/dto/login.ro';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Prices')
@Controller('prices')
export class TelegramController {
  constructor(
    @InjectModel(Price.name)
    private readonly priceModel: Model<PriceDocument>,

    private readonly authService: AuthService,
  ) {}

  // LOGIN (ADMIN)
  @Post('login')
  @ApiOperation({ summary: 'Admin login to get JWT token' })
  @ApiResponse({ status: 200, type: LoginRO })
  async login(@Body() dto: LoginDto): Promise<LoginRO> {
    const isValid = this.authService.validateAdmin(dto.username, dto.password);

    if (!isValid) throw new Error('Invalid username or password');

    return this.authService.login(dto.username);
  }

  // // MERGE FUNCTION
  // private mergeWithPreviousNonZero(
  //   latest: PriceDocument,
  //   source: PriceDocument | null,
  // ) {
  //   if (!latest || !source) return latest;

  //   const latestObj = latest.toObject();
  //   const sourceObj = source.toObject();
  //   const latestPrices = latestObj.prices || {};
  //   const sourcePrices = sourceObj.prices || {};

  //   const mergedPrices: Record<string, number> = { ...latestPrices };

  //   for (const key of Object.keys(mergedPrices)) {
  //     const latestVal = mergedPrices[key];
  //     const sourceVal = sourcePrices[key];

  //     if (latestVal === 0 && typeof sourceVal === 'number' && sourceVal > 0) {
  //       mergedPrices[key] = sourceVal;
  //     }
  //   }

  //   return { ...latestObj, prices: mergedPrices };
  // }

  // private async findNonZeroRecord(
  //   material: string,
  // ): Promise<PriceDocument | null> {
  //   const records = await this.priceModel
  //     .find({ productMaterial: material })
  //     .sort({ createdAt: -1 })
  //     .limit(10);

  //   for (const rec of records) {
  //     if (!rec || !rec.prices) continue;

  //     const hasNonZero = Object.values(rec.prices).some((v: any) => v > 0);
  //     if (hasNonZero) return rec;
  //   }

  //   return null;
  // }

  @Get('gold')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get last saved gold price.' })
  async getLatestGoldPrice() {
    const latest = await this.priceModel
      .findOne({ productMaterial: 'gold' })
      .sort({ createdAt: -1 });

    if (!latest) return null;
    return latest;
  }

  @Get('silver')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get last saved silver price.' })
  async getLatestSilverPrice() {
    const latest = await this.priceModel
      .findOne({ productMaterial: 'silver' })
      .sort({ createdAt: -1 });

    if (!latest) return null;

    // const valid = await this.findNonZeroRecord('silver');
    // return this.mergeWithPreviousNonZero(latest, valid);
    return latest;
  }

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
    const latest = await this.priceModel
      .findOne({ tomanPerDollar: { $gt: 0 } }) 
      .sort({ createdAt: -1 });

    if (!latest) return null;
    return latest ;
  }
}
