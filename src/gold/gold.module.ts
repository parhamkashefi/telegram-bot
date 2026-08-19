import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GoldService } from '../gold/gold.service';
import { AuthModule } from '../auth/auth.module';
import { GoldController } from './gold.controller';
import { Gold, GoldSchema } from './schema/gold.schema';
import { UsdToIrrModule } from 'src/usdToIrr/usdToIrr.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    MongooseModule.forFeature([{ name: Gold.name, schema: GoldSchema }]),
    forwardRef(() => UsdToIrrModule),
  ],
  controllers: [GoldController],
  providers: [GoldService],
  exports: [GoldService],
})
export class GoldModule {}
