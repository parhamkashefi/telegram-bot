import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SilverDocument = Silver & Document;

@Schema({ timestamps: true })
export class Silver {
  @Prop({ required: true })
  productType: string;

  @Prop({ type: Array, of: Number })
  siteNames: [string];

  @Prop({ type: Array, of: Number, default: [[]] })
  prices: number[][];

  @Prop({ type: Array, default: [[]] })
  weights: number[][];

  @Prop({ type: Array, of: Number, default: [] })
  globalSiteNames: string[];

  @Prop({ type: Array, of: Number, default: [] })
  globalPrices: number[];

  @Prop({ default: [] })
  tomanPerDollar: number;

  @Prop({ type: Array, of: Number, default: [] })
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

export const SilverSchema = SchemaFactory.createForClass(Silver);
