import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ProductDocument = Product & Document;

export enum ProductCategory {
  GOLD = 'gold',
  SILVER = 'silver',
}

export enum ProductType {
  BAR = 'bar',
  BALL = 'ball',
}

@Schema({ timestamps: true })
export class Product {
  @ApiProperty({ enum: ProductCategory })
  @Prop({
    type: String,
    enum: ProductCategory,
    required: true,
  })
  category: ProductCategory;

  @ApiProperty({ enum: ProductType })
  @Prop({
    type: String,
    enum: ProductType,
    required: true,
  })
  productType: ProductType;

  @ApiProperty()
  @Prop({ type: Number, required: true })
  weight: number;

  @ApiProperty()
  @Prop({ type: Number, required: true })
  sellPrice: number;

  @ApiProperty()
  @Prop({ type: Number, required: true })
  buyPrice: number;

  @ApiProperty({ default: true })
  @Prop({ type: Boolean, default: true })
  exist: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
