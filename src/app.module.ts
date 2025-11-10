import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // use MONGODB_URI from .env; add a connectionFactory to log connection success
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://mongo:27017/sopranoBot', {
      connectionFactory: (connection) => {
        connection.on('connected', () => console.log('✅ Mongoose connected to', connection.host || 'mongo'));
        connection.on('error', (err) => console.error('❌ Mongoose connection error', err));
        return connection;
      },
    }),
    TelegramModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
