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
        return '⚪️ noghresea.ir: ❌ قیمت یافت نشد';
      }

      const numericPrice = cleaned.replace(/,/g, '');

      if (!numericPrice || isNaN(parseInt(numericPrice, 10))) {
        return '⚪️ noghresea.ir: ❌ قیمت نامعتبر';
      }

      return `⚪️ noghresea.ir: ${cleaned} تومان`;
    } catch (err) {
      console.error('❌ Error fetching NoghreGea price:', err);
      return '⚪️ noghresea.ir: خطا در دریافت قیمت';
    }
  }

  // 🔸 Site 7 - tajnoghreh.com
  async getSilverPriceFromTajNoghre(): Promise<string> {
    try {
      const browser = await puppeteer.launch({
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

      await page.goto('https://tajnoghreh.com/silver-price/', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Give page time to fully render
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Extract price from the first text node of the element
      const priceText = await page.evaluate(() => {
        const el = document.querySelector(
          'td.sheyda_hamarz_table_content-price',
        );
        if (!el) return '';
        // First child text node contains the numeric price before "تومان"
        return el.childNodes[0]?.textContent?.trim() || '';
      });

      await browser.close();

      // Keep only numbers and commas
      const cleaned = priceText.replace(/[^0-9,]/g, '');

      if (!cleaned) {
        return '⚪️ tajnoghreh.com: ❌ قیمت یافت نشد';
      }

      const numericPrice = cleaned.replace(/,/g, '');

      if (!numericPrice || isNaN(parseInt(numericPrice, 10))) {
        return '⚪️ tajnoghreh.com: ❌ قیمت نامعتبر';
      }

      return `⚪️ tajnoghreh.com: ${cleaned} تومان`;
    } catch (err) {
      console.error('❌ Error fetching TajNoghre price:', err);
      return '⚪️ tajnoghreh.com: خطا در دریافت قیمت';
    }
  }

  // 🔸 Site 8 - kitco.com
  async getPriceFromKitco(): Promise<string> {
    const browser = await puppeteer.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto('https://www.kitco.com/', {
        waitUntil: 'domcontentloaded',
      });

      // silver element (second box on right side)
      const selector =
        'main div.flex > div:nth-child(2) div.text-right.font-medium';
      await page.waitForSelector(selector);

      const text = await page.$eval(
        selector,
        (el) => el.textContent?.trim() || '',
      );
      return `⚪️ kitco.com : ${text}`;
    } finally {
      await browser.close();
    }
  }

  // 🔸 Site 1 - tokeniko.com silver bars
  async getSilverBarPriceFromTokeniko() {
    const browser = await puppeteer.launch({
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
    await page.goto('https://tokeniko.com/products/silver-bar', {
      waitUntil: 'networkidle2',
    });

    const bars = [
      {
        label: '10g',
        xpath: '/html/body/div[3]/div/main/section[1]/div[2]/a[1]/div/div[1]/p',
      },
      {
        label: '20g',
        xpath: '/html/body/div[3]/div/main/section[1]/div[2]/a[2]/div/div[1]/p',
      },
      {
        label: '1oz',
        xpath: '/html/body/div[3]/div/main/section[1]/div[2]/a[3]/div/div[1]/p',
      },
      {
        label: '50g',
        xpath: '/html/body/div[3]/div/main/section[1]/div[2]/a[4]/div/div[1]/p',
      },
      {
        label: '100g',
        xpath: '/html/body/div[3]/div/main/section[1]/div[2]/a[5]/div/div[1]/p',
      },
      {
        label: '250g',
        xpath: '/html/body/div[3]/div/main/section[1]/div[2]/a[6]/div/div[1]/p',
      },
      {
        label: '500g',
        xpath: '/html/body/div[3]/div/main/section[1]/div[2]/a[7]/div/div[1]/p',
      },
    ];

    const prices: string[] = [];

    for (const { label, xpath } of bars) {
      const text = await page.evaluate((xp) => {
        const result = document.evaluate(
          xp,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        ).singleNodeValue as HTMLElement | null;

        if (!result) return 'N/A';

        let txt = result.textContent || '';
        txt = txt.replace('قیمت :', '').replace('تومان', '').trim();
        return txt;
      }, xpath);

      const englishNumber = text.replace(/[۰-۹]/g, (d) =>
        String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)),
      );

      prices.push(`${label}: ${englishNumber}`);
    }

    await browser.close();

    // Final formatted output
    return `⚪️ tokeniko.com silver bars : \n${prices.join('\n')}`;
  }

  // 🔸 Site 2 - tokeniko.com silver bars
  async getSilverBarPriceFromParsis(): Promise<string> {
    const browser = await puppeteer.launch({
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

    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      const url =
        'https://parsisgold.com/cats/2/%D8%B4%D9%85%D8%B4-%D9%86%D9%82%D8%B1%D9%87';

      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      const xpath = '/html/body/form/div[5]/div/div/div/div/div[1]/p[2]/span';

      // Wait for the element to appear and contain text
      await page.waitForFunction(
        (xp) => {
          const node = document.evaluate(
            xp,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          ).singleNodeValue as HTMLElement | null;
          return !!(node && node.textContent && node.textContent.trim().length);
        },
        { timeout: 60000 },
        xpath,
      );

      const price = await page.evaluate((xp) => {
        const node = document.evaluate(
          xp,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        ).singleNodeValue as HTMLElement | null;
        if (!node) return '';
        return (node.textContent || '').replace('تومان', '').trim();
      }, xpath);

      // Remove anything that's not a digit or comma
      const cleaned = price.replace(/[^0-9۰-۹,٠-٩]/g, '');

      if (!cleaned) {
        return '⚪️ parsisgold.com silver bar : ❌ قیمت یافت نشد';
      }

      // Convert Persian/Arabic digits to English digits
      const englishDigits = this.toEnglishDigits(cleaned);

      // Remove commas before converting to number
      const numericPrice = parseInt(englishDigits.replace(/,/g, ''), 10);

      if (isNaN(numericPrice)) {
        return '⚪️ parsisgold.com silver bar : ❌ قیمت یافت نشد';
      }

      // Format the number with commas
      const formattedPrice = this.formatNumber(numericPrice);

      return `⚪️ parsisgold.com silver bar : ${formattedPrice}`;
    } catch (err) {
      console.error('Parsis scrape error:', err);
      return '⚪️ parsisgold.com silver bar : خطا در دریافت';
    } finally {
      await browser.close();
    }
  }
  // 🔸 Site 3 - zioto.gold silver bars
  async getZiotoSilverBars(): Promise<string> {
    const browser = await puppeteer.launch({
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

    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      const url =
        'https://zioto.gold/index.php?route=product/category&language=fa-ir&path=60';
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      // XPaths for each weight
      const xpaths = [
        '/html/body/div[6]/div/div[2]/div/div/div/div[2]/div[1]/div/div[2]/div[4]/div/span', // 1oz
        '/html/body/div[6]/div/div[2]/div/div/div/div[2]/div[2]/div/div[2]/div[4]/div/span', // 50g
        '/html/body/div[6]/div/div[2]/div/div/div/div[2]/div[3]/div/div[2]/div[4]/div/span', // 100g
        '/html/body/div[6]/div/div[2]/div/div/div/div[2]/div[4]/div/div[2]/div[4]/div/span', // 250g
        '/html/body/div[6]/div/div[2]/div/div/div/div[2]/div[5]/div/div[2]/div[4]/div/span', // 500g
        '/html/body/div[6]/div/div[2]/div/div/div/div[2]/div[6]/div/div[2]/div[4]/div/span', // 1000g
      ];

      const weights = ['1oz', '50g', '100g', '250g', '500g', '1000g'];
      const results: string[] = [];

      for (let i = 0; i < xpaths.length; i++) {
        const xpath = xpaths[i];

        // Wait for the element to have text
        await page.waitForFunction(
          (xp) => {
            const node = document.evaluate(
              xp,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null,
            ).singleNodeValue as HTMLElement | null;
            return !!(
              node &&
              node.textContent &&
              node.textContent.trim().length
            );
          },
          { timeout: 60000 },
          xpath,
        );

        // Extract the text
        const price = await page.evaluate((xp) => {
          const node = document.evaluate(
            xp,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          ).singleNodeValue as HTMLElement | null;
          return node?.textContent?.trim() || '';
        }, xpath);

        // Clean and convert digits
        const cleaned = this.toEnglishDigits(
          price.replace(/تومان/g, '').trim(),
        );
        const numericPrice = cleaned.replace(/[^0-9]/g, '');

        results.push(
          `${weights[i]} : ${this.formatNumber(Number(numericPrice))}`,
        );
      }

      return `⚪ zioto.gold silver bars:\n\n${results.join('\n')}`;
    } catch (err) {
      console.error('Zioto scrape error:', err);
      return '⚪ zioto.gold: خطا در دریافت';
    } finally {
      await browser.close();
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
      this.getSilverPriceFromTajNoghre(),
      this.getSilverBarPriceFromTokeniko(),
      this.getSilverBarPriceFromParsis(),
      this.getZiotoSilverBars(),
      console.log(''),
      this.getPriceFromKitco(),
      console.log(''),
      this.getIranTime(),
    ]);

    return `📊 قیمت لحظه‌ای نقره:\n\n${prices.join('\n')}`;
    ``;
  }
}
