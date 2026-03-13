import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatDocument = ChatEntity & Document;

@Schema({ timestamps: true })
export class ChatEntity {
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  @Prop({ enum: ['private', 'group', 'channel'], default: 'private' })
  type: string;

  @Prop()
  name?: string;

  @Prop()
  avatar?: string;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage?: Types.ObjectId;

  @Prop({ default: () => new Date() })
  lastMessageAt: Date;
}

export const ChatSchema = SchemaFactory.createForClass(ChatEntity);
