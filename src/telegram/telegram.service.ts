import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoldService } from './gold.service';
import { SilverService } from './silver.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Price, PriceDocument } from './schemas/prices.schema';
import TelegramBot from 'node-telegram-bot-api';
import { UsdToIrrService } from './usdToIrr.service';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: TelegramBot;
  private groupChatId: string;
  private autoPriceInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly goldService: GoldService,
    private readonly silverService: SilverService,
    private readonly usdToIrrService: UsdToIrrService,
    @InjectModel(Price.name) private readonly priceModel: Model<PriceDocument>,
  ) {}

  async onModuleInit() {
    const token = this.configService.get<string>('BOT_TOKEN');
    if (!token) throw new Error('❌ BOT_TOKEN not found in .env');

    this.bot = new TelegramBot(token, { polling: true });
    this.groupChatId = this.configService.get<string>('GROUP_CHAT_ID') || '';

    this.initMenu();
    this.initAutoPriceSender();

    console.log('🤖 Telegram bot initialized successfully');
  }

  onModuleDestroy() {
    if (this.autoPriceInterval) clearInterval(this.autoPriceInterval);
    if (this.bot) this.bot.stopPolling();
    console.log('🛑 Telegram bot stopped');
  }

  private initMenu() {
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, 'سلام! به ربات سوپرانو خوش آمدید:', {
        reply_markup: {
          keyboard: [['💰 قیمت لحظه‌ای طلا', '⚪️ قیمت لحظه‌ای نقره']],
          resize_keyboard: true,
        },
      });
    });

    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text?.trim();

      try {
        if (text === '💰 قیمت لحظه‌ای طلا') {
          await this.sendGoldPrice(chatId);
        } else if (text === '⚪️ قیمت لحظه‌ای نقره') {
          await this.sendSilverPrice(chatId);
        }
      } catch (error) {
        console.error(' Error handling message:', error);
        this.bot.sendMessage(chatId, 'خطایی رخ داد، لطفاً دوباره تلاش کنید.');
      }
    });
  }

  async getPreviousSilverFromDB(): Promise<PriceDocument | null> {
    try {
      const previous = await this.priceModel
        .find({ productMaterial: 'silver' })
        .sort({ createdAt: -1 }) // newest → oldest
        .skip(1) // skip newest, get the one before it
        .limit(1)
        .exec();

      return previous[0] || null;
    } catch (error) {
      console.error('❌ Error fetching previous silver from DB:', error);
      return null;
    }
  }

  async getNewestSilverFromDB(): Promise<PriceDocument | null> {
    try {
      const newest = await this.priceModel
        .findOne({ productMaterial: 'silver' })
        .sort({ createdAt: -1 }) // newest first
        .exec();

      return newest;
    } catch (error) {
      console.error('❌ Error fetching NEWEST gold from DB:', error);
      return null;
    }
  }

  async getPreviousGoldFromDB(): Promise<PriceDocument | null> {
    try {
      const previous = await this.priceModel
        .find({ productMaterial: 'gold' })
        .sort({ createdAt: -1 }) // newest → oldest
        .skip(1) // skip newest, get the one before it
        .limit(1)
        .exec();

      return previous[0] || null;
    } catch (error) {
      console.error('❌ Error fetching previous gold from DB:', error);
      return null;
    }
  }

  async getNewestGoldFromDB(): Promise<PriceDocument | null> {
    try {
      const newest = await this.priceModel
        .findOne({ productMaterial: 'gold' })
        .sort({ createdAt: -1 }) // newest first
        .exec();

      return newest;
    } catch (error) {
      console.error('❌ Error fetching NEWEST gold from DB:', error);
      return null;
    }
  }

  private async sendGoldPrice(chatId: number | string) {
    await this.bot.sendMessage(chatId, '⏳ در حال دریافت قیمت طلا...');
    const prices = await this.goldService.getAllGoldPrices();
    await this.bot.sendMessage(chatId, prices);
  }

  private async sendSilverPrice(chatId: number | string) {
    await this.bot.sendMessage(chatId, '⏳ در حال دریافت قیمت نقره...');
    const prices = await this.silverService.getAllSilverPrices();
    await this.bot.sendMessage(chatId, prices);
  }

  private repairPrices(
    newest: Record<string, number>,
    newestDB?: Record<string, number>,
    previousDB?: Record<string, number>,
  ): Record<string, number> {
    const final: Record<string, number> = { ...newest };

    const fallbackSource = newestDB ?? previousDB ?? {};

    for (const key of Object.keys(final)) {
      const v = final[key];

      const isBad = v === undefined || v === null || v === 0 || Number.isNaN(v);

      if (
        isBad &&
        typeof fallbackSource[key] === 'number' &&
        fallbackSource[key] > 0
      ) {
        final[key] = fallbackSource[key];
      }
    }

    return final;
  }

  private initAutoPriceSender() {
    if (!this.groupChatId) {
      console.warn('⚠️ GROUP_CHAT_ID not set in .env — auto sender disabled');
      return;
    }

    console.log('🚀 Auto price sender started (every 30 minutes)');

    // Send once after startup (wait 10s for bot readiness)
    setTimeout(() => {
      this.sendCombinedPrices();
    }, 10_000);

    // Schedule every 30 minutes
    this.autoPriceInterval = setInterval(
      () => {
        this.sendCombinedPrices();
      },
      30 * 60 * 1000,
    ); // 30 minutes
  }

  private parsePrice(price: any): number | null {
    if (price == null) return null;
    if (typeof price === 'number') return price;
    if (typeof price === 'object') {
      // try to pick a numeric value from object fields
      const vals = Object.values(price).flat
        ? Object.values(price).flat()
        : Object.values(price);
      for (const v of vals) {
        const n = this.parsePrice(v);
        if (n != null) return n;
      }
      return null;
    }
    let s = String(price);
    // replace Persian digits with Latin digits
    const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    for (let i = 0; i < 10; i++)
      s = s.replace(new RegExp(persian[i], 'g'), String(i));
    const matches = s.match(/[\d,\.]+/g);
    if (!matches) return null;
    const last = matches[matches.length - 1].replace(/,/g, '');
    const num = parseFloat(last);
    return Number.isNaN(num) ? null : num;
  }

  private toEnglishDigits(s: string): string {
    if (!s) return s;
    const persian = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    const arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let out = String(s);
    for (let i = 0; i < 10; i++) {
      out = out.replace(new RegExp(persian[i], 'g'), String(i));
      out = out.replace(new RegExp(arabic[i], 'g'), String(i));
    }
    // normalize Persian comma and non-breaking spaces
    out = out.replace(/٬|،|\u00A0/g, ',');
    return out;
  }

  private safeParsePrices(text: string) {
    try {
      const parsed = this.parseSitePrices(String(text));
      return {
        prices: parsed?.prices || {},
        dollarPrices: parsed?.dollarPrices || {},
        weightPrices: parsed?.weightPrices || [],
      };
    } catch (err) {
      console.error('❌ Parsing error:', err.message);
      return {
        prices: {},
        dollarPrices: {},
        weightPrices: [],
      };
    }
  }
  //  * Parse a human-readable multi-line price string returned by services
  // into structured sitePrices, weightPrices and dollarPrices.
  private parseSitePrices(text: string): {
    prices: Record<string, number>;
    weightPrices: {
      site: string;
      weights: { weight: string; price: number; available: boolean }[];
    }[];
    dollarPrices: { kitcoGold?: number; kitcoSilver?: number };
  } {
    const prices: Record<string, number> = {};
    const weightMap: Record<
      string,
      { weight: string; price: number; available: boolean }[]
    > = {};

    const dollarPrices: { kitcoGold?: number; kitcoSilver?: number } = {};

    if (!text || typeof text !== 'string') {
      return { prices, weightPrices: [], dollarPrices };
    }

    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    let currentSiteForWeights: string | null = null;
    let lastWeightSite: string | null = null;

    for (const raw of lines) {
      const line = this.toEnglishDigits(raw);

      // KITCO (USD) PRICE LINES
      const kitcoGoldMatch = line.match(
        /kitco[^:\$\d]*\$?\s*[:：]?\s*([0-9\.,]+)/i,
      );
      if (kitcoGoldMatch) {
        const rawVal = kitcoGoldMatch[1].replace(/,/g, '');
        const val = parseFloat(rawVal);

        if (/silver/i.test(line)) {
          dollarPrices.kitcoSilver = Number.isNaN(val) ? 0 : val;
        } else {
          dollarPrices.kitcoGold = Number.isNaN(val) ? 0 : val;
        }
        continue;
      }

      // ERROR LINES
      if (/خطا در دریافت|error/i.test(line)) {
        if (currentSiteForWeights && lastWeightSite) {
          if (!weightMap[lastWeightSite]) weightMap[lastWeightSite] = [];
        } else if (currentSiteForWeights) {
          prices[currentSiteForWeights] = 0;
        }
        continue;
      }

      //WEIGHT SITE HEADER
      const siteHeaderMatch = line.match(
        /^[🔸⚪️🟡]?\s*([a-zA-Z0-9_.\-]+)(?:\s+silver\s+bars|\s+silver\s+bar)?\s*[:：]?$/i,
      );
      if (siteHeaderMatch) {
        const siteName = siteHeaderMatch[1]
          .replace(/\./g, '_')
          .replace(/\s+/g, '_')
          .toLowerCase();

        currentSiteForWeights = siteName;
        lastWeightSite = siteName;

        if (!weightMap[siteName]) weightMap[siteName] = [];

        continue;
      }

      // WEIGHT LINES
      const weightLineMatch = line.match(
        /^([0-9]+\s*(g|gram|grams|oz|ounce|ounces))\s*[:：]?\s*([0-9,\.]+)\b/i,
      );

      if (weightLineMatch && currentSiteForWeights) {
        const weightLabel = weightLineMatch[1];
        const num = parseFloat(weightLineMatch[3].replace(/,/g, ''));

        weightMap[currentSiteForWeights].push({
          weight: weightLabel,
          price: Number.isNaN(num) ? 0 : num,
          available: !Number.isNaN(num),
        });

        continue;
      }

      // FIXED GENERAL PRICE LINE (YOUR REQUESTED CODE HERE)
      const fixedSiteMatch = line.match(
        /^([a-zA-Z0-9_.\-]+)(?:\s*\([^)]*\))?(?:\s+silver\s+bar|\s+silver\s+bars)?\s*[:：–—\-]?\s*([0-9,\.]+)\b/i,
      );

      if (fixedSiteMatch) {
        let siteRaw = fixedSiteMatch[1]
          .replace(/\./g, '_')
          .replace(/\s+/g, '_')
          .toLowerCase();

        const num = parseFloat(fixedSiteMatch[2].replace(/,/g, ''));

        prices[siteRaw] = Number.isNaN(num) ? 0 : num;

        currentSiteForWeights = null;
        continue;
      }
    }

    //FINAL STRUCTURED OUTPUT
    const weightPrices = Object.keys(weightMap).map((site) => ({
      site,
      weights: weightMap[site],
    }));

    return { prices, weightPrices, dollarPrices };
  }

  private async sendCombinedPrices() {
    try {
      console.log('🔄 Fetching combined prices...');

      // 1️⃣ Fetch Gold + Silver + Dollar
      const [goldPriceText, silverPriceText, dollarValue] = await Promise.all([
        this.goldService.getAllGoldPrices(),
        this.silverService.getAllSilverPrices(),
        this.usdToIrrService.getTomanPerDollar(), // returns number like 117550
      ]);

      // Format dollar value for display (or skip if you don't want to show it)
      const dollarDisplayText = `💰 قیمت دلار: ${dollarValue?.toLocaleString() || 'نامعلوم'} تومان`;

      // Send TEXT message to Telegram (WITHOUT dollar price if you don't want it)
      const message = `\n\n${goldPriceText}\n\n${silverPriceText}`;
      // If you want to include dollar price, use this instead:
      // const message = `\n\n${goldPriceText}\n\n${silverPriceText}\n\n${dollarDisplayText}`;

      await this.bot.sendMessage(this.groupChatId, message, {
        parse_mode: 'HTML',
      });

      console.log('✅ Prices sent successfully');

      // SAVE all THREE documents into DB
      try {
        // PARSE GOLD & SILVER blocks into structured objects
        const goldParsed = this.safeParsePrices(goldPriceText);
        const silverParsed = this.safeParsePrices(silverPriceText);

        // Use the dollarValue directly (it's already a number)
        const dollarValueToSave = dollarValue || 0;

        const ensureDollarDefaults = (dp: any) => ({
          kitcoGold: Number(dp?.kitcoGold) || 0,
          kitcoSilver: Number(dp?.kitcoSilver) || 0,
        });

        // GOLD DOC
        const goldDoc = new this.priceModel({
          productMaterial: 'gold',
          productType: 'ball',
          prices: goldParsed.prices,
          dollarPrices: ensureDollarDefaults(goldParsed.dollarPrices),
        });

        // SILVER DOC
        const silverDoc = new this.priceModel({
          productMaterial: 'silver',
          productType: silverParsed.weightPrices.length > 0 ? 'bar' : 'ball',
          prices: silverParsed.prices,
          weightPrices: silverParsed.weightPrices,
          dollarPrices: ensureDollarDefaults(silverParsed.dollarPrices),
        });

        // DOLLAR DOC
        const dollarDoc = new this.priceModel({
          productMaterial: 'dollar',
          productType: 'usd',
          prices: {},
          weightPrices: [],
          dollarPrices: {},
          tomanPerDollar: dollarValueToSave,
        });

        // SAVE THEM
        await Promise.allSettled([
          goldDoc
            .save()
            .catch((e) =>
              console.error('❌ Failed to save gold snapshot:', e.message),
            ),
          silverDoc
            .save()
            .catch((e) =>
              console.error('❌ Failed to save silver snapshot:', e.message),
            ),
          dollarDoc
            .save()
            .catch((e) =>
              console.error('❌ Failed to save dollar snapshot:', e.message),
            ),
        ]);

        console.log('💾 All snapshots saved to MongoDB');
      } catch (innerError) {
        console.error('❌ Internal parse/save failure:', innerError);
      }
    } catch (error) {
      console.error('❌ Error sending combined prices:', error);
    }
  }
}
