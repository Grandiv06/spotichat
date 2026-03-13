import { Injectable, UnauthorizedException, ForbiddenException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcryptjs from 'bcryptjs';
import { User, UserDocument } from '../common/schemas/user.schema';
import { Session, SessionDocument } from '../common/schemas/session.schema';

// Only these 3 phones are allowed for testing
const ALLOWED_PHONES = ['+989123456789', '+989000000002', '+989000000003'];
const FIXED_OTP = '12345';

const SEED_USERS = [
  { phone: '+989123456789', name: 'Soroush', username: 'soroush', avatar: 'https://i.pravatar.cc/150?u=+989123456789' },
  { phone: '+989000000002', name: 'Ali', username: 'ali_dev', avatar: 'https://i.pravatar.cc/150?u=+989000000002' },
  { phone: '+989000000003', name: 'Sara', username: 'sara', avatar: 'https://i.pravatar.cc/150?u=+989000000003' },
];

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
    // Seed the 3 test users on startup
    for (const seed of SEED_USERS) {
      const exists = await this.userModel.findOne({ phone: seed.phone });
      if (!exists) {
        await this.userModel.create(seed);
        console.log(`[Seed] Created test user: ${seed.name} (${seed.phone})`);
      }
    }
  }

  async sendOtp(phone: string): Promise<{ success: boolean }> {
    if (!ALLOWED_PHONES.includes(phone)) {
      throw new ForbiddenException('Phone number not allowed in test mode');
    }
    // In production, send real SMS here
    console.log(`[OTP] Sent code ${FIXED_OTP} to ${phone}`);
    return { success: true };
  }

  async verifyOtp(
    phone: string,
    code: string,
    deviceInfo?: { deviceName?: string; platform?: string; browser?: string; ip?: string },
  ) {
    if (!ALLOWED_PHONES.includes(phone)) {
      throw new ForbiddenException('Phone number not allowed in test mode');
    }

    if (code !== FIXED_OTP) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    // Find or create user
    let user = await this.userModel.findOne({ phone });
    if (!user) {
      const nameMap: Record<string, string> = {
        '+989123456789': 'Soroush',
        '+989000000002': 'Ali',
        '+989000000003': 'Sara',
      };
      user = await this.userModel.create({
        phone,
        name: nameMap[phone] || 'User',
        username: phone === '+989123456789' ? 'soroush' : phone === '+989000000002' ? 'ali_dev' : 'sara',
        avatar: `https://i.pravatar.cc/150?u=${phone}`,
      });
    }

    // Generate tokens
    const payload = { sub: user._id.toString(), phone: user.phone };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET', 'spotichat_refresh_secret_dev_2024'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
    });

    // Create session
    const hashedRefresh = await bcryptjs.hash(refreshToken, 10);
    await this.sessionModel.create({
      userId: user._id,
      refreshToken: hashedRefresh,
      deviceName: deviceInfo?.deviceName || 'Unknown',
      platform: deviceInfo?.platform || 'Unknown',
      browser: deviceInfo?.browser || 'Unknown',
      ip: deviceInfo?.ip || '',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        phone: user.phone,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const userId = payload.sub;
      const sessions = await this.sessionModel.find({ userId: new Types.ObjectId(userId) });

      let validSession: SessionDocument | null = null;
      for (const session of sessions) {
        const isMatch = await bcryptjs.compare(refreshToken, session.refreshToken);
        if (isMatch) {
          validSession = session;
          break;
        }
      }

      if (!validSession) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new access token
      const newPayload = { sub: user._id.toString(), phone: user.phone };
      const newAccessToken = this.jwtService.sign(newPayload);

      // Update session lastActive
      validSession.lastActive = new Date();
      await validSession.save();

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const sessions = await this.sessionModel.find({ userId: new Types.ObjectId(userId) });
      for (const session of sessions) {
        const isMatch = await bcryptjs.compare(refreshToken, session.refreshToken);
        if (isMatch) {
          await this.sessionModel.deleteOne({ _id: session._id });
          break;
        }
      }
    } else {
      // Delete all sessions for this user
      await this.sessionModel.deleteMany({ userId: new Types.ObjectId(userId) });
    }
    return { success: true };
  }

  async getSessions(userId: string) {
    const sessions = await this.sessionModel.find(
      { userId: new Types.ObjectId(userId) },
      { refreshToken: 0 },
    ).sort({ lastActive: -1 });

    return sessions.map((s) => ({
      id: s._id.toString(),
      deviceName: s.deviceName,
      platform: s.platform,
      browser: s.browser,
      lastActive: s.lastActive,
      isCurrent: false, // Will be determined by controller
    }));
  }

  async terminateOtherSessions(userId: string, currentRefreshToken: string) {
    const sessions = await this.sessionModel.find({ userId: new Types.ObjectId(userId) });
    for (const session of sessions) {
      const isMatch = await bcryptjs.compare(currentRefreshToken, session.refreshToken);
      if (!isMatch) {
        await this.sessionModel.deleteOne({ _id: session._id });
      }
    }
    return { success: true };
  }
}
