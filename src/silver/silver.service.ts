import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer, { Browser, Page } from 'puppeteer';
import moment from 'moment-timezone';
import * as jalaali from 'jalaali-js';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SilverRo } from './dto/silver.ro';
import { plainToInstance } from 'class-transformer';
import { Silver, SilverDocument } from './schema/silver.schema';
import { UsdToIrrService } from 'src/usdToIrr/usdToIrr.service';
import { SilverDto } from './dto/silver.dto';
@Injectable()
export class SilverService {
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
    private readonly usdToIrrService: UsdToIrrService,
    @InjectModel(Silver.name)
    private readonly silverModel: Model<SilverDocument>,
  ) {}

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

  private async safeCloseBrowser(browser: Browser | null): Promise<void> {
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        console.error('Error closing browser:', err);
      }
    }
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

  private persianToEnglish(str: string): string {
    return str.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  }

  //balls

  // 🔸 Site 1 - shirazsilver.com
  // async getPriceFromShirazSilver() {
  //   let browser: Browser | null = null;
  //   try {
  //     browser = await puppeteer.launch(this.browserConfig);
  //     const page = await browser.newPage();
  //     await page.setUserAgent(
  //       'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  //     );

  //     await page.goto('https://shirazsilver.com/', {
  //       waitUntil: 'networkidle2',
  //       timeout: 30000,
  //     });

  //     const selectors = [
  //       'span.text-\\[20px\\]',
  //       'p span',
  //       '[class*="text-"] span',
  //       'main span',
  //     ];

  //     let priceText = '';
  //     for (const selector of selectors) {
  //       try {
  //         await page.waitForSelector(selector, { timeout: 5000 });
  //         priceText = await page.$eval(
  //           selector,
  //           (el) => el.textContent?.trim() || '',
  //         );
  //         if (priceText && priceText.match(/[\d٬]/)) {
  //           break;
  //         }
  //       } catch (e) {
  //         continue;
  //       }
  //     }

  //     if (!priceText) {
  //       return 'shirazsilver.com: ❌ قیمت یافت نشد';
  //     }

  //     const cleanedPrice = this.persianToEnglish(priceText).replace(
  //       /[^\d]/g,
  //       '',
  //     );

  //     if (!cleanedPrice) {
  //       return 'shirazsilver.com: ❌ قیمت نامعتبر';
  //     }

  //     const price = parseInt(cleanedPrice, 10);

  //     if (isNaN(price)) {
  //       return 'shirazsilver.com: ❌ قیمت نامعتبر';
  //     }

  //     const dividedPrice = Math.floor(price / 10).toLocaleString('en-US');
  //     return `shirazsilver.com: ${dividedPrice}`;
  //   } catch (error) {
  //     console.error('❌ Error fetching ShirazSilver price:', error);
  //     return 'shirazsilver.com: خطا در دریافت قیمت';
  //   } finally {
  //     await this.safeCloseBrowser(browser);
  //   }
  // }

  // 🔸 Site 2 - sarzamineshemsh.ir (karat995)
  // async getPriceFromSarzaminShems(): Promise<{ site: string; price: [number] }> {
  //   let browser: Browser | null = null;

  //   try {
  //     browser = await puppeteer.launch(this.browserConfig);
  //     const page = await browser.newPage();

  //     await page.goto('https://sarzamineshemsh.ir/product-86', {
  //       waitUntil: 'networkidle2',
  //       timeout: 30000,
  //     });

  //     await page.waitForSelector('h5 span.ng-binding', { timeout: 10000 });

  //     const text = await page.$eval(
  //       'h5 span.ng-binding',
  //       (el) => el.textContent?.trim() || '',
  //     );

  //     const cleaned = text.replace(/[^\d]/g, '');
  //     const price = cleaned ? Math.floor(Number(cleaned) / 100) : null;

  //     return {
  //       site: 'sarzamineshemsh.ir',
  //       price: [price && !isNaN(price) ? price : 0],
  //     };
  //   } catch (error) {
  //     console.error('Error fetching SarzaminShems price:', error);
  //     return { site: 'sarzamineshemsh', price: [0] };
  //   } finally {
  //     await this.safeCloseBrowser(browser);
  //   }
  // }

  // 🔸 Site 3 - tajnoghreh.com (karat995)
  // async getSilverPriceFromTajNoghre(): Promise<{ site: string; price: [number] }> {
  //   let browser: Browser | null = null;
  //   try {
  //     browser = await puppeteer.launch(this.browserConfig);
  //     const page = await browser.newPage();

  //     await page.setUserAgent(
  //       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  //     );

  //     await page.goto('https://tajnoghreh.com/silver-price/', {
  //       waitUntil: 'networkidle2',
  //       timeout: 30000,
  //     });

  //     await new Promise((resolve) => setTimeout(resolve, 3000));

  //     const priceText = await page.evaluate(() => {
  //       const el = document.querySelector(
  //         'td.sheyda_hamarz_table_content-price',
  //       );
  //       if (!el) return '';
  //       return el.childNodes[0]?.textContent?.trim() || '';
  //     });

  //     const cleaned = priceText.replace(/[^0-9]/g, '');

  //     let price;

  //     if (cleaned) {
  //       const numericPrice = parseInt(cleaned, 10);
  //       if (!isNaN(numericPrice)) {
  //         price = numericPrice;
  //       }
  //     }
  //     return {
  //       site: 'tajnoghreh',
  //       price: [price],
  //     };
  //   } catch (err) {
  //     console.error('❌ Error fetching TajNoghre price:', err);
  //     return {
  //       site: 'tajnoghreh.com',
  //       price: [0],
  //     };
  //   } finally {
  //     await this.safeCloseBrowser(browser);
  //   }
  // }

  // 🔸 Site 4 - noghra.com
  async getPriceFromNoghra(): Promise<{ site: string; price: [number] }> {
    try {
      const { data } = await axios.get('https://noghra.com/silver-price/', {
        timeout: 60000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      const $ = cheerio.load(data);

      const text = $('table tbody tr:nth-child(1) td p span strong span')
        .eq(1)
        .text()
        .trim();

      // Check if text is empty and throw error
      if (!text || text.length === 0) {
        throw new Error('noghra price element empty');
      }

      const cleaned = this.toEnglishDigits(text).replace(/[^\d]/g, '');
      const price = cleaned ? Number(cleaned) : null;
      console.log('silver noghra', {
        site: 'noghra',
        price: [price && !isNaN(price) ? price : 0],
      });
      return {
        site: 'noghra',
        price: [price && !isNaN(price) ? price : 0],
      };
    } catch (error) {
      console.error('Error fetching Noghra price:', error);
      // Log the specific error message
      if (error.message === 'noghra price element empty') {
        console.error('Internal error:', error);
      }
      return { site: 'noghra', price: [0] };
    }
  }

  // 🔸 Site 5 - tokeniko.com
  async getPriceFromTokeniko(): Promise<{ site: string; price: [number] }> {
    try {
      const { data } = await axios.get(
        'https://tokeniko.com/products/silver-grain-1ounce-fine',
        {
          timeout: 20000, // Reduced from 45000ms to 20s for faster failure
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml',
          },
        },
      );

      const $ = cheerio.load(data);

      const text = $('span.text-primary-purple-tint.font-bold.text-base')
        .first()
        .text()
        .trim();

      if (text === '') {
        try {
          throw new Error('Tokeniko price element empty');
        } catch (error) {
          console.error('Internal error:', error);
        }

        return {
          site: 'tokeniko',
          price: [0],
        };
      }

      const cleaned = this.toEnglishDigits(text).replace(/[^\d]/g, '');
      const totalPrice = Number(cleaned);

      const perGram = Math.floor(totalPrice / 31.1035);
      console.log('silver tokeniko', {
        site: 'tokeniko',
        price: [!isNaN(perGram) ? perGram : 0],
      });
      return {
        site: 'tokeniko',
        price: [!isNaN(perGram) ? perGram : 0],
      };
    } catch (error) {
      // More specific error logging
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('❌ Tokeniko: Request timeout (site not responding)');
      } else {
        console.error('Error fetching Tokeniko price:', error);
      }
      return { site: 'tokeniko', price: [0] };
    }
  }

  // 🔸 Site 6 - silverin.ir
  async getPriceFromSilverin(): Promise<{ site: string; price: [number] }> {
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      browser = await puppeteer.launch(this.browserConfig);
      page = await browser.newPage();

      // Block unnecessary resources to speed up page loading
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        // Only allow document, script, and xhr requests (needed for dynamic content)
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      await page.goto('https://silverin.ir/product/ساچمه-نقره-10-گرمی-999/', {
        waitUntil: 'domcontentloaded',
        timeout: 15000, // Reduced from 30000ms to 15s for faster failure
      });

      // ✅ wait until WooCommerce price is filled
      await page.waitForFunction(
        () => {
          const el = document.querySelector('p.price bdi');
          return el && el.textContent && el.textContent.trim().length > 0;
        },
        { timeout: 5000 }, // Reduced from 10000ms to 5s
      );

      const text = await page.evaluate(() => {
        const el = document.querySelector('p.price bdi');
        return el?.textContent?.trim() || '';
      });

      if (text === '') {
        try {
          throw new Error('silverin price element empty');
        } catch (error) {
          console.error('Internal error:', error);
        }

        return {
          site: 'tokeniko',
          price: [0],
        };
      }

      const cleaned = this.persianToEnglish(text).replace(/[^\d]/g, '');
      if (!cleaned) return { site: 'silverin', price: [0] };

      const totalPrice = Number(cleaned); // price for 10g
      const perGram = Math.floor(totalPrice / 10);
      console.log('silver silverin : ', {
        site: 'silverin',
        price: [perGram],
      });
      return {
        site: 'silverin',
        price: [perGram],
      };
    } catch (error) {
      // More specific error logging
      if (error.name === 'TimeoutError') {
        if (error.message.includes('Navigation timeout')) {
          console.error(
            '❌ Silverin: Page navigation timeout (page not loading)',
          );
        } else {
          console.error(
            '❌ Silverin: Element wait timeout (element not found)',
          );
        }
      } else {
        console.error('Error fetching Silverin price:', error);
      }
      return { site: 'silverin', price: [0] };
    } finally {
      await this.safeClosePage(page);
      await this.safeCloseBrowser(browser);
    }
  }

  // 🔸 Site 7 - noghresea.ir
  async getPriceFromNoghresea(): Promise<{ site: string; price: [number] }> {
    let browser: Browser | null = null;

    try {
      browser = await puppeteer.launch(this.browserConfig);
      const page = await browser.newPage();

      // Block unnecessary resources to speed up page loading
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        // Only allow document, script, and xhr requests (needed for dynamic content)
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      // Use domcontentloaded instead of networkidle2 for much faster loading
      // networkidle2 waits for no network activity, which can take very long
      await page.goto('https://noghresea.ir/', {
        waitUntil: 'domcontentloaded',
        timeout: 20000, // Reduced from 60000ms to 20s
      });

      // کمی صبر برای اجرای JS (reduced from 3000ms to 2000ms)
      await new Promise((r) => setTimeout(r, 2000));

      const data = await page.evaluate(async () => {
        const res = await fetch(
          'https://api.noghresea.ir/api/market/getSilverPrice',
        );
        return res.json();
      });

      const rawPrice = Number(data?.price); // "368.28"
      const finalPrice = Number.isFinite(rawPrice)
        ? Math.round(rawPrice * 1000)
        : 0;

      console.log('silver noghresea:', {
        site: 'noghresea',
        price: [finalPrice],
      });

      return {
        site: 'noghresea',
        price: [finalPrice],
      };
    } catch (error) {
      // More specific error logging
      if (error.name === 'TimeoutError') {
        if (error.message.includes('Navigation timeout')) {
          console.error(
            '❌ Noghresea: Page navigation timeout (page not loading)',
          );
        } else {
          console.error('❌ Noghresea: Element/API timeout');
        }
      } else {
        console.error('❌ Error fetching Noghresea price:', error);
      }
      return { site: 'noghresea', price: [0] };
    } finally {
      await this.safeCloseBrowser(browser);
    }
  }

  // 🔸 Site 8 - kitco.com
  async getPriceFromKitco(): Promise<{ site: string; price: [number] }> {
    try {
      const url = 'https://www.kitco.com/api/kitco-xml/precious-metals';

      const response = await axios.get(url, {
        timeout: 20000,
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.data || !response.data.data) {
        throw new Error('Invalid response from Kitco');
      }

      const metals = response.data.data;

      // Find the object where commodity === "Silver"
      const silver = metals.find((m: any) => m.commodity === 'Silver');

      if (!silver || !silver.lastBid || !silver.lastBid.bidVal) {
        throw new Error('Silver price not found in API');
      }

      const price = parseFloat(silver.lastBid.bidVal);

      if (isNaN(price)) {
        throw new Error('Invalid price value from API');
      }
      console.log('silver kitco : ', {
        site: 'kitco.com',
        price: [price],
      });

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

  //bars

  // 🔸 Site 1 - tokeniko.com silver bars
  async getTokenikoSilverBars(): Promise<{
    site: string;
    weight: [number];
    price: [number];
  }> {
    let browser: Browser | null = null;

    try {
      browser = await puppeteer.launch(this.browserConfig);
      const page = await browser.newPage();

      await page.goto('https://tokeniko.com/products/silver-bar', {
        waitUntil: 'networkidle2',
      });

      const bars = [
        {
          label: '10',
          xpath:
            '/html/body/div[3]/div/main/section[1]/div[2]/a[1]/div/div[1]/p',
        },
        {
          label: '20',
          xpath:
            '/html/body/div[3]/div/main/section[1]/div[2]/a[2]/div/div[1]/p',
        },
        {
          label: '28.3495',
          xpath:
            '/html/body/div[3]/div/main/section[1]/div[2]/a[3]/div/div[1]/p',
        },
        {
          label: '50',
          xpath:
            '/html/body/div[3]/div/main/section[1]/div[2]/a[4]/div/div[1]/p',
        },
        {
          label: '100',
          xpath:
            '/html/body/div[3]/div/main/section[1]/div[2]/a[5]/div/div[1]/p',
        },
        {
          label: '250',
          xpath:
            '/html/body/div[3]/div/main/section[1]/div[2]/a[6]/div/div[1]/p',
        },
        {
          label: '500',
          xpath:
            '/html/body/div[3]/div/main/section[1]/div[2]/a[7]/div/div[1]/p',
        },
      ];

      let weight: [number] = [0];
      let price: [number] = [0];

      weight.pop();
      price.pop();
      for (const { label, xpath } of bars) {
        const text = await page.evaluate((xp) => {
          const el = document.evaluate(
            xp,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          ).singleNodeValue as HTMLElement | null;

          if (!el) return '';

          return (
            el.textContent?.replace('قیمت :', '').replace('تومان', '').trim() ||
            ''
          );
        }, xpath);

        const english = text.replace(/[۰-۹]/g, (d) =>
          String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)),
        );

        const numericPrice = Number(english.replace(/[^0-9]/g, ''));

        weight.push(Number(label));
        price.push(isNaN(numericPrice) ? 0 : numericPrice);
      }

      return {
        site: 'tokenikoBar',
        weight,
        price,
      };
    } finally {
      await this.safeCloseBrowser(browser);
    }
  }

  // 🔸 Site 2 - parsisgold.com silver bars
  async getParsisSilverBars(): Promise<{
    site: string;
    weight: [number];
    price: [number];
  }> {
    let browser: Browser | null = null;

    try {
      browser = await puppeteer.launch(this.browserConfig);
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      const url =
        'https://parsisgold.com/cats/2/%D8%B4%D9%85%D8%B4-%D9%86%D9%82%D8%B1%D9%87';
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      const xpath = '/html/body/form/div[5]/div/div/div/div/div[1]/p[2]/span';

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

      const priceText = await page.evaluate((xp) => {
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

      const cleaned = priceText.replace(/[^0-9۰-۹,٠-٩]/g, '');
      const english = this.toEnglishDigits(cleaned);
      const numericPrice = Number(english.replace(/,/g, ''));

      console.log('parsis bar : ', {
        site: 'parsis',
        weight: [1000],
        price: isNaN(numericPrice) ? [0] : [numericPrice],
      });

      return {
        site: 'parsis',
        weight: [1000],
        price: isNaN(numericPrice) ? [0] : [numericPrice],
      };
    } catch (err) {
      console.error('Parsis scrape error:', err);
      return {
        site: 'parsis',
        weight: [0],
        price: [0],
      };
    } finally {
      await this.safeCloseBrowser(browser);
    }
  }

  // 🔸 Site 3 - zioto silver bars
  async getZiotoSilverBars(): Promise<{
    site: string;
    weight: [number];
    price: [number];
  }> {
    let browser: Browser | null = null;

    try {
      browser = await puppeteer.launch(this.browserConfig);
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      const url =
        'https://zioto.gold/index.php?route=product/category&language=fa-ir&path=60';
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

      const xpaths = [
        '/html/body/div[6]/div/div[2]/div/div/div/div[2]/div[1]/div/div[2]/div[4]/div/span',
        '/html/body/div[6]/div/div[2]/div/div/div/div[2]/div[2]/div/div[2]/div[4]/div/span',
        '/html/body/div[6]/div/div[2]/div/div/div/div[2]/div[3]/div/div[2]/div[4]/div/span',
        '/html/body/div[6]/div/div[2]/div/div/div/div[2]/div[4]/div/div[2]/div[4]/div/span',
        '/html/body/div[6]/div/div[2]/div/div/div/div[2]/div[5]/div/div[2]/div[4]/div/span',
        '/html/body/div[6]/div/div[2]/div/div/div/div[2]/div[6]/div/div[2]/div[4]/div/span',
      ];

      const weights: [number] = [0];
      weights.push(28.3495, 50, 100, 250, 500, 1000);
      const prices: [number] = [0];
      prices.pop();

      for (let i = 0; i < xpaths.length; i++) {
        const xpath = xpaths[i];

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

        const priceText = await page.evaluate((xp) => {
          const node = document.evaluate(
            xp,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          ).singleNodeValue as HTMLElement | null;
          return node?.textContent?.trim() || '';
        }, xpath);

        const cleaned = this.toEnglishDigits(
          priceText.replace(/تومان/g, '').trim(),
        );
        const numericPrice = Number(cleaned.replace(/[^0-9]/g, ''));

        prices.push(isNaN(numericPrice) ? 0 : numericPrice);
      }
      console.log('zioto bar : ', {
        site: 'zioto',
        weight: weights,
        price: prices,
      });

      return {
        site: 'zioto',
        weight: weights,
        price: prices,
      };
    } catch (err) {
      console.error('Zioto scrape error:', err);
      return {
        site: 'zioto',
        weight: [0],
        price: [0],
      };
    } finally {
      await this.safeCloseBrowser(browser);
    }
  }

  async getPreviousSilverBallFromDB(): Promise<SilverDocument | null> {
    try {
      const previous = await this.silverModel
        .find({ productMaterial: 'silver', productType: 'ball999' })
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

  async getPreviousSilverBarFromDB(): Promise<SilverDocument | null> {
    try {
      const previous = await this.silverModel
        .find({ productMaterial: 'silver', productType: 'ball' })
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

    console.log('silver saved in db');

    return plainToInstance(SilverRo, silver, {
      excludeExtraneousValues: true,
    });
  }

  async createSilverBar(silverDto: SilverDto): Promise<SilverRo> {
    const silver = await this.silverModel.create(silverDto);

    console.log('silver saved in db');

    return plainToInstance(SilverRo, silver, {
      excludeExtraneousValues: true,
    });
  }

  // output 995 karat prices

  // async getAll995SilverPrices(): Promise<SilverRo> {
  //   const [sarzamineshemsh, tajnoghreh] = await Promise.all([
  //     this.getPriceFromSarzaminShems(),
  //     this.getSilverPriceFromTajNoghre(),
  //   ]);
  //   const prices = [sarzamineshemsh.price, tajnoghreh.price];
  //   const siteNames = [sarzamineshemsh.site, tajnoghreh.site];
  //   const tomanPerDollar = await this.usdToIrrService.getTomanPerDollar();

  //   const silverDto = {
  //     productType: 'ball995',
  //     siteNames: siteNames,
  //     prices: prices,
  //     globalSiteNames: [],
  //     globalPrices: [],
  //     weights: [[1], [1]],
  //     tomanPerDollar: tomanPerDollar,
  //   };

  //   const silver = await this.createSilver(silverDto);
  //   return silver;
  // }

  // output 999 karat prices
  async getAll999SilverPrices(): Promise<SilverRo> {
    const [noghra, tokeniko, silverin, noghresea, kitco] = await Promise.all([
      this.getPriceFromNoghra(),
      this.getPriceFromTokeniko(),
      this.getPriceFromSilverin(),
      this.getPriceFromNoghresea(),
      this.getPriceFromKitco(),
    ]);
    const tomanPerDollar = await this.usdToIrrService.getTomanPerDollar();
    const kitcoPrice = Number(kitco.price) || 0;
    const tomanGlobalPrice = Math.floor(
      (kitcoPrice * tomanPerDollar) / 28.3495,
    );

    const prices = [
      noghra.price,
      tokeniko.price,
      silverin.price,
      noghresea.price,
    ];

    const siteNames = [
      noghra.site,
      tokeniko.site,
      silverin.site,
      noghresea.site,
    ];

    let sum = 0;
    let count = 0;
    for (const priceArray of prices) {
      if (priceArray[0] != 0 && priceArray[0] != undefined) {
        sum += priceArray[0];
        count++;
      }
    }

    // Fix: Check if count is 0 to avoid NaN
    let average = 0;
    if (count > 0) {
      average = sum / count;
    } else {
      console.warn('⚠️ All silver prices are 0, cannot calculate average');
      // Optionally, you could skip saving or use a default value
      // For now, we'll set average to 0 and skip bubble calculation
    }

    const globalPrices = [kitco.price];
    const globalSiteNames = [kitco.site];

    // Fix: Only calculate bubble if average is valid (not NaN, not 0)
    let bubble = 0;
    if (average > 0 && !isNaN(average) && tomanGlobalPrice > 0) {
      bubble = ((average - tomanGlobalPrice) / average) * 100;
    } else {
      console.warn(
        '⚠️ Cannot calculate bubble: average or tomanGlobalPrice is invalid',
      );
    }

    // Fix: Validate values before saving to avoid MongoDB validation errors
    const finalAverage = isNaN(average) || !isFinite(average) ? 0 : average;
    const finalBubble = isNaN(bubble) || !isFinite(bubble) ? 0 : bubble;

    const silverDto = {
      productType: 'ball999',
      siteNames,
      prices,
      globalSiteNames,
      globalPrices,
      weights: [[1], [1], [1], [1], [1]],
      tomanPerDollar,
      average: finalAverage,
      tomanGlobalPrice,
      bubble: finalBubble,
    };

    const silver = await this.createSilverBall(silverDto);
    return silver;
  }

  // output silver bars prices
  async getAllSilverBarPrices(): Promise<SilverRo> {
    const [Tokeniko, Parsis, Zioto] = await Promise.all([
      this.getTokenikoSilverBars(),
      this.getParsisSilverBars(),
      this.getZiotoSilverBars(),
    ]);

    const prices = [Tokeniko.price, Parsis.price, Zioto.price];

    const siteNames = [Tokeniko.site, Parsis.site, Zioto.site];

    const weights = [Tokeniko.weight, Parsis.weight, Zioto.weight];

    const tomanPerDollar = await this.usdToIrrService.getTomanPerDollar();

    const silverDto = {
      productType: 'Bar',
      siteNames: siteNames,
      prices: prices,
      globalSiteNames: [],
      globalPrices: [],
      weights: weights,
      tomanPerDollar: tomanPerDollar,
    };

    const silver = await this.createSilverBar(silverDto);
    return silver;
  }
}
