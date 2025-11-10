import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { GoldService } from './gold.service';
import { SilverService } from './silver.service';
import { Price, PriceSchema } from './schemas/prices.schema';


@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([
      { name: Price.name, schema: PriceSchema }, 
    ]),
  ],
  controllers: [TelegramController],
  providers: [TelegramService, GoldService, SilverService],
  exports: [TelegramService],
})
export class TelegramModule {}
