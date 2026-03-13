import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrivacySettings, PrivacySettingsSchema } from '../common/schemas/privacy-settings.schema';
import { NotificationSettings, NotificationSettingsSchema } from '../common/schemas/notification-settings.schema';
import { BlockedUser, BlockedUserSchema } from '../common/schemas/blocked-user.schema';
import { User, UserSchema } from '../common/schemas/user.schema';
import { Session, SessionSchema } from '../common/schemas/session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PrivacySettings.name, schema: PrivacySettingsSchema },
      { name: NotificationSettings.name, schema: NotificationSettingsSchema },
      { name: BlockedUser.name, schema: BlockedUserSchema },
      { name: User.name, schema: UserSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
