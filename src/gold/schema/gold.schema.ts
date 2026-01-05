import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GoldDocument = Gold & Document;

@Schema({ timestamps: true })
export class Gold {
  @Prop({ required: true })
  productType: string;

  @Prop({ type: Array })
  siteNames: string[];

  //Iranian prices (per gram / ball / etc.)
  @Prop({ type: Array, default: [[]] })
  prices: number[][];

  @Prop({ type: Array, default: [[]] })
  weights: number[][];

  @Prop({ type: Array, default: [] })
  globalSiteNames: string[];

  @Prop({ type: Array, default: [] })
  globalPrices: number[];

  //USD → Toman
  @Prop({ default: [] })
  tomanPerDollar: number;

  // Global prices (Kitco, etc.)
  @Prop({ type: Array })
  dollarPrices: number[];

  // Weight-based prices (bars, ounces)
  @Prop({ type: Number, default: 400000 })
  average: number;

  @Prop({ type: Number, default: 500000 })
  tomanGlobalPrice: number;

  @Prop({ type: Number, default: 2 })
  bubble: number;

  @Prop()
  fetchedAtUtc: Date;
}

export const GoldSchema = SchemaFactory.createForClass(Gold);
