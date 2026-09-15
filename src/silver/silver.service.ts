import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
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

  private readonly talaBrowserHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml',
    Referer: 'https://www.tala.ir/',
  };

  private parseOunceUsd(raw: string): number {
    const ascii = this.toEnglishDigits(String(raw ?? '').trim())
      .replace(/\//g, '.')
      .replace(/,/g, '')
      .replace(/[^\d.]/g, '');
    const value = Number.parseFloat(ascii);
    // Global silver ounce is typically ~20–100 USD
    return Number.isFinite(value) && value >= 10 && value <= 500 ? value : 0;
  }

  private parseMoj3SilverOunce(html: string): number {
    const withoutBlocks = html
      .replace(/<script[\s\S]*?<\/script>/gi, '\n')
      .replace(/<style[\s\S]*?<\/style>/gi, '\n');
    const text = withoutBlocks.replace(/<[^>]+>/g, '\n');
    const lines = text
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
      if (lines[i] !== 'انس جهانی نقره') continue;
      const price = this.parseOunceUsd(lines[i + 1] || '');
      if (price > 0) return price;
    }
    return 0;
  }

  private parseTalaSilverOunceField(raw: unknown): number {
    if (raw == null) return 0;
    if (typeof raw === 'number') return this.parseOunceUsd(String(raw));
    if (typeof raw === 'string') {
      const text = cheerio.load(raw).root().text().trim() || raw;
      return this.parseOunceUsd(text);
    }
    if (typeof raw === 'object') {
      const rec = raw as Record<string, unknown>;
      return (
        this.parseTalaSilverOunceField(rec.v) ||
        this.parseTalaSilverOunceField(rec.price) ||
        this.parseTalaSilverOunceField(rec.p) ||
        this.parseTalaSilverOunceField(rec.value)
      );
    }
    return 0;
  }

  /**
   * Global silver ounce (USD) from tala.ir homepage tile نقره(اونس).
   * The visible value is filled from /banner/ `price.silver`.
   */
  async getOunceFromTalaIr(
    timeoutMs = 20000,
  ): Promise<{ site: string; price: [number] }> {
    try {
      const { data: html } = await axios.get<string>('https://www.tala.ir/', {
        timeout: timeoutMs,
        responseType: 'text',
        headers: this.talaBrowserHeaders,
      });
      const $ = cheerio.load(html);
      const fromHome = this.parseOunceUsd(
        $('#silver .mprice .price').first().text(),
      );
      if (fromHome > 0) {
        return { site: 'tala.ir', price: [fromHome] };
      }

      const { data: banner } = await axios.get<{
        price?: Record<string, unknown>;
      }>('https://www.tala.ir/banner/', {
        timeout: timeoutMs,
        params: {
          rnd: Date.now().toString(36),
          ids: '1001,1002,1003,1004,1005,1006,1007,1016,1011,1010,1017,1013,11255,1026,1030,',
          'is-mobile': 0,
          android: 0,
          ios: 0,
          h: 1080,
          w: 1920,
        },
        headers: {
          ...this.httpHeaders,
          Accept: 'application/json, text/javascript, */*; q=0.01',
          Referer: 'https://www.tala.ir/',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      const fromBanner = this.parseTalaSilverOunceField(banner?.price?.silver);
      if (fromBanner > 0) {
        return { site: 'tala.ir', price: [fromBanner] };
      }

      return { site: 'tala.ir', price: [0] };
    } catch (error) {
      console.error('❌ Error fetching silver ounce from tala.ir:', error);
      return {
        site: 'tala.ir',
        price: [0],
      };
    }
  }

  /**
   * Live silver ounce shown on tala.ir's نقره(اونس) tile when /banner/ omits
   * `price` for server clients. TGJU `current.silver` matches that tile.
   */
  async getOunceFromTgju(
    timeoutMs = 20000,
  ): Promise<{ site: string; price: [number] }> {
    try {
      const { data } = await axios.get<{
        current?: { silver?: { p?: string | number } };
      }>('https://call2.tgju.org/ajax.json', {
        timeout: timeoutMs,
        headers: {
          ...this.httpHeaders,
          Referer: 'https://www.tgju.org/',
        },
      });
      const price = this.parseOunceUsd(String(data?.current?.silver?.p ?? ''));
      if (!price) {
        throw new Error('Could not parse current.silver from TGJU');
      }
      return { site: 'tgju.org', price: [price] };
    } catch (error) {
      console.error('❌ Error fetching silver ounce from TGJU:', error);
      return {
        site: 'tgju.org',
        price: [0],
      };
    }
  }

  /**
   * SILVER Buy price (USD/oz) from trendo.com price ticker (xagusd).
   */
  async getOunceFromTrendo(
    timeoutMs = 20000,
  ): Promise<{ site: string; price: [number] }> {
    try {
      const { data: html } = await axios.get<string>('https://trendo.com/', {
        timeout: timeoutMs,
        responseType: 'text',
        headers: {
          ...this.httpHeaders,
          Accept: 'text/html,application/xhtml+xml,*/*',
          Referer: 'https://trendo.com/',
        },
      });

      const nonceMatch = html.match(
        /data-symbol="xagusd"[\s\S]{0,500}?data-nonce="([^"]+)"/,
      );
      const nonce = nonceMatch?.[1];

      if (nonce) {
        const { data } = await axios.get<{
          success?: boolean;
          data?: {
            items?: Array<{ symbol?: string; buy?: string | number }>;
          };
        }>('https://trendo.com/wp-admin/admin-ajax.php', {
          timeout: timeoutMs,
          params: {
            action: 'fxtrendo_price_ticker',
            symbols: 'xagusd',
            _nonce: nonce,
          },
          headers: {
            ...this.httpHeaders,
            Referer: 'https://trendo.com/',
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        const item = (data?.data?.items || []).find(
          (row) => String(row.symbol || '').toLowerCase() === 'xagusd',
        );
        const liveBuy = this.parseOunceUsd(String(item?.buy ?? ''));
        if (liveBuy > 0) {
          return { site: 'trendo.com', price: [liveBuy] };
        }
      }

      const initialMatch = html.match(
        /data-symbol="xagusd"[\s\S]{0,800}?data-initial-price="([^"]+)"/,
      );
      if (initialMatch?.[1]) {
        const decoded = initialMatch[1].replace(/&quot;/g, '"');
        const parsed = JSON.parse(decoded) as { buy?: string | number };
        const buy = this.parseOunceUsd(String(parsed.buy ?? ''));
        if (buy > 0) {
          return { site: 'trendo.com', price: [buy] };
        }
      }

      throw new Error('Could not parse SILVER buy from trendo.com');
    } catch (error) {
      console.error('❌ Error fetching silver ounce from trendo.com:', error);
      return {
        site: 'trendo.com',
        price: [0],
      };
    }
  }

  /**
   * Fallback: global silver ounce (USD) from moj3.ir/price/ (انس جهانی نقره).
   */
  async getOunceFromMoj3(
    timeoutMs = 20000,
  ): Promise<{ site: string; price: [number] }> {
    try {
      const { data: html } = await axios.get<string>('https://moj3.ir/price/', {
        timeout: timeoutMs,
        responseType: 'text',
        headers: {
          ...this.httpHeaders,
          Accept: 'text/html,application/xhtml+xml,*/*',
          Referer: 'https://moj3.ir/',
        },
      });

      const price = this.parseMoj3SilverOunce(html);
      if (!price) {
        throw new Error('Could not parse انس جهانی نقره from moj3 HTML');
      }

      return {
        site: 'moj3.ir',
        price: [price],
      };
    } catch (error) {
      console.error('❌ Error fetching silver ounce from moj3.ir:', error);
      return {
        site: 'moj3.ir',
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
  async refreshHomepageSilverPrices(
    liveOnly = false,
  ): Promise<SilverRo | null> {
    const previous = await this.silverModel
      .findOne({ productType: 'ball999' })
      .sort({ createdAt: -1 });

    const [talaOunce, tgjuOunce, trendoOunce, moj3Ounce, kitco] = liveOnly
      ? [
          ...(await Promise.all([
            this.getOunceFromTalaIr(8000),
            this.getOunceFromTgju(8000),
          ])),
          { site: 'trendo.com', price: [0] as [number] },
          { site: 'moj3.ir', price: [0] as [number] },
          { site: 'kitco.com', price: [0] as [number] },
        ]
      : await Promise.all([
          this.getOunceFromTalaIr(15000),
          this.getOunceFromTgju(15000),
          this.getOunceFromTrendo(15000),
          this.getOunceFromMoj3(15000),
          this.getPriceFromKitco(),
        ]);

    const fetchedTomanPerDollar = await this.usdToIrrService.getTomanPerDollar();
    const tomanPerDollar =
      fetchedTomanPerDollar > 0
        ? fetchedTomanPerDollar
        : previous?.tomanPerDollar && previous.tomanPerDollar > 0
          ? previous.tomanPerDollar
          : 0;

    const talaPrice = Number(talaOunce.price[0]) || 0;
    const tgjuPrice = Number(tgjuOunce.price[0]) || 0;
    const trendoPrice = Number(trendoOunce.price[0]) || 0;
    const moj3Price = Number(moj3Ounce.price[0]) || 0;
    const kitcoPrice = Number(kitco.price[0]) || 0;
    const OUNCE_TO_KG_FACTOR = 32.15;

    const candidates: Array<{ site: string; price: number }> = [
      { site: talaOunce.site, price: talaPrice },
      { site: tgjuOunce.site, price: tgjuPrice },
      { site: trendoOunce.site, price: trendoPrice },
      { site: moj3Ounce.site, price: moj3Price },
      { site: kitco.site, price: kitcoPrice },
    ];
    const chosen = candidates.find((row) => row.price > 0);
    const globalOunceUsd =
      chosen?.price || Number(previous?.globalPrices?.[0]?.[0]) || 0;
    const globalSiteNames = chosen
      ? [chosen.site]
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
