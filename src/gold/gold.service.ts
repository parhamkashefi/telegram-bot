import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Gold, GoldDocument } from './schema/gold.schema';
import { plainToInstance } from 'class-transformer';
import { GoldRo } from './dto/gold.ro';
import { GoldDto } from './dto/gold.dto';
import { UsdToIrrService } from 'src/usdToIrr/usdToIrr.service';

@Injectable()
export class GoldService {
  constructor(
    @InjectModel(Gold.name) private readonly goldModel: Model<GoldDocument>,
    private readonly usdToIrrService: UsdToIrrService,
  ) {}

  toEnglishDigits(str: string): string {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    return str
      .replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
  }

  private readonly talaBrowserHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml',
  };

  private parseTalaTomanPrice(raw: string): number {
    const ascii = this.toEnglishDigits(raw.trim());
    const digitsOnly = ascii.replace(/[^\d]/g, '');
    const value = Number(digitsOnly);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  private parseTalaOunceUsd(raw: string): number {
    const ascii = this.toEnglishDigits(raw.trim()).replace(/[^\d.]/g, '');
    const value = Number.parseFloat(ascii);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  async getPriceFromTalaIr(
    timeoutMs = 20000,
  ): Promise<{ site: string; prices: [number] }> {
    try {
      const { data } = await axios.get('https://www.tala.ir/price/18k', {
        timeout: timeoutMs,
        headers: this.talaBrowserHeaders,
      });

      const $ = cheerio.load(data);
      const rawText = $('h3.bg-green-light').first().text().trim();
      const price = this.parseTalaTomanPrice(rawText);

      return {
        site: 'tala.ir',
        prices: [price],
      };
    } catch (error) {
      console.error('Error fetching 18k price from tala.ir:', error);
      return {
        site: 'tala.ir',
        prices: [0],
      };
    }
  }

  private async fetchTabloTalaIrRows(
    timeoutMs = 8000,
  ): Promise<Map<string, number>> {
    const byType = new Map<string, number>();
    try {
      const { data } = await axios.get<{
        status?: string;
        data?: Array<{ type?: string; price?: number }>;
      }>('https://admin.tablotala.app/api/tv/price?type=IR', {
        timeout: timeoutMs,
        headers: {
          Accept: 'application/json',
          Origin: 'https://tv.tablotala.app',
          Referer: 'https://tv.tablotala.app/',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const rows = Array.isArray(data?.data) ? data.data : [];
      for (const row of rows) {
        const type = String(row?.type || '');
        const price = Number(row?.price);
        if (type && Number.isFinite(price) && price > 0) {
          byType.set(type, price);
        }
      }
    } catch (error) {
      console.error('Error fetching Tablo Tala IR feed:', error);
    }
    return byType;
  }

  async getOunceFromTabloTala(
    timeoutMs = 8000,
  ): Promise<{ site: string; price: [number] }> {
    const byType = await this.fetchTabloTalaIrRows(timeoutMs);
    const price = byType.get('GOLD') || 0;
    return {
      site: 'tablotala',
      price: [price],
    };
  }

  async getIran18kFromTabloTala(
    timeoutMs = 8000,
  ): Promise<{ site: string; prices: [number] }> {
    const byType = await this.fetchTabloTalaIrRows(timeoutMs);
    const price = byType.get('IRG18') || 0;
    return {
      site: 'tablotala',
      prices: [price],
    };
  }

  async getOunceFromTalaIr(
    timeoutMs = 20000,
  ): Promise<{ site: string; price: [number] }> {
    try {
      const { data } = await axios.get('https://www.tala.ir/price/ounce', {
        timeout: timeoutMs,
        headers: this.talaBrowserHeaders,
      });

      const $ = cheerio.load(data);
      const rawText = $('h3.bg-green-light').first().text().trim();
      const price = this.parseTalaOunceUsd(rawText);

      return {
        site: 'tala.ir',
        price: [price],
      };
    } catch (error) {
      console.error('Error fetching ounce price from tala.ir:', error);
      return {
        site: 'tala.ir',
        price: [0],
      };
    }
  }

  async getPreviousGoldFromDB(): Promise<GoldDocument | null> {
    try {
      const previous = await this.goldModel
        .find({ productType: 'gold' })
        .sort({ createdAt: -1 })
        .skip(1)
        .limit(1)
        .exec();

      return previous[0] || null;
    } catch (error) {
      console.error('❌ Error fetching previous gold from DB:', error);
      return null;
    }
  }

  async getNewestGoldFromDB(): Promise<GoldRo | null> {
    try {
      const newest = await this.goldModel
        .findOne({ productType: 'gold' })
        .sort({ createdAt: -1 });

      if (!newest) return null;

      return plainToInstance(GoldRo, newest, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('❌ Error getting newest gold from DB:', error);
      return null;
    }
  }

  async createGoldPrices(goldDto: GoldDto): Promise<GoldRo> {
    const created = await this.goldModel.create(goldDto);
    return plainToInstance(GoldRo, created.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Homepage refresh: HTTP sources only (Tablo Tala + tala.ir fallbacks).
   * Updates the latest gold document in place.
   */
  async refreshHomepageGoldPrices(): Promise<GoldRo | null> {
    const LIVE_TIMEOUT_MS = 8000;
    const previous = await this.goldModel
      .findOne({ productType: 'gold' })
      .sort({ createdAt: -1 });

    const tabloRows = await this.fetchTabloTalaIrRows(LIVE_TIMEOUT_MS);
    let iran18k = tabloRows.get('IRG18') || 0;
    let iranSite = 'tablotala';
    let ounceUsd = tabloRows.get('GOLD') || 0;
    let ounceSite = 'tablotala';

    if (iran18k <= 0) {
      const talaIr = await this.getPriceFromTalaIr(LIVE_TIMEOUT_MS);
      iran18k = Number(talaIr.prices[0]) || 0;
      iranSite = talaIr.site;
    }
    if (iran18k <= 0) {
      iran18k = previous?.average || 0;
      iranSite = previous?.siteNames?.[0] || iranSite;
    }

    if (ounceUsd <= 0) {
      const talaOunce = await this.getOunceFromTalaIr(LIVE_TIMEOUT_MS);
      ounceUsd = Number(talaOunce.price[0]) || 0;
      ounceSite = talaOunce.site;
    }
    if (ounceUsd <= 0) {
      ounceUsd = Number(previous?.globalPrices?.[0]?.[0]) || 0;
      ounceSite = previous?.globalSiteNames?.[0] || ounceSite;
    }

    const average = iran18k;

    const tomanPerDollar =
      previous?.tomanPerDollar && previous.tomanPerDollar > 0
        ? previous.tomanPerDollar
        : await this.usdToIrrService.getTomanPerDollar();

    const TROY_OUNCE_GRAMS = 31.1034768;
    const GOLD_18K_PURITY = 0.75;
    const tomanGlobalPrice =
      ounceUsd > 0 && tomanPerDollar > 0
        ? Math.floor(
            ((ounceUsd * tomanPerDollar) / TROY_OUNCE_GRAMS) * GOLD_18K_PURITY,
          )
        : previous?.tomanGlobalPrice || 0;

    if (average <= 0 && tomanGlobalPrice <= 0) {
      return previous
        ? plainToInstance(GoldRo, previous.toObject(), {
            excludeExtraneousValues: true,
          })
        : null;
    }

    const finalAverage = average > 0 ? average : previous?.average || 0;
    let bubble = 0;
    if (finalAverage > 0 && tomanGlobalPrice > 0) {
      bubble = ((finalAverage - tomanGlobalPrice) / finalAverage) * 100;
    }

    const globalSiteNames =
      ounceUsd > 0 ? [ounceSite] : previous?.globalSiteNames || [];
    const globalPrices: [number][] = [[ounceUsd || 0]];

    const payload: GoldDto = {
      productType: 'gold',
      siteNames: [iranSite],
      prices: [[iran18k || 0]],
      globalSiteNames,
      globalPrices,
      tomanPerDollar,
      average: finalAverage,
      tomanGlobalPrice,
      bubble,
    };

    if (!previous) {
      return this.createGoldPrices(payload);
    }

    previous.set({
      ...payload,
      weights: [[1]],
      fetchedAtUtc: new Date(),
    });
    await previous.save();
    return plainToInstance(GoldRo, previous.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** Auth panel — same HTTP refresh as the scheduler. */
  async getAllGoldPrices(): Promise<GoldRo> {
    const refreshed = await this.refreshHomepageGoldPrices();
    if (refreshed) return refreshed;
    const fromDb = await this.getNewestGoldFromDB();
    if (!fromDb) {
      throw new Error('No gold price records found');
    }
    return fromDb;
  }
}
