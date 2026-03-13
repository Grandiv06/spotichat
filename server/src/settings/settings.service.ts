import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PrivacySettings, PrivacySettingsDocument } from '../common/schemas/privacy-settings.schema';
import { NotificationSettings, NotificationSettingsDocument } from '../common/schemas/notification-settings.schema';
import { BlockedUser, BlockedUserDocument } from '../common/schemas/blocked-user.schema';
import { User, UserDocument } from '../common/schemas/user.schema';
import { Session, SessionDocument } from '../common/schemas/session.schema';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(PrivacySettings.name) private privacyModel: Model<PrivacySettingsDocument>,
    @InjectModel(NotificationSettings.name) private notifModel: Model<NotificationSettingsDocument>,
    @InjectModel(BlockedUser.name) private blockedModel: Model<BlockedUserDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private chatGateway: ChatGateway,
  ) {}

  // ── Privacy ──
  async getPrivacy(userId: string) {
    let settings = await this.privacyModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!settings) {
      settings = await this.privacyModel.create({ userId: new Types.ObjectId(userId) });
    }
    return {
      phoneNumber: settings.phoneNumber,
      lastSeen: settings.lastSeen,
      profilePhoto: settings.profilePhoto,
    };
  }

  async updatePrivacy(userId: string, data: any) {
    const settings = await this.privacyModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: data },
      { new: true, upsert: true },
    );
    return {
      phoneNumber: settings.phoneNumber,
      lastSeen: settings.lastSeen,
      profilePhoto: settings.profilePhoto,
    };
  }

  // ── Notifications ──
  async getNotifications(userId: string) {
    let settings = await this.notifModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!settings) {
      settings = await this.notifModel.create({ userId: new Types.ObjectId(userId) });
    }
    return {
      enableNotifications: settings.enableNotifications,
      showPreview: settings.showPreview,
      muteAllChats: settings.muteAllChats,
      muteGroupChats: settings.muteGroupChats,
      messageSound: settings.messageSound,
      callSound: settings.callSound,
    };
  }

  async updateNotifications(userId: string, data: any) {
    const settings = await this.notifModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $set: data },
      { new: true, upsert: true },
    );
    return {
      enableNotifications: settings.enableNotifications,
      showPreview: settings.showPreview,
      muteAllChats: settings.muteAllChats,
      muteGroupChats: settings.muteGroupChats,
      messageSound: settings.messageSound,
      callSound: settings.callSound,
    };
  }

  // ── Blocked Users ──
  async getBlockedUsers(userId: string) {
    const blocked = await this.blockedModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('blockedUserId');

    return blocked.map((b) => {
      const u = b.blockedUserId as any;
      return {
        id: u._id.toString(),
        name: u.name,
        username: u.username,
        avatar: u.avatar,
      };
    });
  }

  async blockUser(userId: string, targetUserId: string) {
    const existing = await this.blockedModel.findOne({
      userId: new Types.ObjectId(userId),
      blockedUserId: new Types.ObjectId(targetUserId),
    });
    if (existing) throw new ConflictException('User already blocked');

    await this.blockedModel.create({
      userId: new Types.ObjectId(userId),
      blockedUserId: new Types.ObjectId(targetUserId),
    });

    // Notify the blocked user in real time so they see "You can't send messages" immediately
    try {
      this.chatGateway.server
        .to(`user:${targetUserId}`)
        .emit('user:blocked-you', { byUserId: userId });
    } catch {
      // ignore emit errors
    }

    return { success: true };
  }

  async unblockUser(userId: string, targetUserId: string) {
    const result = await this.blockedModel.deleteOne({
      userId: new Types.ObjectId(userId),
      blockedUserId: new Types.ObjectId(targetUserId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Block not found');

    // Notify the unblocked user in real time so they see profile / can send again immediately
    try {
      this.chatGateway.server
        .to(`user:${targetUserId}`)
        .emit('user:unblocked-you', { byUserId: userId });
    } catch {
      // ignore emit errors
    }

    return { success: true };
  }

  // ── Sessions ──
  async getSessions(userId: string) {
    const sessions = await this.sessionModel
      .find({ userId: new Types.ObjectId(userId) }, { refreshToken: 0 })
      .sort({ lastActive: -1 });

    return sessions.map((s) => ({
      id: s._id.toString(),
      deviceName: s.deviceName,
      platform: s.platform,
      browser: s.browser,
      lastActive: s.lastActive,
    }));
  }

  async terminateSession(userId: string, sessionId: string) {
    const result = await this.sessionModel.deleteOne({
      _id: new Types.ObjectId(sessionId),
      userId: new Types.ObjectId(userId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Session not found');
    return { success: true };
  }

  async terminateAllOtherSessions(userId: string, currentSessionId?: string) {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (currentSessionId) {
      filter._id = { $ne: new Types.ObjectId(currentSessionId) };
    }
    await this.sessionModel.deleteMany(filter);
    return { success: true };
  }
}
