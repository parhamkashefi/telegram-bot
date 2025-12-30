import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsdToIrrDocument = UsdToIrr & Document;

@Schema({ timestamps: true })
export class UsdToIrr {
  @Prop({ required: true })
  tomanPerDollar: number;

  @Prop()
  irrPerDollar?: number;

  @Prop()
  source?: string;

  @Prop()
  fetchedAtIran?: string;

  @Prop({ type: Date, default: Date.now })
  fetchedAtUtc?: Date;
}

export const UsdToIrrSchema = SchemaFactory.createForClass(UsdToIrr);
    