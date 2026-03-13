import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  refreshToken: string;

  @Prop()
  deviceName?: string;

  @Prop()
  platform?: string;

  @Prop()
  browser?: string;

  @Prop()
  ip?: string;

  @Prop({ default: () => new Date() })
  lastActive: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
