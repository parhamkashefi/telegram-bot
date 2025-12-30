import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SilverDocument = Silver & Document;

@Schema({ timestamps: true })
export class Silver {
  @Prop({ required: true })
  productType: string;

  @Prop({ type: Array, of: Number })
  siteNames: [string];

  //Iranian prices (per gram / ball / etc.)
  @Prop({ type: Array, of: Number, default: [[]] })
  prices: number[][];

  // Weight-based prices (bars, ounces)
  @Prop({ type: Array, default: [[]] })
  weights: number[][];

  @Prop({ type: Array, of: Number, default: [] })
  globalSiteNames: string[];

  @Prop({ type: Array, of: Number, default: [] })
  globalPrices: number[];

  //USD → Toman
  @Prop({ default: [] })
  tomanPerDollar: number;

  //Global prices (Kitco, etc.)
  @Prop({ type: Array, of: Number, default: [] })
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

export const SilverSchema = SchemaFactory.createForClass(Silver);
