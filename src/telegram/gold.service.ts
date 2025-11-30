import { Injectable } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment-timezone';
import * as jalaali from 'jalaali-js';
import puppeteer, { Browser, Page } from 'puppeteer';

@Injectable()
export class GoldService {
  private bot: TelegramBot;
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

  constructor(private readonly configService: ConfigService) { }

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

  private formatPrice(price: string): string {
    return Number(price).toLocaleString('en-US');
  }

  // 🔸 Site 1 - estjt.ir
  async getPriceFromEstjt(): Promise<string> {
    try {
      const { data } = await axios.get('https://www.estjt.ir/price/', {
        timeout: 30000,
      });

      const $ = cheerio.load(data);
      let price: string | null = null;

      $('tbody tr').each((_, tr) => {
        const tds = $(tr).find('td');
        const title = tds.eq(0).text().trim();
        const value = tds.eq(1).text().trim();

        if (title.includes('طلای ۱۸')) {
          const cleanValue = value.replace(/[^\d۰-۹]/g, '');
          const englishValue = cleanValue.replace(/[۰-۹]/g, (d) =>
            String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
          );
          price = englishValue;
        }
      });

      return price 
        ? `estjt.ir: ${this.formatPrice(price)}`
        : 'estjt.ir: ❌ پیدا نشد';
    } catch (error) {
      console.error('Error fetching price from estjt.ir:', error);
      return 'estjt.ir: خطا در دریافت';
    }
  }

  // 🔸 Site 2 - tablotala.app
  async getPriceFromTabloTala(): Promise<string> {
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

      const price = await page.evaluate(() => {
        const xpath = '/html/body/div/div[2]/div[2]/div[5]/div/span';
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        const element = result.singleNodeValue as HTMLElement | null;
        if (!element) return null;

        const rawText = (element.textContent || '').trim();
        return rawText.replace(/[^\d]/g, '') || null;
      });

      return price
        ? `tv.tablotala.app: ${this.formatPrice(price)}`
        : 'tv.tablotala.app: ❌ پیدا نشد';
    } catch (error) {
      console.error('Error fetching price from TabloTala:', error);
      return 'tv.tablotala.app: خطا در دریافت';
    } finally {
      await this.safeClosePage(page);
      await this.safeCloseBrowser(browser);
    }
  }

  // 🔸 Site 3 - tabangohar.com
  async getPriceFromTabanGohar(): Promise<string> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      browser = await puppeteer.launch(this.browserConfig);
      page = await browser.newPage();
      
      await page.goto('https://tabangohar.com/', {
        waitUntil: 'domcontentloaded',
      });

      await page.waitForSelector('body', { timeout: 60000 });

      const price = await page.evaluate(() => {
        const xpath = '/html/body/main/div/div/section[4]/div[2]/div[1]/div/div[4]/div/div';
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        const element = result.singleNodeValue as HTMLElement | null;
        if (!element) return null;

        const rawText = (element.textContent || '').trim();
        return rawText.replace(/[^\d]/g, '') || null;
      });

      return price
        ? `tabangohar.com : ${this.formatPrice(price)}`
        : 'tabangohar.com : ❌ پیدا نشد';
    } catch (error) {
      console.error('Error fetching price from tabangohar:', error);
      return 'tabangohar.com : خطا در دریافت';
    } finally {
      await this.safeClosePage(page);
      await this.safeCloseBrowser(browser);
    }
  }

  // 🔸 Site 4 - tala.ir
  async getPriceFromTalaIr(): Promise<string> {
    try {
      const { data } = await axios.get('https://www.tala.ir/');
      const $ = cheerio.load(data);

      const row = $('tr.gold_18k');
      const price = this.toEnglishDigits(row.find('td.value').text().trim());

      return price
        ? `tala.ir: ${price} `
        : 'tala.ir: ❌ قیمت طلا پیدا نشد';
    } catch (error) {
      console.error('خطا در دریافت قیمت:', error);
      return 'tala.ir: خطا در دریافت قیمت';
    }
  }

  // 🔸 Site 5 - kitco.com
  async getPriceFromKitco(): Promise<string> {
    const browser = await puppeteer.launch(this.browserConfig);
    
    try {
      const page = await browser.newPage();
      await page.goto('https://www.kitco.com/', {
        waitUntil: 'domcontentloaded',
      });

      const selector = 'main div.flex > div:nth-child(1) div.text-right.font-medium';
      await page.waitForSelector(selector);

      const text = await page.$eval(
        selector,
        (el) => el.textContent?.trim() || '',
      );
      return `kitco.com $ : ${text}`;
    } finally {
      await this.safeCloseBrowser(browser);
    }
  }

  // output all prices
  async getAllGoldPrices(): Promise<string> {
    const [
      estjtPrice,
      tabloTalaPrice,
      tabanGoharPrice,
      talaIrPrice,
      kitcoPrice
    ] = await Promise.all([
      this.getPriceFromEstjt(),
      this.getPriceFromTabloTala(),
      this.getPriceFromTabanGohar(),
      this.getPriceFromTalaIr(),
      this.getPriceFromKitco()
    ]);

    const iranTime = this.getIranTime();

    const prices = [
      estjtPrice, 
      tabloTalaPrice, 
      tabanGoharPrice, 
      talaIrPrice, 
      '', 
      kitcoPrice, 
      '', 
      iranTime
    ];
    
    return `قیمت لحظه‌ای طلای ۱۸ عیار: (تومن)\n\n${prices.join('\n')}`;
  }
}