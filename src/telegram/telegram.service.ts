import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoldService } from './gold.service';
import { SilverService } from './silver.service';
import TelegramBot from 'node-telegram-bot-api';


@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: TelegramBot;
  private groupChatId: string
  constructor(
    private readonly configService: ConfigService,
    private readonly goldService: GoldService,
    private readonly silverService: SilverService,
  ) { }

  onModuleInit() {
    const token = this.configService.get<string>('BOT_TOKEN');
    this.bot = new TelegramBot(token, { polling: true });
    this.groupChatId = this.configService.get<string>('GROUP_CHAT_ID') || "";
    this.initMenu();
    // this.initAutoPriceSender();
  }

  private initMenu() {
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, 'سلام! به ربات سوپرانو خوش آمدید. :', {
        reply_markup: {
          keyboard: [['💰 قیمت لحظه‌ای طلا', '⚪️ قیمت لحظه‌ای نقره']],
          resize_keyboard: true,

        },
      });
    });

    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;

      if (text === '💰 قیمت لحظه‌ای طلا') {
        await this.sendGoldPrice(chatId);
      }

      if (text === '⚪️ قیمت لحظه‌ای نقره') {
        await this.sendSilverPrice(chatId);
      }
    });
  }

  // output all gold prices
  async sendGoldPrice(chatId: number | string) {
    await this.bot.sendMessage(chatId, '⏳ در حال دریافت قیمت طلا...');
    const prices = await this.goldService.getAllGoldPrices();
    await this.bot.sendMessage(chatId, prices);
  }
  // output all silver prices
  async sendSilverPrice(chatId: number | string) {
    await this.bot.sendMessage(chatId, '⏳ در حال دریافت قیمت نقره...');
    const prices = await this.silverService.getAllSilverPrices();
    await this.bot.sendMessage(chatId, prices);
  }

  // Auto send prices to group every 2 minutes
private initAutoPriceSender() {
  this.groupChatId = this.configService.get<string>('GROUP_CHAT_ID') || '';

  if (!this.groupChatId) {
    console.warn('❌ GROUP_CHAT_ID not set in .env');
    return;
  }

  console.log('🚀 Auto price sender started. Will send every 30 minutes.');

  // ✅ Send immediately when bot starts
  this.sendCombinedPrices();

  // ✅ Then send every 30 minutes (30 * 60 * 1000 ms)
  setInterval(() => this.sendCombinedPrices(), 30 * 60 * 1000);
}


  private async sendCombinedPrices() {
    try {
      // 🕒 get current time once
      const now = new Date();
      const formattedDate = now.toLocaleString('fa-IR', {
        dateStyle: 'short',
        timeStyle: 'short',
      });

      // 🪙 get both prices
      const [goldPrices, silverPrices] = await Promise.all([
        this.goldService.getAllGoldPrices(),
        this.silverService.getAllSilverPrices(),
      ]);

      // 🧩 combine with a single timestamp
      const combinedMessage = `
💰 <b>قیمت‌ها (${formattedDate}):</b>

${goldPrices}

${silverPrices}
`;

      await this.bot.sendMessage(this.groupChatId, combinedMessage, {
        parse_mode: 'HTML',
      });

      console.log('✅ Prices sent to Telegram group successfully!');
    } catch (err) {
      console.error('❌ Error sending scheduled message:', err.message);
    }
  }
}
