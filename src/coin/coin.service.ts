import { Injectable } from '@nestjs/common';
import moment from 'moment-timezone';
import * as jalaali from 'jalaali-js';
import puppeteer, { Browser, Page } from 'puppeteer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { plainToInstance } from 'class-transformer';
import { UsdToIrrService } from 'src/usdToIrr/usdToIrr.service';
import { Coin, CoinDocument } from './schema/coin.schema';
import { CoinRo } from './dto/coin.ro';
import { CoinDto } from './dto/coin.dto';

@Injectable()
export class CoinService {
  private readonly browserArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process',
    '--disable-gpu',
    '--disable-features=VizDisplayCompositor',
    '--disable-software-rasterizer',
  ];
  private readonly browserConfig = {
    headless: true,
    args: this.browserArgs,
    timeout: 60000,
  };

  constructor(
    @InjectModel(Coin.name) private readonly coinModel: Model<CoinDocument>,
  ) {}

  toEnglishDigits(str: string): string {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    return str
      .replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
  }

  getIranTime(): string {
    const now = moment().tz('Asia/Tehran');
    const gYear = now.year();
    const gMonth = now.month() + 1;
    const gDay = now.date();

    const jDate = jalaali.toJalaali(gYear, gMonth, gDay);
    const date = `${jDate.jy}/${String(jDate.jm).padStart(2, '0')}/${String(jDate.jd).padStart(2, '0')}`;
    const time = now.format('HH:mm:ss');

    return `🕰 ${date} - ${time} (به وقت تهران)`;
  }

  private async safeClosePage(page: Page | null): Promise<void> {
    if (page) {
      try {
        await page.close();
      } catch (err) {
        console.error('Error closing page:', err);
      }
    }
  }

  private async safeCloseBrowser(browser: Browser | null): Promise<void> {
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        console.error('Error closing browser:', err);
      }
    }
  }

  async getOneGramCoinPrice(): Promise<{
    site: string;
    price: [number];
    weight: [number];
  }> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    const url = 'https://www.tgju.org/coin';
    const xpath =
      '/html/body/main/div[4]/div/div/div[1]/table/tbody/tr[5]/td[1]';

    try {
      browser = await puppeteer.launch(this.browserConfig);
      page = await browser.newPage();

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      await page.waitForFunction(
        (xp) => {
          const result = document.evaluate(
            xp,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          );
          return result.singleNodeValue?.textContent?.trim().length;
        },
        { timeout: 30000 },
        xpath,
      );

      const rawText = await page.evaluate((xp) => {
        const result = document.evaluate(
          xp,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        return result.singleNodeValue?.textContent?.trim() || '';
      }, xpath);

      const cleaned = rawText.replace(/,/g, '');
      const price = Number(cleaned);

      if (!Number.isFinite(price)) {
        throw new Error(`Invalid price: ${rawText}`);
      }

      console.log('TGJU 1g coin%%%%%:', {
        raw: rawText,
        parsed: price,
      });

      return {
        site: 'tgju',
        price: [price],
        weight: [1],
      };
    } catch (err) {
      console.error('❌ TGJU coin fetch failed:', err.message);
      return {
        site: 'tgju.org',
        price: [0],
        weight: [1],
      };
    } finally {
      await this.safeClosePage(page);
      await this.safeCloseBrowser(browser);
    }
  }

  async getQuarterCoinPrice(): Promise<{
    site: string;
    price: [number];
    weight: [number];
  }> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    const xpath =
      '/html/body/main/div[4]/div/div/div[1]/table/tbody/tr[4]/td[1]';

    try {
      browser = await puppeteer.launch(this.browserConfig);
      page = await browser.newPage();

      await page.goto('https://www.tgju.org/coin', {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      await page.waitForFunction(
        (x) => {
          const r = document.evaluate(
            x,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          );
          return r.singleNodeValue?.textContent?.trim().length;
        },
        {},
        xpath,
      );

      const raw = await page.evaluate((x) => {
        const r = document.evaluate(
          x,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        return r.singleNodeValue?.textContent?.trim() || '';
      }, xpath);

      const price = Number(raw.replace(/,/g, '')) || 0;

      console.log('Quarter coin:', price);

      return {
        site: 'tgju-quarter',
        price: [price],
        weight: [0.25],
      };
    } catch (err) {
      console.error('❌ Quarter coin error:', err.message);
      return { site: 'tgju-quarter', price: [0], weight: [0.25] };
    } finally {
      await this.safeClosePage(page);
      await this.safeCloseBrowser(browser);
    }
  }

  async getHalfCoinPrice(): Promise<{
    site: string;
    price: [number];
    weight: [number];
  }> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    const xpath =
      '/html/body/main/div[4]/div/div/div[1]/table/tbody/tr[3]/td[1]';

    try {
      browser = await puppeteer.launch(this.browserConfig);
      page = await browser.newPage();

      await page.goto('https://www.tgju.org/coin', {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      await page.waitForFunction(
        (x) => {
          const r = document.evaluate(
            x,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          );
          return r.singleNodeValue?.textContent?.trim().length;
        },
        {},
        xpath,
      );

      const raw = await page.evaluate((x) => {
        const r = document.evaluate(
          x,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        return r.singleNodeValue?.textContent?.trim() || '';
      }, xpath);

      const price = Number(raw.replace(/,/g, '')) || 0;

      console.log('Half coin:', price);

      return {
        site: 'tgju-half',
        price: [price],
        weight: [0.5],
      };
    } catch (err) {
      console.error('❌ Half coin error:', err.message);

      return {
        site: 'tgju-half',
        price: [0],
        weight: [0.5],
      };
    } finally {
      await this.safeClosePage(page);
      await this.safeCloseBrowser(browser);
    }
  }

  async getBaharAzadiCoinPrice(): Promise<{
    site: string;
    price: [number];
    weight: [number];
  }> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    const xpath =
      '/html/body/main/div[4]/div/div/div[1]/table/tbody/tr[2]/td[1]';

    try {
      browser = await puppeteer.launch(this.browserConfig);
      page = await browser.newPage();

      await page.goto('https://www.tgju.org/coin', {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      // wait for xpath safely (since waitForXPath doesn't exist)
      await page.waitForFunction(
        (x) => {
          const r = document.evaluate(
            x,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          );
          return r.singleNodeValue?.textContent?.trim().length;
        },
        {},
        xpath,
      );

      const raw = await page.evaluate((x) => {
        const r = document.evaluate(
          x,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        return r.singleNodeValue?.textContent?.trim() || '';
      }, xpath);

      const price = Number(raw.replace(/,/g, '')) || 0;

      console.log('Bahar Azadi coin:', price);

      return {
        site: 'tgju-bahar-azadi',
        price: [price],
        weight: [8.13], // Bahar Azadi full coin weight (grams)
      };
    } catch (err) {
      console.error('❌ Bahar Azadi coin error:', err.message);

      return {
        site: 'tgju-bahar-azadi',
        price: [0],
        weight: [8.13],
      };
    } finally {
      await this.safeClosePage(page);
      await this.safeCloseBrowser(browser);
    }
  }

  async getImamCoinPrice(): Promise<{
    site: string;
    price: [number];
    weight: [number];
  }> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    const xpath =
      '/html/body/main/div[4]/div/div/div[1]/table/tbody/tr[1]/td[1]';

    try {
      browser = await puppeteer.launch(this.browserConfig);
      page = await browser.newPage();

      await page.goto('https://www.tgju.org/coin', {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      // wait until element exists
      await page.waitForFunction(
        (x) => {
          const r = document.evaluate(
            x,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          );
          return r.singleNodeValue?.textContent?.trim().length;
        },
        {},
        xpath,
      );

      const raw = await page.evaluate((x) => {
        const r = document.evaluate(
          x,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        return r.singleNodeValue?.textContent?.trim() || '';
      }, xpath);

      const price = Number(raw.replace(/,/g, '')) || 0;

      console.log('Imam coin:', {
        raw,
        parsed: price,
      });

      return {
        site: 'tgju-imam',
        price: [price],
        weight: [8.133],
      };
    } catch (err) {
      console.error('❌ Imam coin error:', err.message);

      return {
        site: 'tgju-imam',
        price: [0],
        weight: [8.133],
      };
    } finally {
      await this.safeClosePage(page);
      await this.safeCloseBrowser(browser);
    }
  }

  async getCoinFromDB(): Promise<CoinRo | null> {
    try {
      const newest = await this.coinModel
        .findOne()
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      if (!newest) return null;

      return plainToInstance(CoinRo, newest, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      console.error('❌ Error getting newest coin from DB:', error);
      return null;
    }
  }

  async createGoldPrices(coinDto: CoinDto): Promise<CoinRo> {
    const created = await this.coinModel.create(coinDto);
    return plainToInstance(CoinRo, created.toObject(), {
      excludeExtraneousValues: true,
    });
  }

  async getAllCoinPrices(): Promise<CoinRo> {
    const [one, quarter, Imam, Half] = await Promise.all([
      this.getQuarterCoinPrice(),
      this.getOneGramCoinPrice(),
      this.getImamCoinPrice(),
      this.getHalfCoinPrice(),
    ]);

    const prices = [
      one.price,
      quarter.price,
      Imam.price,
      Imam.price,
      Half.price,
    ];

    const siteNames = [one.site, quarter.site, Imam.site, Imam.site, Half.site];

    const coinDto = {
      productType: 'coin',
      siteNames,
      prices,
      weights: [[1], [1], [1], [1]],
    };

    const coin = await this.createGoldPrices(coinDto);
    return coin;
  }
}
