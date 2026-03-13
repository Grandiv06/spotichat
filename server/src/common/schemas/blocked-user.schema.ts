import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BlockedUserDocument = BlockedUser & Document;

@Schema({ timestamps: true })
export class BlockedUser {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  blockedUserId: Types.ObjectId;
}

export const BlockedUserSchema = SchemaFactory.createForClass(BlockedUser);
BlockedUserSchema.index({ userId: 1, blockedUserId: 1 }, { unique: true });
