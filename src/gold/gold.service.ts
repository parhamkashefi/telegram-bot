import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment-timezone';
import * as jalaali from 'jalaali-js';
import puppeteer, { Browser, Page } from 'puppeteer';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Gold, GoldDocument } from './schema/gold.schema';
import { plainToInstance } from 'class-transformer';
import { GoldRo } from './dto/gold.ro';
import { GoldDto } from './dto/gold.dto';
import { UsdToIrrService } from 'src/usdToIrr/usdToIrr.service';

@Injectable()
export class GoldService {
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
    @InjectModel(Gold.name) private readonly goldModel: Model<GoldDocument>,
    private readonly usdToIrrService: UsdToIrrService,
  ) {}

  // persian to english (number)
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

  // 🔸 Site 1 - estjt.ir
  async getPriceFromEstjt(): Promise<{ site: string; prices: [number] }> {
    try {
      const { data } = await axios.get('https://www.estjt.ir/price/', {
        timeout: 20000,
      });

      const $ = cheerio.load(data);

      let prices: [number] = [0];

      $('tbody tr').each((_, tr) => {
        const tds = $(tr).find('td');
        const title = tds.eq(0).text().trim();
        const value = tds.eq(1).text().trim();

        if (title.includes('طلای ۱۸')) {
          const cleaned = value
            .replace(/[^\d۰-۹]/g, '')
            .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

          const numeric = Number(cleaned);

          if (Number.isFinite(numeric)) {
            prices = [numeric];
          }
        }
      });

      console.log('gold estjt : ', {
        site: 'estjt',
        prices,
      });
      return {
        site: 'estjt',
        prices,
      };
    } catch (error) {
      console.error('Error fetching price from estjt.ir:', error);
      return {
        site: 'estjt',
        prices: [0],
      };
    }
  }

  // 🔸 Site 2 - tablotala.app
  async getPriceFromTabloTala(): Promise<{ site: string; prices: [number] }> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      browser = await puppeteer.launch(this.browserConfig);
      page = await browser.newPage();

      await page.goto('https://tv.tablotala.app/#/home', {
        waitUntil: 'networkidle0',
        timeout: 60000,
      });

      await page.waitForSelector('body', { timeout: 10000 });

      const rawPrice = await page.evaluate(() => {
        const xpath = '/html/body/div/div[2]/div[2]/div[5]/div/span';
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );

        const el = result.singleNodeValue as HTMLElement | null;
        if (!el) return null;

        return el.textContent?.replace(/[^\d]/g, '') || null;
      });

      const price = rawPrice ? Number(rawPrice) : null;

      console.log('gold tablotala', {
        site: 'tablotala',
        prices: [price && !isNaN(price) ? price : 0],
      });

      return {
        site: 'tablotala',
        prices: [price && !isNaN(price) ? price : 0],
      };
    } catch (error) {
      console.error('Error fetching price from TabloTala:', error);
      return {
        site: 'tablotala',
        prices: [0],
      };
    } finally {
      await this.safeClosePage(page);
      await this.safeCloseBrowser(browser);
    }
  }

  // 🔸 Site 3 - tabangohar.com
  async getPriceFromTabanGohar(): Promise<{ site: string; prices: [number] }> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      browser = await puppeteer.launch(this.browserConfig);
      page = await browser.newPage();

      await page.goto('https://tabangohar.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });

      await page.waitForSelector('body', { timeout: 60000 });

      const rawPrice = await page.evaluate(() => {
        const xpath =
          '/html/body/main/div/div/section[4]/div[2]/div[1]/div/div[4]/div/div';

        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );

        const el = result.singleNodeValue as HTMLElement | null;
        if (!el) return null;

        return el.textContent?.replace(/[^\d]/g, '') || null;
      });

      const price = rawPrice ? Number(rawPrice) : 0;
      console.log('gold tabangohar :', {
        site: 'tabangohar',
        prices: [price && !isNaN(price) ? price : 0],
      });
      return {
        site: 'tabangohar',
        prices: [price && !isNaN(price) ? price : 0],
      };
    } catch (error) {
      console.error('Error fetching price from tabangohar:', error);
      return {
        site: 'tabangohar',
        prices: [0],
      };
    } finally {
      await this.safeClosePage(page);
      await this.safeCloseBrowser(browser);
    }
  }

  // 🔸 Site 4 - tala.ir
  async getPriceFromTalaIr(): Promise<{ site: string; prices: [number] }> {
    try {
      const { data } = await axios.get('https://www.tala.ir/', {
        timeout: 30000,
      });

      const $ = cheerio.load(data);

      const row = $('tr.gold_18k');
      const rawText = row.find('td.value').text().trim();

      if (!rawText) {
        return { site: 'tala.ir', prices: [0] };
      }

      const cleaned = this.toEnglishDigits(rawText).replace(/[^\d]/g, '');
      const price = cleaned ? Number(cleaned) : null;
      console.log('gold talaIR', {
        site: 'tala.ir',
        prices: [price && !isNaN(price) ? price : 0],
      });

      return {
        site: 'tala',
        prices: [price && !isNaN(price) ? price : 0],
      };
    } catch (error) {
      console.error('Error fetching price from tala.ir:', error);
      return {
        site: 'tala',
        prices: [0],
      };
    }
  }

  // 🔸 Site 5 - kitco.com
  async getPriceFromKitco(): Promise<{ site: string; price: [number] }> {
    let browser: Browser | null = null;

    try {
      browser = await puppeteer.launch(this.browserConfig);
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      await page.goto(
        'https://online.kitco.com/sell/126/0-7500-Pure-Gold-Bar-or-Coin-18-K-126',
        {
          waitUntil: 'networkidle2',
          timeout: 60000,
        },
      );

      await page.waitForSelector('span.price_product.per-g', {
        timeout: 30000,
      });

      const text = await page.$eval(
        'span.price_product.per-g',
        (el) => el.textContent || '',
      );

      const cleaned = text.replace(/[^\d.]/g, '');
      const price = Number(parseFloat(cleaned).toFixed(2));

      console.log('gold kitco : ', {
        site: 'kitco.com',
        price: [Number.isFinite(price) ? price : 0],
      });

      return {
        site: 'kitco.com',
        price: [Number.isFinite(price) ? price : 0],
      };
    } catch (error) {
      console.error('❌ Error fetching Kitco gold price:', error);
      return {
        site: 'kitco.com',
        price: [0],
      };
    } finally {
      await this.safeCloseBrowser(browser);
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

  async getAllGoldPrices(): Promise<GoldRo> {
    const [estjt, tabloTala, tabanGohar, talaIr, kitco] = await Promise.all([
      this.getPriceFromEstjt(),
      this.getPriceFromTabloTala(),
      this.getPriceFromTabanGohar(),
      this.getPriceFromTalaIr(),
      this.getPriceFromKitco(),
    ]);

    const tomanPerDollar = await this.usdToIrrService.getTomanPerDollar();
    const kitcoPrice = Number(kitco.price) || 0;
    const tomanGlobalPrice = Math.floor(kitcoPrice * tomanPerDollar);
    console.log('tomanGlobalPrice : ', tomanGlobalPrice);

    const prices = [
      estjt.prices,
      tabloTala.prices,
      tabanGohar.prices,
      talaIr.prices,
    ];

    const siteNames = [
      estjt.site,
      tabloTala.site,
      tabanGohar.site,
      talaIr.site,
    ];

    let sum = 0;
    let count = 0;
    for (const priceArray of prices) {
      if (priceArray[0] != 0 && priceArray[0] != undefined) {
        sum += priceArray[0];
        count++;
      }
    }
    let average = 0;
    if (count > 0) {
      average = sum / count;
      console.log('average : ', average);
    } else {
      console.warn('⚠️ All silver prices are 0, cannot calculate average');
    }

    const globalPrices = [kitco.price];
    const globalSiteNames = [kitco.site];

    let bubble = 0;
    if (average > 0 && !isNaN(average) && tomanGlobalPrice > 0) {
      bubble = ((average - tomanGlobalPrice) / average) * 100;
      console.log('gold bubble : ', bubble);
    } else {
      console.warn(
        '⚠️ Cannot calculate bubble: average or tomanGlobalPrice is invalid',
      );
    }
    const finalAverage = isNaN(average) || !isFinite(average) ? 0 : average;
    const finalBubble = isNaN(bubble) || !isFinite(bubble) ? 0 : bubble;

    const goldDto = {
      productType: 'gold',
      siteNames,
      prices,
      globalSiteNames,
      globalPrices,
      weights: [[1], [1], [1], [1]],
      tomanPerDollar,
      average: finalAverage,
      tomanGlobalPrice,
      bubble: finalBubble,
    };

    const gold = await this.createGoldPrices(goldDto);
    return gold;
  }
}

// return bubble and global gold price (Foreign gold price in Tomans) and avrage of gold price in iran

// async goldPanel(): Promise<any> {
//   const goldPrices = await this.getNewestGoldFromDB();
//   let sum = 0;
//   let counter = 0;
//   if (goldPrices == null) {
//     return 0;
//   }
//   for (const price in goldPrices.prices) {
//     if (goldPrices?.prices[price] != null && goldPrices?.prices[price] != 0) {
//       sum = goldPrices.prices[price] + sum;
//       counter = counter + 1;
//     }
//   }
//   const avrageGoldPrice = sum / counter;
//   const goldDollarPrice = goldPrices?.dollarPrices || 0;
//   const dollar = await this.goldModel
//     .find({ tomanPerDollar: { $gt: 0 } })
//     .sort({ createdAt: -1 })[0];
//   const dollarPrice = dollar?.tomanPerDollar;
//   const globalGoldPrice = Number(goldDollarPrice) * dollarPrice;
//   const bubble = (avrageGoldPrice - globalGoldPrice) / avrageGoldPrice;
//   return { bubble, globalGoldPrice, avrageGoldPrice };
// }
