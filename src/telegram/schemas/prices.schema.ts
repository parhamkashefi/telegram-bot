import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PriceDocument = Price & Document;

@Schema({ timestamps: true })
export class Price {
  @Prop({ required: true })
  productMaterial: string; // gold | silver

  @Prop({ required: true })
  productType: string; // ball | bar

  @Prop({ type: Object, default: {} })
  prices?: Record<string, number>; // for simple gold/silver prices

  @Prop({
    type: [
      {
        site: String,
        weights: [
          {
            weight: String,
            price: Number,
            available: { type: Boolean, default: true },
          },
        ],
      },
    ],
    default: [],
  })
  weightPrices?: {
    site: string;
    weights: { weight: string; price: number; available: boolean }[];
  }[];

  @Prop({ type: Object, default: {} })
  dollarPrices?: Record<string, number>;

  @Prop({ type: String })
  fetchedAtIran?: string;

  @Prop({ type: Date, default: Date.now })
  fetchedAtUtc?: Date;
}

export const PriceSchema = SchemaFactory.createForClass(Price); 
