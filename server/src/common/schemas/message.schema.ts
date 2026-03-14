import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, ref: 'ChatEntity', required: true, index: true })
  chatId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ enum: ['text', 'voice', 'video', 'file'], default: 'text' })
  type: string;

  // Encrypted message content (for text messages)
  @Prop()
  encryptedContent?: string;

  // IV for decryption
  @Prop()
  iv?: string;

  // File URL (for voice/video/file messages)
  @Prop()
  fileUrl?: string;

  @Prop()
  duration?: number;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyToId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  replyToSenderId?: Types.ObjectId;

  @Prop()
  replyToSenderName?: string;

  @Prop({ enum: ['text', 'voice', 'video', 'file'] })
  replyToMessageType?: string;

  @Prop()
  replyToMessagePreview?: string;

  @Prop({ type: Map, of: [String], default: {} })
  reactions: Map<string, string[]>;

  @Prop({ enum: ['sending', 'sent', 'delivered', 'seen'], default: 'sent' })
  status: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ chatId: 1, createdAt: -1 });
