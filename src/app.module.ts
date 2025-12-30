import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramModule } from './telegram/telegram.module';
import { AuthModule } from './auth/auth.module';
import { SilverModule } from './silver/silver.module';
import { GoldModule } from './gold/gold.module';
import { UsdToIrrModule } from './usdToIrr/usdToIrr.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://mongo:27017/sopranoBot', {
      connectionFactory: (connection) => {
        connection.on('connected', () => console.log('✅ Mongoose connected to', connection.host || 'mongo'));
        connection.on('error', (err) => console.error('❌ Mongoose connection error', err));
        return connection;
      },
    }),
    TelegramModule,
    AuthModule,
    SilverModule,
    GoldModule,
    UsdToIrrModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
