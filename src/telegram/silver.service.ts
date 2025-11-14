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
  constructor(private readonly configService: ConfigService) { }

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
    const gMonth = now.month() + 1;
    const gDay = now.date();

    const jDate = jalaali.toJalaali(gYear, gMonth, gDay);
    const date = `${jDate.jy}/${String(jDate.jm).padStart(2, '0')}/${String(jDate.jd).padStart(2, '0')}`;
    const time = now.format('HH:mm:ss');

    return `🕰 ${date} - ${time} (به وقت تهران)`;
  }

  // 🔸 Site 1 - shirazsilver.com
  //namojod
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
        '--disable-features=VizDisplayCompositor',
        '--disable-software-rasterizer',
      ],
      timeout: 60000,
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      await page.goto('https://shirazsilver.com/', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Try multiple selectors
      const selectors = [
        'span.text-\\[20px\\]', // The class from your HTML
        'p span', // Any span inside paragraph
        '[class*="text-"] span', // Any span with text classes
        'main span' // Any span in main
      ];

      let priceText = '';
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          priceText = await page.$eval(selector, el => el.textContent?.trim() || '');
          if (priceText && priceText.match(/[\d٬]/)) { // Check if it contains numbers/commas
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!priceText) {
        return 'shirazsilver.com: ❌ قیمت یافت نشد';
      }

      // Convert Persian digits to English and clean
      const persianToEnglish = (str: string) =>
        str.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
          .replace(/٬/g, ''); // Remove Arabic thousands separator

      const cleanedPrice = persianToEnglish(priceText).replace(/[^\d]/g, '');

      if (!cleanedPrice) {
        return 'shirazsilver.com: ❌ قیمت نامعتبر';
      }

      const price = parseInt(cleanedPrice, 10);

      if (isNaN(price)) {
        return 'shirazsilver.com: ❌ قیمت نامعتبر';
      }

      const dividedPrice = Math.floor(price / 10).toLocaleString('en-US');

      return `shirazsilver.com: ${dividedPrice}`;

    } catch (error) {
      console.error('❌ Error fetching ShirazSilver price:', error);
      return 'shirazsilver.com: خطا در دریافت قیمت';
    } finally {
      if (browser) {
        await browser.close();
      }
    }
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
          '--disable-features=VizDisplayCompositor',
          '--disable-software-rasterizer',
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
      if (!cleaned) return 'sarzamineshemsh.ir: ❌ قیمت یافت نشد';

      const price = parseInt(cleaned, 10);
      const divided = Math.floor(price / 100);
      const formatted = divided.toLocaleString('en-US');

      return `sarzamineshemsh.ir (عیار 995): ${formatted}`;
    } catch (err) {
      console.error('❌ Error fetching SarzaminShems price:', err);
      return 'sarzamineshemsh.ir: خطا در دریافت قیمت';
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
        return 'noghra.com: ❌ قیمت یافت نشد';
      }

      return `noghra.com: ${cleanedPrice}`;
    } catch (error) {
      console.error('❌ Error fetching Noghra price:', error);
      return 'noghra.com: خطا در دریافت قیمت';
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
        return 'tokeniko.com: ❌ قیمت یافت نشد';
      }

      const totalPrice = parseInt(cleanedPrice, 10); // قیمت برای ۱ اونس
      const perGramPrice = Math.floor(totalPrice / 31.1035); // قیمت هر گرم
      const formattedPrice = this.formatNumber(perGramPrice);

      return `tokeniko.com: ${formattedPrice}`;
    } catch (error) {
      console.error('❌ Error fetching Tokeniko 1oz price:', error);
      return 'tokeniko.com: خطا در دریافت قیمت';
    }
  }

  // 🔸 Site 5 - silverin.ir
  async getPriceFromSilverin(): Promise<string> {
    let browser;
    try {
      browser = await puppeteer.launch({
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
          '--disable-features=VizDisplayCompositor',
          '--disable-software-rasterizer',
        ],
        timeout: 60000,
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      await page.goto('https://silverin.ir/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Try multiple possible selectors
      const selectors = [
        'section:nth-of-type(7) div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > div > div:nth-of-type(6) bdi',
        '.price',
        '[class*="price"]',
        'bdi',
        'span[class*="price"]',
        'div[class*="price"]'
      ];

      let priceText = '';
      let foundSelector = '';

      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          priceText = await page.$eval(selector, (el) => (el.textContent || '').trim());
          if (priceText && priceText.length > 0) {
            foundSelector = selector;
            break;
          }
        } catch (e) {
          // Continue to next selector
          continue;
        }
      }

      if (!priceText) {
        // Fallback: Try to find any numeric content on the page
        const pageContent = await page.content();
        const $ = cheerio.load(pageContent);

        // Look for common price patterns
        const priceElements = $('body').find('*:contains("تومان")');
        for (let i = 0; i < priceElements.length; i++) {
          const text = $(priceElements[i]).text().trim();
          if (text.match(/[\d,]+/)) {
            priceText = text;
            break;
          }
        }
      }

      if (!priceText) {
        return 'silverin.ir: ❌ قیمت یافت نشد';
      }

      // Remove non-digits and convert Persian digits to English digits
      const persianToEnglishDigits = (str: string) =>
        str.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

      const cleanedPrice = persianToEnglishDigits(priceText).replace(/[^\d]/g, '');

      if (!cleanedPrice) {
        return 'silverin.ir: ❌ قیمت نامعتبر';
      }

      const price = parseInt(cleanedPrice, 10);

      if (isNaN(price)) {
        return 'silverin.ir: ❌ قیمت نامعتبر';
      }

      // Adjust division factor based on typical silver prices
      const dividedPrice = Math.floor(price / (price > 100000 ? 10 : 1)).toLocaleString();

      return `silverin.ir: ${dividedPrice}`;

    } catch (err) {
      console.error('❌ Error fetching Silverin price:', err);
      return 'silverin.ir: خطا در دریافت قیمت';
    } finally {
      if (browser) {
        await browser.close();
      }
    }
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
          '--disable-features=VizDisplayCompositor',
          '--disable-software-rasterizer',
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
        return 'noghresea.ir: ❌ قیمت یافت نشد';
      }

      const numericPrice = cleaned.replace(/,/g, '');

      if (!numericPrice || isNaN(parseInt(numericPrice, 10))) {
        return 'noghresea.ir: ❌ قیمت نامعتبر';
      }

      return `noghresea.ir: ${cleaned}`;
    } catch (err) {
      console.error('❌ Error fetching NoghreGea price:', err);
      return 'noghresea.ir: خطا در دریافت قیمت';
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
          '--disable-features=VizDisplayCompositor',
          '--disable-software-rasterizer',
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
        return 'tajnoghreh.com: ❌ قیمت یافت نشد';
      }

      const numericPrice = cleaned.replace(/,/g, '');

      if (!numericPrice || isNaN(parseInt(numericPrice, 10))) {
        return 'tajnoghreh.com: ❌ قیمت نامعتبر';
      }

      return `tajnoghreh.com: ${cleaned}`;
    } catch (err) {
      console.error('❌ Error fetching TajNoghre price:', err);
      return 'tajnoghreh.com: خطا در دریافت قیمت';
    }
  }

  // 🔸 Site 8 - kitco.com
