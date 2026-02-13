import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GoldDocument = Gold & Document;

@Schema({ timestamps: true })
export class Gold {
  @Prop({ required: true })
  productType: string;

  @Prop({ type: Array })
  siteNames: string[];

  @Prop({ type: Array, default: [[]] })
  prices: number[][];

  @Prop({ type: Array, default: [[]] })
  weights: number[][];

  @Prop({ type: Array, default: [] })
  globalSiteNames: string[];

  @Prop({ type: Array, default: [] })
  globalPrices: number[];

  @Prop({ default: [] })
  tomanPerDollar: number;

  @Prop({ type: Array })
  dollarPrices: number[];

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
