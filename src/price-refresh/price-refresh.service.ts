import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoldService } from '../gold/gold.service';
import { SilverService } from '../silver/silver.service';
import { TelegramService } from '../telegram/telegram.service';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const INITIAL_DELAY_MS = 15_000;

/**
 * Periodically crawls gold/silver prices into MongoDB so the public website
 * API can serve fresh data. Works without Telegram credentials.
 * When BOT_TOKEN + GROUP_CHAT_ID are set, also posts updates to the group.
 */
@Injectable()
export class PriceRefreshService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PriceRefreshService.name);
  private refreshInterval: NodeJS.Timeout | null = null;
  private initialTimeout: NodeJS.Timeout | null = null;
  private refreshInProgress = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly goldService: GoldService,
    private readonly silverService: SilverService,
    private readonly telegramService: TelegramService,
  ) {}

  onModuleInit() {
    this.logger.log(
      `🚀 Price refresh scheduler started (every ${REFRESH_INTERVAL_MS / 60_000} minutes)`,
    );

    this.initialTimeout = setTimeout(() => {
      void this.refreshPrices();
    }, INITIAL_DELAY_MS);

    this.refreshInterval = setInterval(() => {
      void this.refreshPrices();
    }, REFRESH_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.initialTimeout) clearTimeout(this.initialTimeout);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.logger.log('🛑 Price refresh scheduler stopped');
  }

  async refreshPrices(): Promise<void> {
    if (this.refreshInProgress) {
      this.logger.warn('⏭️ Price refresh already in progress — skipping');
      return;
    }

    this.refreshInProgress = true;
    this.logger.log('🔄 Refreshing gold & silver prices...');

    try {
      const [goldPrices, silverBallPrices, silverBarPrices] = await Promise.all([
        this.goldService.getAllGoldPrices(),
        this.silverService.getAll999SilverPrices(),
        this.silverService.getAllSilverBarPrices(),
      ]);

      this.logger.log('✅ Prices saved to MongoDB');

      const groupChatId = this.configService.get<string>('GROUP_CHAT_ID') || '';
      if (this.telegramService.isEnabled() && groupChatId) {
        await this.telegramService.sendCrawledPricesToChat(
          groupChatId,
          goldPrices,
          silverBallPrices,
          silverBarPrices,
        );
      } else {
        this.logger.log(
          'ℹ️ Telegram notify skipped (BOT_TOKEN or GROUP_CHAT_ID not set)',
        );
      }
    } catch (error) {
      this.logger.error('❌ Price refresh failed', error);
    } finally {
      this.refreshInProgress = false;
    }
  }
}
