import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PrivacySettingsDocument = PrivacySettings & Document;

export class PrivacyRule {
  @Prop({ enum: ['Everybody', 'My Contacts', 'Nobody'], default: 'My Contacts' })
  option: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  exceptContacts: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  allowContacts: Types.ObjectId[];
}

@Schema({ timestamps: true })
export class PrivacySettings {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: PrivacyRule, default: () => ({ option: 'Nobody', exceptContacts: [], allowContacts: [] }) })
  phoneNumber: PrivacyRule;

  @Prop({ type: PrivacyRule, default: () => ({ option: 'My Contacts', exceptContacts: [], allowContacts: [] }) })
  lastSeen: PrivacyRule;

  @Prop({ type: PrivacyRule, default: () => ({ option: 'My Contacts', exceptContacts: [], allowContacts: [] }) })
  profilePhoto: PrivacyRule;
}

export const PrivacySettingsSchema = SchemaFactory.createForClass(PrivacySettings);
