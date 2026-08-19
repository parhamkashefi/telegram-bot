import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CoinDocument = Coin & Document;

@Schema({ timestamps: true })
export class Coin {
  @Prop({ required: true })
  productType: string;

  @Prop({ type: [String], required: true })
  siteNames: string[];

  @Prop({ type: [[Number]], required: true })
  prices: number[][];

  @Prop({ type: [[Number]], required: true })
  weights: number[][];

  @Prop({ default: () => new Date() })
  fetchedAtUtc: Date;

  @Prop({ type: Number, default: 0 })
  oldCoin: number;

  @Prop({ type: Number, default: 0 })
  newCoin: number;

  @Prop({ type: Number, default: 0 })
  halfCoin: number;

  @Prop({ type: Number, default: 0 })
  quarterCoin: number;

  @Prop({ type: Number, default: 0 })
  gramCoin: number;
}

export const CoinSchema = SchemaFactory.createForClass(Coin);
