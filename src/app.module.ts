import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramController } from './telegram/telegram.controller';
import { TelegramService } from './telegram/telegram.service';
import { GoldService } from './telegram/gold.service';
import { SilverService } from './telegram/silver.service';


@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }),],
  controllers: [TelegramController],
  providers: [TelegramService, GoldService, SilverService],
})
export class AppModule {}
