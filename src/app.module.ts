import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramController } from './telegram/telegram.controller';
import { TelegramService } from './telegram/telegram.service';
import { GoldService } from './telegram/gold.service';
import { SilverService } from './telegram/silver.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://mongo:27017/sopranoBot'),
  ],
  controllers: [TelegramController],
  providers: [TelegramService, GoldService, SilverService],
})
export class AppModule {}
