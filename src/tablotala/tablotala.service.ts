import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export type TabloTalaPriceMap = Map<string, number>;

type MemberPriceItem = {
  id?: string;
  price?: string | number;
};

type MemberPriceResponse = {
  ecode?: number | string;
  items?: MemberPriceItem[];
};

type TvPriceResponse = {
  data?: Array<{ type?: string; price?: number }>;
};

@Injectable()
export class TabloTalaService {
  private readonly logger = new Logger(TabloTalaService.name);
  private cache: { at: number; rows: TabloTalaPriceMap } | null = null;
  private inflight: Promise<TabloTalaPriceMap> | null = null;
  private readonly cacheMs = 5_000;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Member webservice first (price.tablotala.com/json.php),
   * then the public TV feed as fallback.
   */
  async getPrices(
    timeoutMs = 8000,
    options?: { bypassCache?: boolean },
  ): Promise<TabloTalaPriceMap> {
    if (
      !options?.bypassCache &&
      this.cache &&
      Date.now() - this.cache.at < this.cacheMs
    ) {
      return this.cache.rows;
    }
    if (this.inflight) return this.inflight;

    this.inflight = this.loadPrices(timeoutMs).finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async loadPrices(timeoutMs: number): Promise<TabloTalaPriceMap> {
    const member = await this.fetchMemberJson(timeoutMs);
    if (member.size > 0) {
      this.cache = { at: Date.now(), rows: member };
      return member;
    }

    const tv = await this.fetchTvApi(timeoutMs);
    if (tv.size > 0) {
      this.cache = { at: Date.now(), rows: tv };
    }
    return tv;
  }

  private async fetchMemberJson(
    timeoutMs: number,
  ): Promise<TabloTalaPriceMap> {
    const rows: TabloTalaPriceMap = new Map();
    const username = (
      this.configService.get<string>('TABLOTALA_USERNAME') || ''
    ).trim();
    const password = this.configService.get<string>('TABLOTALA_PASSWORD') || '';
    const url =
      this.configService.get<string>('TABLOTALA_JSON_URL') ||
      'http://price.tablotala.com/json.php';

    if (!username || !password) {
      this.logger.warn(
        'TABLOTALA_USERNAME / TABLOTALA_PASSWORD not set — skipping member API',
      );
      return rows;
    }

    try {
      const { data } = await axios.get<MemberPriceResponse>(url, {
        timeout: timeoutMs,
        params: { get: 'price', username, password },
        headers: {
          Accept: 'application/json, text/plain, */*',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const ecode = Number(data?.ecode);
      if (ecode !== 0) {
        this.logger.warn(`Tablo Tala member API ecode=${ecode}`);
        return rows;
      }

      const items = Array.isArray(data?.items) ? data.items : [];
      for (const item of items) {
        const id = String(item?.id || '').trim();
        const price = Number(item?.price);
        if (id && Number.isFinite(price) && price > 0) {
          rows.set(id, price);
        }
      }
    } catch (error) {
      this.logger.error('Tablo Tala member API failed', error);
    }
    return rows;
  }

  private async fetchTvApi(timeoutMs: number): Promise<TabloTalaPriceMap> {
    const rows: TabloTalaPriceMap = new Map();
    try {
      const { data } = await axios.get<TvPriceResponse>(
        'https://admin.tablotala.app/api/tv/price?type=IR',
        {
          timeout: timeoutMs,
          headers: {
            Accept: 'application/json',
            Origin: 'https://tv.tablotala.app',
            Referer: 'https://tv.tablotala.app/',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        },
      );

      const list = Array.isArray(data?.data) ? data.data : [];
      for (const row of list) {
        const type = String(row?.type || '');
        const price = Number(row?.price);
        if (type && Number.isFinite(price) && price > 0) {
          rows.set(type, price);
        }
      }
    } catch (error) {
      this.logger.error('Tablo Tala TV API failed', error);
    }
    return rows;
  }
}
