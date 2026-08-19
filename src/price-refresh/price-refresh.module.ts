import { Module, forwardRef } from '@nestjs/common';
import { PriceRefreshService } from './price-refresh.service';
import { GoldModule } from '../gold/gold.module';
import { SilverModule } from '../silver/silver.module';
import { CoinModule } from '../coin/coin.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    forwardRef(() => GoldModule),
    forwardRef(() => SilverModule),
    forwardRef(() => CoinModule),
    forwardRef(() => TelegramModule),
  ],
  providers: [PriceRefreshService],
  exports: [PriceRefreshService],
})
export class PriceRefreshModule {}
