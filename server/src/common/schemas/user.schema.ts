import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, sparse: true })
  username?: string;

  @Prop()
  bio?: string;

  @Prop()
  avatar?: string;

  @Prop()
  twoStepPasswordHash?: string;

  @Prop()
  passcodeHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