async getPriceFromKitco(): Promise<string> {
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Try going directly to the silver price page
    await page.goto('https://www.kitco.com/charts/livesilver.html', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Look for price in various elements
    await page.waitForTimeout(5000);
    
    // Try to find price in the page
    const pricePattern = /\$\d+\.\d+/;
    const pageText = await page.evaluate(() => document.body.textContent);
    const priceMatch = pageText.match(pricePattern);
    
    if (priceMatch) {
      const price = priceMatch[0].replace('$', '');
      return `kitco.com $ : ${price}`;
    }
    
    throw new Error('Silver price not found');
    
  } catch (err) {
    console.error('Error:', err);
    return 'kitco.com : خطا در دریافت';
  } finally {
    if (browser) await browser.close();
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
        '--disable-features=VizDisplayCompositor',
        '--disable-software-rasterizer',
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
    return `tokeniko.com silver bars : \n${prices.join('\n')}`;
  }

  // 🔸 Site 2 - parsisgold.com silver bars
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
        '--disable-features=VizDisplayCompositor',
        '--disable-software-rasterizer',
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
        return 'parsisgold.com silver bar :  قیمت یافت نشد';
      }

      // Convert Persian/Arabic digits to English digits
      const englishDigits = this.toEnglishDigits(cleaned);

      // Remove commas before converting to number
      const numericPrice = parseInt(englishDigits.replace(/,/g, ''), 10);

      if (isNaN(numericPrice)) {
        return 'parsisgold.com silver bar :  قیمت یافت نشد';
      }

      // Format the number with commas
      const formattedPrice = this.formatNumber(numericPrice);

      return `parsisgold.com silver bar : ${formattedPrice}`;
    } catch (err) {
      console.error('Parsis scrape error:', err);
      return 'parsisgold.com silver bar : خطا در دریافت';
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
        '--disable-features=VizDisplayCompositor',
        '--disable-software-rasterizer',
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

      return `zioto.gold silver bars:\n\n${results.join('\n')}`;
    } catch (err) {
      console.error('Zioto scrape error:', err);
      return 'zioto.gold: خطا در دریافت';
    } finally {
      await browser.close();
    }
  }

  // //output all prices
  async getAllSilverPrices(): Promise<string> {
    const priceMethods = [
      // () => this.getPriceFromShirazSilver(),
      () => this.getPriceFromSarzaminShems(),
      () => this.getPriceFromNoghra(),
      () => this.getPriceFromTokeniko(),
      () => this.getPriceFromSilverin(),
      () => this.getPriceFromNoghresea(),
      () => this.getSilverPriceFromTajNoghre(),
      () => this.getSilverBarPriceFromTokeniko(),
      () => this.getSilverBarPriceFromParsis(),
      () => this.getZiotoSilverBars(),
      // () => this.getPriceFromKitco(),
    ];

    // Execute each method with individual error handling
    const pricePromises = priceMethods.map(async (method) => {
      try {
        return await method();
      } catch (error) {
        console.error(`Error in price method:`, error.message);
        return ` خطا در دریافت قیمت`;
      }
    });

    const prices = await Promise.all(pricePromises);
    prices.push(this.getIranTime());

    // Add double newline between each item for spacing
    return ` قیمت لحظه‌ای نقره: (تومن) \n\n${prices.join('\n\n')}`;
  }
}
