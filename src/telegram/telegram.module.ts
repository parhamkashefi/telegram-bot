import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { GoldService } from './gold.service';
import { SilverService } from './silver.service';
import { Price, PriceSchema } from './schemas/prices.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    MongooseModule.forFeature([
      { name: Price.name, schema: PriceSchema },
    ]),
  ],
  controllers: [TelegramController],
  providers: [TelegramService, GoldService, SilverService],
  exports: [TelegramService],
})
export class TelegramModule {}
