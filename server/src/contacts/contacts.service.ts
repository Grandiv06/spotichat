import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contact, ContactDocument } from '../common/schemas/contact.schema';
import { User, UserDocument } from '../common/schemas/user.schema';

@Injectable()
export class ContactsService {
  constructor(
    @InjectModel(Contact.name) private contactModel: Model<ContactDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getContacts(userId: string) {
    const contacts = await this.contactModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('contactUserId');

    return contacts.map((c) => {
      const u = c.contactUserId as any;
      return {
        id: c._id.toString(),
        contactId: u._id.toString(),
        name: c.customName || u.name,
        phone: u.phone,
        username: u.username,
        avatar: u.avatar,
        lastSeen: 'recently',
      };
    });
  }

  async addContact(userId: string, data: { phone?: string; userId?: string; customName?: string }) {
    let contactUser: UserDocument | null = null;

    if (data.userId) {
      contactUser = await this.userModel.findById(data.userId);
    } else if (data.phone) {
      contactUser = await this.userModel.findOne({ phone: data.phone });
    }

    if (!contactUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already a contact
    const existing = await this.contactModel.findOne({
      userId: new Types.ObjectId(userId),
      contactUserId: contactUser._id,
    });
    if (existing) {
      throw new ConflictException('Contact already exists');
    }

    const contact = await this.contactModel.create({
      userId: new Types.ObjectId(userId),
      contactUserId: contactUser._id,
      customName: data.customName,
    });

    return {
      id: contact._id.toString(),
      contactId: contactUser._id.toString(),
      name: data.customName || contactUser.name,
      phone: contactUser.phone,
      username: contactUser.username,
      avatar: contactUser.avatar,
    };
  }

  async removeContact(userId: string, contactId: string) {
    const result = await this.contactModel.deleteOne({
      _id: new Types.ObjectId(contactId),
      userId: new Types.ObjectId(userId),
    });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Contact not found');
    }
    return { success: true };
  }
}
