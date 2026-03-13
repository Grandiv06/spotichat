import { apiFetch } from '@/lib/api';
import { emitSocket, onSocketEvent } from '@/lib/socket';
import type { User } from './auth.service';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  type: 'text' | 'file' | 'voice' | 'video';
  fileUrl?: string;
  createdAt: string;
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  duration?: number;
  replyToId?: string;
  reactions?: Record<string, string[]>;
}

export interface Chat {
  id: string;
  participant: User;
  lastMessage?: Message;
  unreadCount: number;
}

export interface Story {
  id: string;
  user: User;
  hasUnseen: boolean;
  imageUrl?: string;
  caption?: string;
  timestamp?: string;
}

// Keep mock stories for now (stories not in backend yet)
const mockStories: Story[] = [
  {
    id: 's1',
    user: { id: 'u2', phone: '+989000000002', name: 'Ali', avatar: 'https://i.pravatar.cc/150?u=u2' },
    hasUnseen: true,
    imageUrl: '/stories/tech.png',
    caption: 'Great day at work! 🚀',
    timestamp: '2 hours ago',
  },
  {
    id: 's2',
    user: { id: 'u3', phone: '+989000000003', name: 'Sara', avatar: 'https://i.pravatar.cc/150?u=u3' },
    hasUnseen: true,
    imageUrl: '/stories/nature.png',
    caption: 'Nature is beautiful 🏔️',
    timestamp: '5 hours ago',
  },
];

export const chatService = {
  getChats: async (): Promise<Chat[]> => {
    return apiFetch('/chats');
  },

  getStories: async (): Promise<Story[]> => {
    // Stories are not backed by API yet — return mock
    return [...mockStories];
  },

  getMessages: async (chatId: string, page = 1, limit = 50): Promise<Message[]> => {
    return apiFetch(`/chats/${chatId}/messages?page=${page}&limit=${limit}`);
  },

  sendMessage: async (messageData: Omit<Message, 'id' | 'createdAt' | 'status'>): Promise<Message> => {
    const wsPayload = {
      chatId: messageData.chatId,
      text: messageData.text,
      type: messageData.type,
      fileUrl: messageData.fileUrl,
      duration: messageData.duration,
      replyToId: messageData.replyToId,
    };

    const restFallback = () =>
      apiFetch(`/chats/${messageData.chatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          text: messageData.text,
          type: messageData.type,
          replyToId: messageData.replyToId,
        }),
      });

    try {
      const result = await Promise.race([
        emitSocket('message:send', wsPayload),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Socket timeout')), 4000),
        ),
      ]);
      if (result?.success && result.message) {
        return result.message;
      }
    } catch {
      // Fall through to REST
    }

    return restFallback();
  },

  sendMediaMessage: async (
    chatId: string,
    file: Blob,
    type: 'voice' | 'video' | 'file',
    duration?: number,
  ): Promise<Message> => {
    const formData = new FormData();
    formData.append('file', file, `${type}_${Date.now()}.${type === 'voice' ? 'webm' : 'webm'}`);
    formData.append('type', type);
    if (duration) formData.append('duration', String(duration));
    return apiFetch(`/chats/${chatId}/messages/media`, {
      method: 'POST',
      body: formData,
    });
  },

  startChat: async (otherUserId: string): Promise<string> => {
    const result = await apiFetch('/chats/start', {
      method: 'POST',
      body: JSON.stringify({ otherUserId }),
    });
    return result.chatId;
  },

  markDelivered: (messageId: string) => {
    emitSocket('message:delivered', { messageId });
  },

  markSeen: (messageId: string) => {
    emitSocket('message:seen', { messageId });
  },

  onNewMessage: (callback: (message: Message) => void) => {
    return onSocketEvent('message:new', callback);
  },

  onMessageStatus: (callback: (data: { id: string; chatId: string; status: string }) => void) => {
    return onSocketEvent('message:status', callback);
  },

  onTypingStart: (callback: (data: { chatId: string; userId: string }) => void) => {
    return onSocketEvent('typing:start', callback);
  },

  onTypingStop: (callback: (data: { chatId: string; userId: string }) => void) => {
    return onSocketEvent('typing:stop', callback);
  },

  startTyping: (chatId: string) => {
    emitSocket('typing:start', { chatId });
  },

  stopTyping: (chatId: string) => {
    emitSocket('typing:stop', { chatId });
  },

  onUserOnline: (callback: (data: { userId: string }) => void) => {
    return onSocketEvent('user:online', callback);
  },

  onUserOffline: (callback: (data: { userId: string }) => void) => {
    return onSocketEvent('user:offline', callback);
  },
};
