import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { GoldService } from '../gold/gold.service';
import { SilverService } from '../silver/silver.service';
import { CoinService } from '../coin/coin.service';

const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const LIVE_GOLD_INTERVAL_MS = 10 * 1000;
const INITIAL_DELAY_MS = 15_000;

/**
 * Periodically refreshes gold/silver/coin prices into MongoDB via HTTP APIs
 * so the public website can serve fresh data. No Telegram / no browser.
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
    private readonly goldService: GoldService,
    private readonly silverService: SilverService,
    private readonly coinService: CoinService,
  ) {}

  onModuleInit() {
    this.logger.log(
      `🚀 Price refresh scheduler started (full HTTP refresh every ${REFRESH_INTERVAL_MS / 60_000} minutes, live gold/coins every ${LIVE_GOLD_INTERVAL_MS / 1000}s)`,
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
    this.logger.log('🔄 Refreshing gold, silver & coin prices (HTTP)...');

    try {
      await Promise.all([
        this.goldService.refreshHomepageGoldPrices(),
        this.silverService.refreshHomepageSilverPrices(),
        this.coinService.refreshTabloTalaCoins(),
      ]);
      this.logger.log('✅ Prices saved to MongoDB');
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
