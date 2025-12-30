import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsdToIrrService } from './usdToIrr.service';
import { UsdToIrr, UsdToIrrSchema } from './schema/usdToIrr.schema';
import { UsdToIrrController } from './userToIrr.controller';


@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    MongooseModule.forFeature([
      { name: UsdToIrr.name, schema: UsdToIrrSchema },
    ]),
  ],
  controllers: [UsdToIrrController],
  providers: [UsdToIrrService,],
  exports: [UsdToIrrService],
})
export class UsdToIrrModule {}
