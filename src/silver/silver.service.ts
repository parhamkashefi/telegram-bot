import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SilverRo } from './dto/silver.ro';
import { plainToInstance } from 'class-transformer';
import { Silver, SilverDocument } from './schema/silver.schema';
import { UsdToIrrService } from 'src/usdToIrr/usdToIrr.service';
import { SilverDto } from './dto/silver.dto';

@Injectable()
export class SilverService {
  constructor(
    private readonly usdToIrrService: UsdToIrrService,
    @InjectModel(Silver.name)
    private readonly silverModel: Model<SilverDocument>,
  ) {}

  toEnglishDigits(str: string): string {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    return str
      .replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
  }

  private readonly httpHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
  };

  private parseTalaOunceUsd(raw: string): number {
    const ascii = this.toEnglishDigits(raw.trim())
      .replace(/\//g, '.')
      .replace(/[^\d.]/g, '');
    const value = Number.parseFloat(ascii);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  /**
   * Global silver ounce (USD) from tala.ir homepage banner feed.
   */
  async getOunceFromTalaIr(
    timeoutMs = 20000,
  ): Promise<{ site: string; price: [number] }> {
    try {
      const url = `https://www.tala.ir/banner/?rnd=${Date.now()}&ids=1001,&is-mobile=0&android=0&ios=0&rnd=1263&h=1080&w=1920`;
      const { data } = await axios.get<{ price?: { silver?: string } }>(url, {
        timeout: timeoutMs,
        headers: {
          ...this.httpHeaders,
          Referer: 'https://www.tala.ir/',
        },
      });

      const rawText = data?.price?.silver?.trim() || '';
      const price = this.parseTalaOunceUsd(rawText);

      return {
        site: 'tala.ir',
        price: [price],
      };
    } catch (error) {
      console.error('❌ Error fetching silver ounce from tala.ir:', error);
      return {
        site: 'tala.ir',
        price: [0],
      };
    }
  }

  async getPriceFromKitco(): Promise<{ site: string; price: [number] }> {
    try {
      const url = 'https://www.kitco.com/api/kitco-xml/precious-metals';
      const response = await axios.get(url, {
        timeout: 20000,
        headers: { Accept: 'application/json' },
      });

      if (!response.data || !response.data.data) {
        throw new Error('Invalid response from Kitco');
      }

      const metals = response.data.data;
      const silver = metals.find((m: { commodity?: string }) => m.commodity === 'Silver');
      if (!silver || !silver.lastBid || !silver.lastBid.bidVal) {
        throw new Error('Silver price not found in API');
      }

      const price = parseFloat(silver.lastBid.bidVal);
      if (isNaN(price)) {
        throw new Error('Invalid price value from API');
      }

      return {
        site: 'kitco.com',
        price: [price],
      };
    } catch (error) {
      console.error('❌ Error fetching Kitco silver price:', error);
      return {
        site: 'kitco.com',
        price: [0],
      };
    }
  }

  async getNewestSilverBallFromDB(): Promise<SilverDocument | null> {
    try {
      return await this.silverModel
        .findOne({ productType: 'ball999' })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      console.error('❌ Error fetching newest silver ball from DB:', error);
      return null;
    }
  }

  async getPreviousSilverBallFromDB(): Promise<SilverDocument | null> {
    try {
      const previous = await this.silverModel
        .find({ productType: 'ball999' })
        .sort({ createdAt: -1 })
        .skip(1)
        .limit(1)
        .exec();

      return previous[0] || null;
    } catch (error) {
      console.error('❌ Error fetching previous silver ball from DB:', error);
      return null;
    }
  }

  async getNewestSilverBarFromDB(): Promise<SilverDocument | null> {
    try {
      return await this.silverModel
        .findOne({ productType: 'Bar' })
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      console.error('❌ Error fetching newest silver bar from DB:', error);
      return null;
    }
  }

  async getPreviousSilverBarFromDB(): Promise<SilverDocument | null> {
    try {
      const previous = await this.silverModel
        .find({ productType: 'Bar' })
        .sort({ createdAt: -1 })
        .skip(1)
        .limit(1)
        .exec();

      return previous[0] || null;
    } catch (error) {
      console.error('❌ Error fetching previous silver from DB:', error);
      return null;
    }
  }

  async createSilverBall(silverDto: SilverDto): Promise<SilverRo> {
    const silver = await this.silverModel.create(silverDto);
    return plainToInstance(SilverRo, silver, {
      excludeExtraneousValues: true,
    });
  }

  async createSilverBar(silverDto: SilverDto): Promise<SilverRo> {
    const silver = await this.silverModel.create(silverDto);
    return plainToInstance(SilverRo, silver, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Homepage silver refresh (HTTP only).
   * Iran market average stays as last saved / admin-set value on the FE;
   * here we refresh global ounce → tomanGlobalPrice and bubble.
   */
  async refreshHomepageSilverPrices(): Promise<SilverRo | null> {
    const previous = await this.silverModel
      .findOne({ productType: 'ball999' })
      .sort({ createdAt: -1 });

    const [talaOunce, kitco] = await Promise.all([
      this.getOunceFromTalaIr(12000),
      this.getPriceFromKitco(),
    ]);

    const tomanPerDollar =
      previous?.tomanPerDollar && previous.tomanPerDollar > 0
        ? previous.tomanPerDollar
        : await this.usdToIrrService.getTomanPerDollar();

    const ounceUsd = Number(talaOunce.price[0]) || 0;
    const kitcoPrice = Number(kitco.price[0]) || 0;
    const OUNCE_TO_KG_FACTOR = 32.15;

    const globalOunceUsd =
      ounceUsd > 0
        ? ounceUsd
        : kitcoPrice > 0
          ? kitcoPrice
          : Number(previous?.globalPrices?.[0]?.[0]) || 0;

    const globalSiteNames =
      ounceUsd > 0
        ? [talaOunce.site]
        : kitcoPrice > 0
          ? [kitco.site]
          : previous?.globalSiteNames || [];

    const globalPrices: [number][] = [[globalOunceUsd || 0]];

    const tomanGlobalPrice =
      globalOunceUsd > 0 && tomanPerDollar > 0
        ? Math.floor(
            (globalOunceUsd * OUNCE_TO_KG_FACTOR * tomanPerDollar) / 1000,
          )
        : previous?.tomanGlobalPrice || 0;

    // Keep last Iran average (admin informal price is primary on the site)
    const average = previous?.average && previous.average > 0 ? previous.average : 0;

    let bubble = 0;
    if (average > 0 && tomanGlobalPrice > 0) {
      bubble = ((average - tomanGlobalPrice) / average) * 100;
    }

    const payload: SilverDto = {
      productType: 'ball999',
      siteNames: previous?.siteNames?.length
        ? (previous.siteNames as string[])
        : ['cached'],
      prices: previous?.prices?.length
        ? (previous.prices as [number][])
        : [[average]],
      globalSiteNames,
      globalPrices,
      weights: [[1]],
      tomanPerDollar,
      average,
      tomanGlobalPrice,
      bubble,
    };

    if (!previous) {
      return this.createSilverBall(payload);
    }

    previous.set({
      ...payload,
      fetchedAtUtc: new Date(),
    });
    await previous.save();
    return plainToInstance(SilverRo, previous.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async getAll999SilverPrices(): Promise<SilverRo> {
    const refreshed = await this.refreshHomepageSilverPrices();
    if (refreshed) return refreshed;
    const newest = await this.getNewestSilverBallFromDB();
    if (!newest) {
      throw new Error('No silver ball price records found');
    }
    return plainToInstance(SilverRo, newest.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  /** Bars are product-priced on the main backend; keep last crawl if any. */
  async getAllSilverBarPrices(): Promise<SilverRo> {
    const newest = await this.getNewestSilverBarFromDB();
    if (!newest) {
      return this.createSilverBar({
        productType: 'Bar',
        siteNames: ['none'],
        prices: [[0]],
        globalSiteNames: [],
        globalPrices: [],
        weights: [[0]],
        tomanPerDollar: await this.usdToIrrService.getTomanPerDollar(),
      });
    }
    return plainToInstance(SilverRo, newest.toObject(), {
      excludeExtraneousValues: true,
    });
  }
}
