import { Module } from '@nestjs/common';
import { TabloTalaService } from './tablotala.service';

@Module({
  providers: [TabloTalaService],
  exports: [TabloTalaService],
})
export class TabloTalaModule {}
