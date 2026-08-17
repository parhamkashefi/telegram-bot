import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { UsdToIrr, UsdToIrrDocument } from './schema/usdToIrr.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

type NavasanCurrency = {
  value?: number | string;
  date?: number;
};

@Injectable()
export class UsdToIrrService {
  private readonly logger = new Logger(UsdToIrrService.name);
  private readonly navasanUrl =
    'https://www.navasan.net/last_currencies.php';
  private readonly bitpinMarketsUrl =
    'https://api.bitpin.ir/v1/mkt/markets/';

  private readonly httpHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
  };

  constructor(
    @InjectModel(UsdToIrr.name)
    private readonly usdToIrrModel: Model<UsdToIrrDocument>,
  ) {}

  /**
   * Get USD→Toman cash rate.
   * Prefer navasan.net (دلار آمریکا نقدی); fall back to Bitpin USDT_IRT
   * when navasan is blocked/unreachable from the server network.
   */
  async getTomanPerDollar(): Promise<number> {
    const fromNavasan = await this.fetchFromNavasan();
    if (fromNavasan > 0) {
      await this.persistRate(fromNavasan, 'navasan');
      return fromNavasan;
    }

    const fromBitpin = await this.fetchFromBitpinUsdt();
    if (fromBitpin > 0) {
      await this.persistRate(fromBitpin, 'bitpin-usdt');
      return fromBitpin;
    }

    const latest = await this.getTomanPerDollarFromDB();
    if (latest?.tomanPerDollar && latest.tomanPerDollar > 0) {
      this.logger.warn(
        `Using last saved tomanPerDollar=${latest.tomanPerDollar}`,
      );
      return latest.tomanPerDollar;
    }

    this.logger.error('❌ No USD/Toman rate available from any source');
    return 0;
  }

  private async fetchFromNavasan(): Promise<number> {
    try {
      const { data } = await axios.get<Record<string, NavasanCurrency>>(
        this.navasanUrl,
        {
          timeout: 12_000,
          params: { _: Math.floor(Date.now() / 10_000) },
          headers: {
            ...this.httpHeaders,
            Referer: 'https://www.navasan.net/',
          },
        },
      );

      const raw = data?.usd?.value ?? data?.usd_sell?.value;
      const numeric = Number(raw);
      if (!Number.isFinite(numeric) || numeric <= 0) {
        throw new Error(`Invalid navasan usd value: ${raw}`);
      }

      this.logger.log(`navasan usd tomanPerDollar=${numeric}`);
      return numeric;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`navasan USD fetch failed: ${msg}`);
      return 0;
    }
  }

  /** Bitpin USDT/IRT market ≈ free-market dollar in Toman */
  private async fetchFromBitpinUsdt(): Promise<number> {
    try {
      const { data } = await axios.get<{
        results?: Array<{ code?: string; price?: string | number }>;
      }>(this.bitpinMarketsUrl, {
        timeout: 20_000,
        headers: this.httpHeaders,
      });

      const market = (data?.results || []).find((m) => m.code === 'USDT_IRT');
      const numeric = Number(market?.price);
      if (!Number.isFinite(numeric) || numeric <= 0) {
        throw new Error(`USDT_IRT not found or invalid: ${market?.price}`);
      }

      this.logger.log(`bitpin USDT_IRT tomanPerDollar=${numeric}`);
      return Math.round(numeric);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`bitpin USD fetch failed: ${msg}`);
      return 0;
    }
  }

  private async persistRate(tomanPerDollar: number, source: string) {
    try {
      await this.usdToIrrModel.create({ tomanPerDollar });
      this.logger.log(`saved tomanPerDollar=${tomanPerDollar} source=${source}`);
    } catch (err) {
      this.logger.warn(`failed to persist tomanPerDollar: ${err}`);
    }
  }

  async getWithRetry(retry = 3): Promise<number | null> {
    for (let i = 1; i <= retry; i++) {
      const result = await this.getTomanPerDollar();
      if (result) return result;
      this.logger.warn(`Retry ${i}/${retry}...`);
    }
    return null;
  }

  async getTomanPerDollarFromDB() {
    const latest = await this.usdToIrrModel
      .findOne({
        tomanPerDollar: { $gt: 0 },
      })
      .sort({ createdAt: -1 });
    if (!latest) return null;
    return latest;
  }
}
