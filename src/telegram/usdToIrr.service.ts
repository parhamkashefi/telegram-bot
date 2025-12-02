import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

@Injectable()
export class UsdToIrrService {
  private readonly logger = new Logger(UsdToIrrService.name);

  private readonly url = 'https://www.navasan.net/';
  private readonly selector =
    '#Ctable1 > div:nth-child(2) > table:nth-child(1) > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(2)';

  // Safe browser close helper
  private async safeCloseBrowser(browser: puppeteer.Browser | null) {
    try {
      if (browser) await browser.close();
    } catch (err) {
      this.logger.error('Error closing browser:', err);
    }
  }

  // Get Toman price per USD from Navasan
  // Returns a number (e.g., 116950)
  async getTomanPerDollar(): Promise<number | null> {
    let browser: puppeteer.Browser | null = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();

      await page.goto(this.url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Ensure page loaded
      await page.waitForSelector(this.selector, { timeout: 10000 });

      const priceText = await page.$eval(this.selector, (el) =>
        el.textContent?.trim(),
      );

      if (!priceText) {
        throw new Error('Price element found but is empty.');
      }

      // Remove commas -> convert to number
      const numeric = Number(priceText.replace(/,/g, ''));

      if (Number.isNaN(numeric) || numeric <= 0) {
        throw new Error('Invalid number extracted from Navasan.');
      }
      return numeric;
    } catch (err) {
      this.logger.error('❌ Error fetching Toman/USD price:', err);
      return null;
    } finally {
      await this.safeCloseBrowser(browser);
    }
  }

  // Optional: Retry wrapper (3 attempts)
  async getWithRetry(retry = 3): Promise<number | null> {
    for (let i = 1; i <= retry; i++) {
      const result = await this.getTomanPerDollar();
      if (result) return result;

      this.logger.warn(`Retry ${i}/${retry}...`);
    }
    return null;
  }
}
