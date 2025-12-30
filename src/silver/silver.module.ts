import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { SilverService } from './silver.service';
import { SilverController } from './silver.controller';
import { Silver, SilverSchema } from './schema/silver.schema';
import { TelegramModule } from 'src/telegram/telegram.module';
import { UsdToIrrModule} from 'src/usdToIrr/usdToIrr.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    MongooseModule.forFeature([{ name: Silver.name, schema: SilverSchema }]),
    forwardRef(() => TelegramModule),
    forwardRef(() => UsdToIrrModule),
  ],
  controllers: [SilverController],
  providers: [SilverService],
  exports: [SilverService],
})
export class SilverModule {}
