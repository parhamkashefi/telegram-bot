import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TelegramModule } from 'src/telegram/telegram.module';
import { UsdToIrrModule } from 'src/usdToIrr/usdToIrr.module';
import { Coin, CoinSchema } from './schema/coin.schema';
import { CoinController } from './coin.controller';
import { CoinService } from './coin.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    MongooseModule.forFeature([{ name: Coin.name, schema: CoinSchema }]),
    forwardRef(() => TelegramModule),
    forwardRef(() => UsdToIrrModule),
  ],
  controllers: [CoinController],
  providers: [CoinService],
  exports: [CoinService],
})
export class CoinModule {}
