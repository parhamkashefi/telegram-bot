import { Module, forwardRef } from '@nestjs/common';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { GoldModule } from '../gold/gold.module';
import { SilverModule } from '../silver/silver.module';
import { UsdToIrrModule } from '../usdToIrr/usdToIrr.module';

@Module({
  imports: [
    forwardRef(() => GoldModule),
    forwardRef(() => SilverModule),
    forwardRef(() => UsdToIrrModule),
  ],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}