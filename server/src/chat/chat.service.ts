import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatEntity, ChatDocument } from '../common/schemas/chat.schema';
import { Message, MessageDocument } from '../common/schemas/message.schema';
import { User, UserDocument } from '../common/schemas/user.schema';
import { BlockedUser, BlockedUserDocument } from '../common/schemas/blocked-user.schema';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatEntity.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(BlockedUser.name) private blockedUserModel: Model<BlockedUserDocument>,
    private encryptionService: EncryptionService,
  ) {}

  private buildMessagePreviewFromDoc(message: MessageDocument): string {
    if (message.type === 'text') {
      if (!message.encryptedContent || !message.iv) return 'Message';
      try {
        return this.encryptionService.decrypt(message.encryptedContent, message.iv);
      } catch {
        return 'Message';
      }
    }
    if (message.type === 'voice') return 'Voice message';
    if (message.type === 'video') return 'Video';
    if (message.type === 'file') return 'File';
    return 'Message';
  }

  async getChats(userId: string) {
    const chats = await this.chatModel
      .find({ participants: new Types.ObjectId(userId) })
      .sort({ lastMessageAt: -1 })
      .populate('participants')
      .populate('lastMessage');

    const myId = new Types.ObjectId(userId);
    const otherParticipantIds = chats
      .map((chat) => {
        const p = (chat.participants as any[]).find((x) => x._id.toString() !== userId);
        return p?._id;
      })
      .filter(Boolean);
    const blockedMeSet = new Set<string>();
    if (otherParticipantIds.length > 0) {
      const rows = await this.blockedUserModel.find({
        userId: { $in: otherParticipantIds },
        blockedUserId: myId,
      });
      rows.forEach((r) => blockedMeSet.add((r.userId as Types.ObjectId).toString()));
    }

    return chats.map((chat) => {
      const participant = (chat.participants as any[]).find(
        (p) => p._id.toString() !== userId,
      );
      const participantId = participant?._id?.toString();
      const blockedByThem = participantId ? blockedMeSet.has(participantId) : false;
      const lastMsg = chat.lastMessage as any;

      let lastMessageText: string | undefined;
      if (lastMsg) {
        if (lastMsg.type === 'text' && lastMsg.encryptedContent && lastMsg.iv) {
          try {
            lastMessageText = this.encryptionService.decrypt(lastMsg.encryptedContent, lastMsg.iv);
          } catch {
            lastMessageText = '[Encrypted]';
          }
        } else {
          lastMessageText = `[${lastMsg.type}]`;
        }
      }

      return {
        id: chat._id.toString(),
        participant: participant
          ? {
              id: participant._id.toString(),
              phone: participant.phone,
              name: participant.name,
              username: participant.username,
              avatar: participant.avatar,
              lastSeenAt: (participant as any).lastSeenAt?.toISOString?.(),
            }
          : null,
        lastMessage: lastMsg
          ? {
              id: lastMsg._id.toString(),
              chatId: chat._id.toString(),
              senderId: lastMsg.senderId.toString(),
              text: lastMessageText,
              type: lastMsg.type,
              createdAt: lastMsg.createdAt,
              status: lastMsg.status,
            }
          : undefined,
        unreadCount: 0, // TODO: implement unread counting
        type: chat.type,
        blockedByThem,
      };
    });
  }

  async getOrCreatePrivateChat(userId: string, otherUserId: string): Promise<string> {
    // Find existing private chat between these two users
    let chat = await this.chatModel.findOne({
      type: 'private',
      participants: { $all: [new Types.ObjectId(userId), new Types.ObjectId(otherUserId)] },
    });

    if (!chat) {
      chat = await this.chatModel.create({
        participants: [new Types.ObjectId(userId), new Types.ObjectId(otherUserId)],
        type: 'private',
      });
    }

    return chat._id.toString();
  }

  async getMessages(chatId: string, userId: string, page = 1, limit = 50) {
    // Verify user is a participant
    const chat = await this.chatModel.findOne({
      _id: new Types.ObjectId(chatId),
      participants: new Types.ObjectId(userId),
    });
    if (!chat) throw new NotFoundException('Chat not found');

    const skip = (page - 1) * limit;
    const messages = await this.messageModel
      .find({ chatId: new Types.ObjectId(chatId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const orderedMessages = messages.reverse();
    const replyIds = Array.from(
      new Set(
        orderedMessages
          .map((msg) => msg.replyToId?.toString())
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const repliedMessages = replyIds.length
      ? await this.messageModel.find({ _id: { $in: replyIds.map((id) => new Types.ObjectId(id)) } })
      : [];
    const repliedMessageById = new Map(
      repliedMessages.map((msg) => [msg._id.toString(), msg] as const),
    );

    const replySenderIds = Array.from(
      new Set(
        repliedMessages.map((msg) => msg.senderId.toString()),
      ),
    );
    const replySenders = replySenderIds.length
      ? await this.userModel
          .find({ _id: { $in: replySenderIds.map((id) => new Types.ObjectId(id)) } })
          .select('name')
      : [];
    const replySenderNameById = new Map(
      replySenders.map((sender) => [sender._id.toString(), sender.name] as const),
    );

    return orderedMessages.map((msg) => {
      let text: string | undefined;
      if (msg.type === 'text' && msg.encryptedContent && msg.iv) {
        try {
          text = this.encryptionService.decrypt(msg.encryptedContent, msg.iv);
        } catch {
          text = '[Encrypted]';
        }
      }

      const replied = msg.replyToId ? repliedMessageById.get(msg.replyToId.toString()) : undefined;
      const replySenderId =
        msg.replyToSenderId?.toString() ??
        replied?.senderId?.toString();
      const replySenderName =
        msg.replyToSenderName ??
        (replySenderId ? replySenderNameById.get(replySenderId) : undefined);
      const replyToMessageType =
        msg.replyToMessageType ??
        replied?.type;
      const replyToMessagePreview =
        msg.replyToMessagePreview ??
        (replied ? this.buildMessagePreviewFromDoc(replied) : undefined);

      return {
        id: msg._id.toString(),
        chatId: msg.chatId.toString(),
        senderId: msg.senderId.toString(),
        text,
        type: msg.type,
        fileUrl: msg.fileUrl,
        duration: msg.duration,
        createdAt: (msg as any).createdAt,
        status: msg.status,
        replyToId: msg.replyToId?.toString(),
        replyToSenderId: replySenderId,
        replyToSenderName: replySenderName,
        replyToMessageType,
        replyToMessagePreview,
        reactions: msg.reactions ? Object.fromEntries(msg.reactions) : {},
      };
    });
  }

  async sendMessage(
    chatId: string,
    senderId: string,
    data: { text?: string; type?: string; fileUrl?: string; duration?: number; replyToId?: string },
  ) {
    const chatObjectId = new Types.ObjectId(chatId);

    // Verify sender is a participant
    const chat = await this.chatModel.findOne({
      _id: chatObjectId,
      participants: new Types.ObjectId(senderId),
    });
    if (!chat) throw new NotFoundException('Chat not found');

    // Check if blocked
    const otherParticipant = chat.participants.find(
      (p) => p.toString() !== senderId,
    );
    if (otherParticipant) {
      const blocked = await this.blockedUserModel.findOne({
        userId: otherParticipant,
        blockedUserId: new Types.ObjectId(senderId),
      });
      if (blocked) {
        throw new ForbiddenException('You are blocked by this user');
      }
    }

    let replyTargetId: Types.ObjectId | undefined;
    let replyToSenderId: Types.ObjectId | undefined;
    let replyToSenderName: string | undefined;
    let replyToMessageType: string | undefined;
    let replyToMessagePreview: string | undefined;

    if (data.replyToId) {
      const replyTarget = await this.messageModel.findOne({
        _id: new Types.ObjectId(data.replyToId),
        chatId: chatObjectId,
      });
      if (!replyTarget) {
        throw new NotFoundException('Reply target not found in this chat');
      }

      replyTargetId = replyTarget._id as Types.ObjectId;
      replyToSenderId = replyTarget.senderId as Types.ObjectId;
      replyToMessageType = replyTarget.type;
      replyToMessagePreview = this.buildMessagePreviewFromDoc(replyTarget);

      const replySender = await this.userModel.findById(replyToSenderId).select('name');
      replyToSenderName = replySender?.name || 'Unknown';
    }

    // Encrypt text content
    let encryptedContent: string | undefined;
    let iv: string | undefined;
    if (data.text) {
      const encrypted = this.encryptionService.encrypt(data.text);
      encryptedContent = encrypted.encrypted;
      iv = encrypted.iv;
    }

    const message = await this.messageModel.create({
      chatId: chatObjectId,
      senderId: new Types.ObjectId(senderId),
      type: data.type || 'text',
      encryptedContent,
      iv,
      fileUrl: data.fileUrl,
      duration: data.duration,
      replyToId: replyTargetId,
      replyToSenderId,
      replyToSenderName,
      replyToMessageType,
      replyToMessagePreview,
      status: 'sent',
    });

    // Update chat's lastMessage
    await this.chatModel.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
    });

    return {
      id: message._id.toString(),
      chatId: message.chatId.toString(),
      senderId: message.senderId.toString(),
      text: data.text,
      type: message.type,
      fileUrl: message.fileUrl,
      duration: message.duration,
      createdAt: (message as any).createdAt,
      status: message.status,
      replyToId: message.replyToId?.toString(),
      replyToSenderId: message.replyToSenderId?.toString(),
      replyToSenderName: message.replyToSenderName,
      replyToMessageType: message.replyToMessageType,
      replyToMessagePreview: message.replyToMessagePreview,
      reactions: {},
    };
  }

  async updateMessageStatus(messageId: string, status: 'delivered' | 'seen') {
    const message = await this.messageModel.findByIdAndUpdate(
      messageId,
      { status },
      { new: true },
    );
    if (!message) throw new NotFoundException('Message not found');
    return {
      id: message._id.toString(),
      chatId: message.chatId.toString(),
      status: message.status,
    };
  }

  async addReaction(messageId: string, userId: string, emoji: string) {
    const message = await this.messageModel.findById(messageId);
    if (!message) throw new NotFoundException('Message not found');

    if (!message.reactions) {
      message.reactions = new Map();
    }

    const existing = message.reactions.get(emoji) || [];
    if (!existing.includes(userId)) {
      existing.push(userId);
      message.reactions.set(emoji, existing);
      await message.save();
    }

    return { id: messageId, reactions: Object.fromEntries(message.reactions) };
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageModel.findOne({
      _id: new Types.ObjectId(messageId),
      senderId: new Types.ObjectId(userId),
    });
    if (!message) throw new NotFoundException('Message not found or not authorized');

    await this.messageModel.deleteOne({ _id: message._id });
    return { success: true, messageId };
  }

  async getChatParticipants(chatId: string): Promise<string[]> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) return [];
    return chat.participants.map((p) => p.toString());
  }

  async updateUserLastSeen(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      { $set: { lastSeenAt: new Date() } },
    );
  }
}
