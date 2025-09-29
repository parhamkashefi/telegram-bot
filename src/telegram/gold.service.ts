import { Injectable } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import moment from 'moment-timezone';
import * as jalaali from 'jalaali-js';
import puppeteer from 'puppeteer';
@Injectable()
export class GoldService {
  private bot: TelegramBot;
  constructor(private readonly configService: ConfigService) {}
  private readonly adminChatId = 112720047;

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
    const gMonth = now.month() + 1; // ماه در moment صفر-بیسه
    const gDay = now.date();

    const jDate = jalaali.toJalaali(gYear, gMonth, gDay);
    const date = `${jDate.jy}/${String(jDate.jm).padStart(2, '0')}/${String(jDate.jd).padStart(2, '0')}`;
    const time = now.format('HH:mm:ss');

    return `🕰 ${date} - ${time} (به وقت تهران)`;
  }

  // 🔸 Site 1 - estjt.ir
  async getPriceFromEstjt(): Promise<string> {
    try {
      const { data } = await axios.get('https://www.estjt.ir/price/');
      const $ = cheerio.load(data);
      let price = '❌ پیدا نشد';
      $('tbody tr').each((_, tr) => {
        const tds = $(tr).find('td');
        if (tds.eq(0).text().includes('طلای ۱۸')) {
          price = this.toEnglishDigits(tds.eq(1).text().trim());
        }
      });
      return `🟡 estjt.ir: ${price} `;
    } catch {
      return '🟡 estjt.ir: خطا در دریافت';
    }
  }

  // 🔸 Site 2 - tablotala.app

  async getPriceFromTabloTala(): Promise<string> {
    let  browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      timeout: 60000, // Increase timeout to 60 seconds
    });
    try {
      // Launch a headless browser

      const page = await browser.newPage();

      // Navigate to the website
      await page.goto('https://tv.tablotala.app/#/home', {
        waitUntil: 'networkidle0',
      });

      console.log('Page loaded, waiting for content...');

      // Wait for a generic element to ensure page load (e.g., body)
      await page.waitForSelector('body', { timeout: 10000 });

      // Extract the price using XPath with document.evaluate
      const price = await page.evaluate(() => {
        const xpath = '/html/body/div/div[2]/div[2]/div[5]/div/span';
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const element = result.singleNodeValue as HTMLElement;
        return element
          ? (element.textContent || '').trim().replace(/[^\d]/g, '')
          : null;
      });

      // Close the browser
      await browser.close();
      // Return the formatted price or error message
      if (price) {
        return `🟡  tv.tablotala.app: ${price} `;
      } else {
        return '🟡 tv.tablotala.app: ❌ پیدا نشد';
      }
    } catch (error) {
      console.error('Error fetching price from TabloTala:', error);
      if (browser) await browser.close();
      return '🟡 tv.tablotala.app: خطا در دریافت';
    }
  }

  // 🔸 Site 3 - tabangohar.com
  async getPriceFromTabanGohar(): Promise<string> {
    let  browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ],
      timeout: 60000, // Increase timeout to 60 seconds
    });
    let page;
    try {
      // Launch a headless browser

      page = await browser.newPage();

      // Navigate to the website
      await page.goto('https://tabangohar.com/', {
        waitUntil: 'domcontentloaded',
      });

      // Wait for a generic element to ensure page load (e.g., body)
      await page.waitForSelector('body', { timeout: 60000 });

      // Extract the price using XPath with document.evaluate
      const price = await page.evaluate(() => {
        const xpath =
          '/html/body/main/div/div/section[4]/div[2]/div[1]/div/div[4]/div/div';
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const element = result.singleNodeValue as HTMLElement;
        return element
          ? (element.textContent || '').trim().replace(/[^\d]/g, '')
          : null;
      });

      // Return the formatted price or error message
      if (price) {
        return `🟡 tabangohar.com : ${price}`;
      } else {
        return '🟡 tabangohar.com : ❌ پیدا نشد';
      }
    } catch (error) {
      console.error('Error fetching price from tabangohar:', error);
      return '🟡 tabangohar.com : خطا در دریافت';
    } finally {
      // Always close page and browser in finally block
      try {
        if (page) {
          await page.close();
        }
      } catch (closeError) {
        console.error('Error closing page:', closeError);
      }

      try {
        if (browser) {
          await browser.close();
        }
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }

  // 🔸 Site 4 - tala.ir
  async getPriceFromTalaIr(): Promise<string> {
    try {
      const { data } = await axios.get('https://www.tala.ir/');
      const $ = cheerio.load(data);

      const row = $('tr.gold_18k');
      const price = this.toEnglishDigits(row.find('td.value').text().trim());

      if (price) {
        return `🟡  tala.ir: ${price} `;
      } else {
        return '🟡 tala.ir: ❌ قیمت طلا پیدا نشد';
      }
    } catch (error) {
      console.error('خطا در دریافت قیمت:', error);
      return '🟡 tala.ir: خطا در دریافت قیمت';
    }
  }

  // 🔸 Site 5 - kitco.com
 async  getPriceFromKitco(): Promise<string> {
  const browser = await puppeteer.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto('https://www.kitco.com/', { waitUntil: 'domcontentloaded' });

    // gold element (first box on left side)
    const selector = 'main div.flex > div:nth-child(1) div.text-right.font-medium';
    await page.waitForSelector(selector);

    const text = await page.$eval(selector, (el) => el.textContent?.trim() || '');
    return `🟡 kitco.com : ${text}`;
  } finally {
    await browser.close();
  }
}


  // 🧠 Add sources like this
  async getAllGoldPrices(): Promise<string> {
    const prices = await Promise.all([
      this.getPriceFromEstjt(),
      this.getPriceFromTabloTala(),
      this.getPriceFromTabanGohar(),
      this.getPriceFromTalaIr(),
      console.log(''),
      this.getPriceFromKitco(),
      console.log(''),
      this.getIranTime(),
    ]);

    return `📊 قیمت لحظه‌ای طلای ۱۸ عیار:\n\n${prices.join('\n')}`;
    ``;
  }
}
