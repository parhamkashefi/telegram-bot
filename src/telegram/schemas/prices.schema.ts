import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PriceDocument = Price & Document;

// Sub-types for stronger typing
export type WeightItem = {
  weight: string; // e.g. '1oz', '50g', '1000g'
  price: number; // price in toman
  available?: boolean; // default true
};

export type SiteWeight = {
  site: string; // e.g. 'zioto.gold' or 'tokeniko.com'
  weights: WeightItem[];
};

export type DollarPrices = {
  kitcoGold?: number; // USD gold price
  kitcoSilver?: number; // USD silver price
};

/**
 * Price document
 * - productMaterial: 'gold' | 'silver'
 * - productType: for gold must be 'ball', for silver can be 'bar' or 'ball'
 * - sitePrices: simple per-site flat prices (site -> price) for items that only publish a single price
 * - weightPrices: used for silver bars (per-site list of weights with prices)
 * - dollarPrices: kitcoGold / kitcoSilver in USD
 */
@Schema({ timestamps: true })
export class Price {
  @Prop({ enum: ['gold', 'silver'], required: true })
  productMaterial: 'gold' | 'silver';

  @Prop({
    enum: ['bar', 'ball'],
    required: true,
    validate: {
      validator: function (value: string) {
        // gold only uses 'ball'
        if (this.productMaterial === 'gold') return value === 'ball';
        // silver can be 'bar' or 'ball'
        if (this.productMaterial === 'silver') return ['bar', 'ball'].includes(value);
        return false;
      },
      message: 'Invalid productType for selected material',
    },
  })
  productType: 'bar' | 'ball';

  // Flat per-site prices (e.g. estjt.ir: 1,234,567)
  @Prop({ type: Map, of: Number, default: {} })
  sitePrices: Map<string, number>;

  // For silver bars: per-site weights and prices. Empty for gold/ball-only products.
  @Prop({
    type: [
      {
        site: { type: String, required: true },
        weights: [
          {
            weight: { type: String, required: true },
            price: { type: Number, required: true },
            available: { type: Boolean, default: true },
          },
        ],
      },
    ],
    default: [],
  })
  weightPrices: SiteWeight[];

  // Kitco or other dollar-denominated prices (kept separate)
  @Prop({
    type: {
      kitcoGold: { type: Number },
      kitcoSilver: { type: Number },
    },
    default: {},
  })
  dollarPrices: DollarPrices;

  // Fetched times (Iran-local string and UTC Date)
  @Prop()
  fetchedAtIran: string;

  @Prop({ default: Date.now })
  fetchedAtUtc: Date;
}

export const PriceSchema = SchemaFactory.createForClass(Price);
