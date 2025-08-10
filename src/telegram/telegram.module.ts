import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TelegramService } from './telegram.service';
import { GoldService } from './gold.service';
import { SilverService } from './silver.service';

@Module({
  imports: [
    ConfigModule, 
  ],
  providers: [TelegramService,GoldService,SilverService],
  
})

export class TelegramModule {}
