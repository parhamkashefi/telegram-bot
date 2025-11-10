import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoldService } from './gold.service';
import { SilverService } from './silver.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Price, PriceDocument } from './schemas/prices.schema';
import TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: TelegramBot;
  private groupChatId: string;
  private autoPriceInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly goldService: GoldService,
    private readonly silverService: SilverService,
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
        console.error('❌ Error handling message:', error);
        this.bot.sendMessage(chatId, '⚠️ خطایی رخ داد، لطفاً دوباره تلاش کنید.');
      }
    });
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

  // 🔁 Auto-send prices every 30 minutes
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
    this.autoPriceInterval = setInterval(() => {
      this.sendCombinedPrices();
    }, 30 * 60 * 1000); // 30 minutes
  }

  private parsePrice(price: any): number | null {
    if (price == null) return null;
    if (typeof price === 'number') return price;
    if (typeof price === 'object') {
      // try to pick a numeric value from object fields
      const vals = Object.values(price).flat ? Object.values(price).flat() : Object.values(price);
      for (const v of vals) {
        const n = this.parsePrice(v);
        if (n != null) return n;
      }
      return null;
    }
    let s = String(price);
    // replace Persian digits with Latin digits
    const persian = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    for (let i = 0; i < 10; i++) s = s.replace(new RegExp(persian[i], 'g'), String(i));
    const matches = s.match(/[\d,\.]+/g);
    if (!matches) return null;
    const last = matches[matches.length - 1].replace(/,/g, '');
    const num = parseFloat(last);
    return Number.isNaN(num) ? null : num;
  }

  private async sendCombinedPrices() {
    try {
      console.log('🔄 Fetching combined prices...');

      const [goldPrice, silverPrice] = await Promise.all([
        this.goldService.getAllGoldPrices(),
        this.silverService.getAllSilverPrices(),
      ]);

      const message = `\n\n${goldPrice}\n\n${silverPrice}`;

      await this.bot.sendMessage(this.groupChatId, message, {
        parse_mode: 'HTML',
      });

      console.log('✅ Prices sent successfully');

      // Persist price snapshots to MongoDB (best-effort)
      try {
        const iranTime = new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });

        const goldValue = this.parsePrice(goldPrice);
        const silverValue = this.parsePrice(silverPrice);

        const goldDoc = new this.priceModel({
          productMaterial: 'gold',
          productType: 'ball', // gold uses 'ball' in your schema validator
          sitePrices: goldValue != null ? { combined: goldValue } : {},
          dollarPrices: {},
          fetchedAtIran: iranTime,
          fetchedAtUtc: new Date(),
        });

        const silverDoc = new this.priceModel({
          productMaterial: 'silver',
          productType: 'bar', // choose 'bar' for silver snapshot (either is allowed)
          sitePrices: silverValue != null ? { combined: silverValue } : {},
          dollarPrices: {},
          fetchedAtIran: iranTime,
          fetchedAtUtc: new Date(),
        });

        await Promise.all([goldDoc.save(), silverDoc.save()]);
        console.log('💾 Price snapshots saved to MongoDB');
      } catch (saveErr) {
        console.error('❌ Failed to save price snapshots:', saveErr && saveErr.message ? saveErr.message : saveErr);
      }
    } catch (error) {
      console.error('❌ Error sending combined prices:', error.message);
    }
  }
}

// ------------------------- Persisting helper (below class) -------------------------

