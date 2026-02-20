import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoldService } from '../gold/gold.service';
import { SilverService } from '../silver/silver.service';
import TelegramBot from 'node-telegram-bot-api';
import { SilverRo } from 'src/silver/dto/silver.ro';
import { GoldRo } from 'src/gold/dto/gold.ro';
const moment = require('moment-jalaali');
moment.loadPersian({ dialect: 'persian-modern' });

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private bot: TelegramBot;
  private groupChatId: string;
  private autoPriceInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly goldService: GoldService,
    private readonly silverService: SilverService,
  ) {}

  async onModuleInit() {
    const token = this.configService.get<string>('BOT_TOKEN');
    if (!token) throw new Error('❌ BOT_TOKEN not found in .env');

    this.bot = new TelegramBot(token, { polling: true });
    this.groupChatId = this.configService.get<string>('GROUP_CHAT_ID') || '';

    await this.bot.setMyCommands([
      {
        command: 'start',
        description: 'شروع ربات',
      },
    ]);

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
          keyboard: [
            ['قیمت لحظه‌ای طلا'],
            ['قیمت لحظه‌ای ساچمه نقره'],
            ['قیمت لحظه‌ای شمش نقره'],
          ],
          resize_keyboard: true,
        },
      });
    });

    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text?.trim();

      try {
        if (text === 'قیمت لحظه‌ای طلا') {
          await this.sendGoldPrice(chatId);
        } else if (text === 'قیمت لحظه‌ای شمش نقره') {
          await this.sendSilverBarPrice(chatId);
        } else if (text === 'قیمت لحظه‌ای ساچمه نقره') {
          await this.sendSilverBallPrice(chatId);
        }
      } catch (error) {
        console.error(' Error handling message:', error);
        this.bot.sendMessage(chatId, 'خطایی رخ داد، لطفاً دوباره تلاش کنید.');
      }
    });
  }

  private async sendGoldPrice(chatId: number | string) {
    await this.bot.sendMessage(chatId, '⏳ در حال دریافت قیمت طلا...');

    const goldPrices = await this.goldService.getAllGoldPrices();
    const goldSiteNames = [
      'estjt',
      'tablotala',
      'tabanGohar',
      'talaIr',
      'kitco',
    ];
    const goldMessage = await this.GoldTelegramMessage(
      goldPrices,
      goldSiteNames,
    );
    await this.bot.sendMessage(chatId, goldMessage);
  }

  private async sendSilverBarPrice(chatId: number | string) {
    await this.bot.sendMessage(chatId, '⏳ در حال دریافت قیمت شمش نقره...');
    const silverPrice = await this.silverService.getAllSilverBarPrices();
    const silverBarSiteNames = ['tokenikoBar', 'parsis', 'zioto', 'kitco'];
    const silverMessage = await this.SilverBarTelegramMessage(
      silverPrice,
      silverBarSiteNames,
    );
    await this.bot.sendMessage(chatId, silverMessage);
  }

  private async sendSilverBallPrice(chatId: number | string) {
    await this.bot.sendMessage(chatId, '⏳ در حال دریافت قیمت ساچمه نقره...');
    const silverPrice = await this.silverService.getAll999SilverPrices();
    const silverBallSiteNames = [
      'noghra',
      'tokeniko',
      'silverin',
      'noghresea',
      'kitco',
    ];
    const silverMessage = await this.SilverBarTelegramMessage(
      silverPrice,
      silverBallSiteNames,
    );
    await this.bot.sendMessage(chatId, silverMessage);
  }

  private initAutoPriceSender() {
    if (!this.groupChatId) {
      console.warn('⚠️ GROUP_CHAT_ID not set in .env — auto sender disabled');
      return;
    }

    console.log('🚀 Auto price sender started (every 30 minutes)');

    // Send once after startup (wait 10s for bot readiness)
    setTimeout(() => {
      this.sendCombinedPrices(this.groupChatId);
    }, 10_000);

    // Schedule every 30 minutes
    this.autoPriceInterval = setInterval(
      () => {
        this.sendCombinedPrices(this.groupChatId);
      },
      30 * 60 * 1000,
    ); // 30 minutes
  }

  private silverBallPersianName(site: string): string {
    const map: Record<string, string> = {
      sarzamineshemsh: 'سرزمین شمش',
      tajnoghreh: 'تاج نقره',
      noghra: 'نقرا',
      tokeniko: 'توکنیکو',
      silverin: 'سیلورین',
      noghresea: 'نقره سی',
      kitco: 'کیتکو',
    };

    return map[site] ?? site;
  }

  private silverBarPersianName(site: string): string {
    const map: Record<string, string> = {
      tokenikoBar: 'توکنیکو',
      parsis: 'پارسیس',
      zioto: 'زیوتو',
      kitco: 'کیتکو',
    };

    return map[site] ?? site;
  }

  private goldPersianName(site: string): string {
    const map: Record<string, string> = {
      estjt: 'اتحادیه',
      tablotala: 'تابلو طلا',
      tabanGohar: 'تابان گوهر',
      talaIr: 'طلا ایران',
      kitco: 'کیتکو',
    };

    return map[site] ?? site;
  }

  private toPersianNumber(value?: number | string): string {
    if (value === undefined || value === null) {
      return '۰';
    }

    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? Number(value) : value;

    // Check if it's a valid number
    if (isNaN(numValue)) {
      return '۰';
    }

    // Now safely call toLocaleString
    return numValue.toLocaleString('fa-IR');
  }

  async SilverBarTelegramMessage(
    silver: SilverRo,
    siteNames: string[],
  ): Promise<string> {
    let message = `📊 قیمت شمش نقره\n\n`;

    siteNames.forEach((site, i) => {
      message += `🌐 ${this.silverBarPersianName(site)}\n`;

      const prices = silver.prices?.[i] || [];
      const weights = silver.weights?.[i] || [];

      weights.forEach((weight, j) => {
        const price = prices[j];
        if (price == null || price === 0) return;

        message += `🔹 ${this.toPersianNumber(weight)} گرم : ${this.toPersianNumber(price)} تومان\n`;
      });

      message += '\n';
    });

    message += `🕒 آخرین بروزرسانی: ${moment(silver.createdAt).format('jYYYY/jMM/jDD HH:mm')}`;

    return message;
  }

  async Silver999TelegramMessage(
    silver: SilverRo,
    siteNames: string[],
  ): Promise<string> {
    let message = `📊 قیمت نقره عیار(۹۹۹)\n\n`;
    siteNames.forEach((site, i) => {
      message += `🌐 ${this.silverBallPersianName(site)}\n`;

      const prices = silver.prices[i] || [];
      const weights = silver.weights?.[i] || [];

      weights.forEach((weight, j) => {
        const price = prices[j];
        if (price == null) return;
        message += `🔹 ${this.toPersianNumber(weight)} گرم : ${this.toPersianNumber(price)} تومان\n`;
      });

      message += '\n';
    });
    message += `$ نرخ نقره جهانی: ${this.toPersianNumber(silver.tomanGlobalPrice)} تومان\n`;
    message += `💱 نرخ دلار: ${this.toPersianNumber(silver.tomanPerDollar)} تومان\n`;
    message += `💱 نرخ حباب: ${this.toPersianNumber(silver.bubble)} %\n`;
    message += `🕒 آخرین بروزرسانی: ${moment(silver.createdAt).format('jYYYY/jMM/jDD')}`;
    return message;
  }

  async GoldTelegramMessage(
    gold: GoldRo,
    siteNames: string[],
  ): Promise<string> {
    let message = `📊 قیمت طلا\n\n`;

    siteNames.forEach((site, i) => {
      message += `🌐 ${this.goldPersianName(site)}\n`;

      const prices = gold.prices[i] || [];
      const weights = gold.weights?.[i] || [];

      weights.forEach((weight, j) => {
        const price = prices[j];
        if (price == null) return;
        message += `🔹 ${this.toPersianNumber(weight)} گرم : ${this.toPersianNumber(price)} تومان\n`;
      });

      message += '\n';
    });

    message += `$ نرخ طلا جهانی: ${this.toPersianNumber(gold.tomanGlobalPrice)} تومان\n`;
    message += `💱 نرخ دلار: ${this.toPersianNumber(gold.tomanPerDollar)} تومان\n`;
    message += `💱 نرخ حباب: ${this.toPersianNumber(gold.bubble)} %\n`;
    message += `🕒 آخرین بروزرسانی: ${moment(gold.createdAt).format('jYYYY/jMM/jDD HH:mm')}`;

    return message;
  }

  async sendCombinedPrices(chatId): Promise<any> {
    console.log('🔄 Fetching combined prices...');

    try {
      const [goldPrices, silverBallPrices, silverBarPrices] = await Promise.all(
        [
          this.goldService.getAllGoldPrices(),
          this.silverService.getAll999SilverPrices(),
          this.silverService.getAllSilverBarPrices(),
        ],
      );

      const silverBarSiteNames = ['tokenikoBar', 'parsis', 'zioto', 'kitco'];

      const silverBallSiteNames = [
        'noghra',
        'tokeniko',
        'silverin',
        'noghresea',
        'kitco',
      ];

      const goldSiteNames = [
        'estjt',
        'tablotala',
        'tabanGohar',
        'talaIr',
        'kitco',
      ];

      const silverBarMessage = await this.SilverBarTelegramMessage(
        silverBarPrices,
        silverBarSiteNames,
      );

      const silverBallMessage = await this.Silver999TelegramMessage(
        silverBallPrices,
        silverBallSiteNames,
      );

      const goldMessage = await this.GoldTelegramMessage(
        goldPrices,
        goldSiteNames,
      );
      await this.bot.sendMessage(chatId, silverBarMessage);
      await this.bot.sendMessage(chatId, silverBallMessage);
      await this.bot.sendMessage(chatId, goldMessage);

      console.log('✅ Combined prices sent to Telegram');
    } catch (error) {
      console.error('❌ Error in sendCombinedPrices:', error);
      // Optionally send an error message to the user
      // await this.bot.sendMessage(chatId, '❌ خطا در دریافت قیمت‌ها');
      throw error; // Re-throw if you want the caller to handle it
    }
  }
}
