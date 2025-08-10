import { Injectable, OnModuleInit } from '@nestjs/common';
import TelegramBot from 'node-telegram-bot-api';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import moment from 'moment-timezone';
import * as jalaali from 'jalaali-js';

@Injectable()
export class SilverService {
  private bot: TelegramBot;
  constructor(private readonly configService: ConfigService) {}

  // persian to english (number)
  toEnglishDigits(str: string): string {
    const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    return str
      .replace(/[۰-۹]/g, (d) => String(persianDigits.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String(arabicDigits.indexOf(d)));
  }

  formatNumber(number: number): string {
    return number.toLocaleString('en-US');
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

  // 🔸 Site 1 - shirazsilver.com
  async getPriceFromShirazSilver() {
    let browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
      timeout: 60000, // Increase timeout to 60 seconds
    });

    const page = await browser.newPage();

    await page.goto('https://shirazsilver.com/', { waitUntil: 'networkidle2' });

    // Wait for the price element to appear
    await page.waitForSelector('ul > li p.text-sm.font-bold.text-left.w-full');

    const priceText = await page.$eval(
      'ul > li p.text-sm.font-bold.text-left.w-full',
      (el) => (el.textContent || '').trim(),
    );

    await browser.close();

    // Convert to English digits and clean
    const cleanedPrice = priceText.replace(/[^\d]/g, '');
    const price = parseInt(cleanedPrice, 10);
    const dividedPrice = Math.floor(price / 10).toLocaleString();

    return `⚪️ shirazsilver.com: ${dividedPrice} تومان`;
  }

  // 🔸 Site 2 - sarzamineshemsh.ir
  async getPriceFromSarzaminShems(): Promise<string> {
    try {
      let browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
        timeout: 60000, // Increase timeout to 60 seconds
      });

      const page = await browser.newPage();
      await page.goto('https://sarzamineshemsh.ir/product-86', {
        waitUntil: 'networkidle2',
      });

      await page.waitForSelector('h5 span.ng-binding', { timeout: 10000 });

      const priceText = await page.$eval(
        'h5 span.ng-binding',
        (el) => el.textContent?.trim() || '',
      );

      await browser.close();

      const cleaned = priceText.replace(/[^0-9]/g, '');
      if (!cleaned) return '⚪️ sarzamineshemsh.ir: ❌ قیمت یافت نشد';

      const price = parseInt(cleaned, 10);
      const divided = Math.floor(price / 100);
      const formatted = divided.toLocaleString('en-US');

      return `⚪️ sarzamineshemsh.ir(عیار 995): ${formatted} تومان`;
    } catch (err) {
      console.error('❌ Error fetching SarzaminShems price:', err);
      return '⚪️ sarzamineshemsh.ir: خطا در دریافت قیمت';
    }
  }

  // 🔸 Site 3 - noghra.com
  async getPriceFromNoghra(): Promise<string> {
    try {
      const { data } = await axios.get('https://noghra.com/silver-price/');
      const $ = cheerio.load(data);

      const priceText = $('table tbody tr:nth-child(1) td p span strong span')
        .eq(1) // span[2] => index 1 چون صفرمبناییه
        .text()
        .trim();

      const cleanedPrice = this.toEnglishDigits(priceText).replace(
        /[^0-9]/g,
        '',
      );
      if (!cleanedPrice) {
        return '⚪️ noghra.com: ❌ قیمت یافت نشد';
      }

      return `⚪️ noghra.com: ${cleanedPrice} تومان`;
    } catch (error) {
      console.error('❌ Error fetching Noghra price:', error);
      return '⚪️ noghra.com: خطا در دریافت قیمت';
    }
  }

  // 🔸 Site 4 - tokeniko.com
  //Price converted from ounces to grams
  async getPriceFromTokeniko(): Promise<string> {
    try {
      const { data } = await axios.get(
        'https://tokeniko.com/products/silver-grain-1ounce-fine',
      );
      const $ = cheerio.load(data);

      const priceText = $('span.text-primary-purple-tint.font-bold.text-base')
        .first()
        .text()
        .trim();

      const cleanedPrice = this.toEnglishDigits(priceText).replace(
        /[^0-9]/g,
        '',
      );

      if (!cleanedPrice) {
        return '⚪️ tokeniko.com: ❌ قیمت یافت نشد';
      }

      const totalPrice = parseInt(cleanedPrice, 10); // قیمت برای ۱ اونس
      const perGramPrice = Math.floor(totalPrice / 31.1035); // قیمت هر گرم
      const formattedPrice = this.formatNumber(perGramPrice);

      return `⚪️ tokeniko.com: ${formattedPrice} تومان`;
    } catch (error) {
      console.error('❌ Error fetching Tokeniko 1oz price:', error);
      return '⚪️ tokeniko.com: خطا در دریافت قیمت';
    }
  }

  // 🔸 Site 5 - silverin.ir
  async getPriceFromSilverin() {
    let browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
      ],
      timeout: 60000, // Increase timeout to 60 seconds
    });

    const page = await browser.newPage();

    await page.goto('https://silverin.ir/', { waitUntil: 'networkidle2' });

    // Use equivalent CSS selector instead of XPath
    const selector =
      'section:nth-of-type(7) div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div > div:nth-of-type(6) bdi';

    await page.waitForSelector(selector);

    const priceText = await page.$eval(selector, (el) =>
      (el.textContent || '').trim(),
    );

    await browser.close();

    // Remove non-digits and convert Persian digits to English digits
    const persianToEnglishDigits = (str: string) =>
      str.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

    const cleanedPrice = persianToEnglishDigits(priceText).replace(
      /[^\d]/g,
      '',
    );
    const price = parseInt(cleanedPrice, 10);
    const dividedPrice = Math.floor(price / 50).toLocaleString();

    return `⚪️ silverin.ir: ${dividedPrice} تومان`;
  }

  // 🔸 Site 6 - noghresea.ir
  async getPriceFromNoghresea(): Promise<string> {
    try {
      let browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
        timeout: 60000,
      });

      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      await page.goto('https://noghresea.ir/', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for page to load completely
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Extract price using XPath
      const priceText = await page.evaluate(() => {
        const xpath =
          '/html/body/main/section[2]/div/div/div[1]/div[2]/span[1]';
        const result = document.evaluate(
          xpath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const element = result.singleNodeValue as HTMLElement;
        return element ? element.textContent?.trim() || '' : '';
      });

      await browser.close();

      const cleaned = priceText.replace(/[^0-9,]/g, '');

      if (!cleaned) {
        return '🔘 noghresea.ir: ❌ قیمت یافت نشد';
      }

      const numericPrice = cleaned.replace(/,/g, '');

      if (!numericPrice || isNaN(parseInt(numericPrice, 10))) {
        return '🔘 noghresea.ir: ❌ قیمت نامعتبر';
      }

      return `🔘 noghresea.ir: ${cleaned} تومان`;
    } catch (err) {
      console.error('❌ Error fetching NoghreGea price:', err);
      return '🔘 noghresea.ir: خطا در دریافت قیمت';
    }
  }

  async getAllSilverPrices(): Promise<string> {
    const prices = await Promise.all([
      this.getPriceFromShirazSilver(),
      this.getPriceFromSarzaminShems(),
      this.getPriceFromNoghra(),
      this.getPriceFromTokeniko(),
      this.getPriceFromSilverin(),
      this.getPriceFromNoghresea(),
      console.log(''),
      this.getIranTime(),
    ]);

    return `📊 قیمت گرم لحظه‌ای نقره:\n\n${prices.join('\n')}`;
    ``;
  }
}
