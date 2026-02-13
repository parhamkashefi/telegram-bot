import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramModule } from './telegram/telegram.module';
import { AuthModule } from './auth/auth.module';
import { SilverModule } from './silver/silver.module';
import { GoldModule } from './gold/gold.module';
import { UsdToIrrModule } from './usdToIrr/usdToIrr.module';
import { CoinModule } from './coin/coin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27018/sopranoBot',
      {
        connectionFactory: (connection) => {
          connection.on('connected', () =>
            console.log('✅ Mongoose connected to', connection.host || 'mongo'),
          );
          connection.on('error', (err) =>
            console.error('❌ Mongoose connection error', err),
          );
          return connection;
        },
      },
    ),
    TelegramModule,
    AuthModule,
    SilverModule,
    GoldModule,
    UsdToIrrModule,
    CoinModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
