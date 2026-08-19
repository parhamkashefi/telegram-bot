import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoldService } from '../gold/gold.service';
import { SilverService } from '../silver/silver.service';
import { CoinService } from '../coin/coin.service';
import { TelegramService } from '../telegram/telegram.service';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const LIVE_GOLD_INTERVAL_MS = 10 * 1000;
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
  private liveGoldInterval: NodeJS.Timeout | null = null;
  private initialTimeout: NodeJS.Timeout | null = null;
  private refreshInProgress = false;
  private liveGoldRefreshInProgress = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly goldService: GoldService,
    private readonly silverService: SilverService,
    private readonly coinService: CoinService,
    private readonly telegramService: TelegramService,
  ) {}

  onModuleInit() {
    this.logger.log(
      `🚀 Price refresh scheduler started (full crawl every ${REFRESH_INTERVAL_MS / 60_000} minutes, live gold/coins every ${LIVE_GOLD_INTERVAL_MS / 1000}s)`,
    );

    this.initialTimeout = setTimeout(() => {
      void this.refreshPrices();
    }, INITIAL_DELAY_MS);

    this.refreshInterval = setInterval(() => {
      void this.refreshPrices();
    }, REFRESH_INTERVAL_MS);

    this.liveGoldInterval = setInterval(() => {
      void this.refreshLiveGold();
    }, LIVE_GOLD_INTERVAL_MS);

    void this.refreshLiveGold();
  }

  onModuleDestroy() {
    if (this.initialTimeout) clearTimeout(this.initialTimeout);
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.liveGoldInterval) clearInterval(this.liveGoldInterval);
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

  async refreshLiveGold(): Promise<void> {
    if (this.refreshInProgress || this.liveGoldRefreshInProgress) {
      return;
    }

    this.liveGoldRefreshInProgress = true;
    try {
      await Promise.all([
        this.goldService.refreshHomepageGoldPrices(),
        this.coinService.refreshTabloTalaCoins(),
      ]);
    } catch (error) {
      this.logger.error('❌ Live gold/coin refresh failed', error);
    } finally {
      this.liveGoldRefreshInProgress = false;
    }
  }
}
