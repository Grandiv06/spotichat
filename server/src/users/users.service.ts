import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../common/schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async getById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { name?: string; username?: string; bio?: string }) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user._id.toString(),
      phone: user.phone,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
    };
  }

  async updateAvatar(userId: string, avatarPath: string) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { avatar: avatarPath } },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user._id.toString(),
      phone: user.phone,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
    };
  }

  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.length < 2) return [];

    const users = await this.userModel.find({
      _id: { $ne: new Types.ObjectId(currentUserId) },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { phone: { $regex: query } },
        { name: { $regex: query, $options: 'i' } },
      ],
    }).limit(20);

    return users.map((u) => ({
      id: u._id.toString(),
      phone: u.phone,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
    }));
  }
}
