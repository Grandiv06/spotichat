import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationSettingsDocument = NotificationSettings & Document;

@Schema({ timestamps: true })
export class NotificationSettings {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ default: true })
  enableNotifications: boolean;

  @Prop({ default: true })
  showPreview: boolean;

  @Prop({ default: false })
  muteAllChats: boolean;

  @Prop({ default: false })
  muteGroupChats: boolean;

  @Prop({ default: 'default' })
  messageSound: string;

  @Prop({ default: 'default' })
  callSound: string;
}

export const NotificationSettingsSchema = SchemaFactory.createForClass(NotificationSettings);
