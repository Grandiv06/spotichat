import { delay } from './auth.service';
import type { User } from './auth.service';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  type: 'text' | 'file' | 'voice' | 'video';
  fileUrl?: string; // For files/voice
  createdAt: string;
  status: 'sending' | 'sent' | 'delivered' | 'seen';
}

export interface Chat {
  id: string;
  participant: User;
  lastMessage?: Message;
  unreadCount: number;
}

// Dummy data
const mockMessages: Record<string, Message[]> = {
  'c1': [
    { id: 'm1', chatId: 'c1', senderId: 'u2', text: 'Hey there!', type: 'text', createdAt: new Date(Date.now() - 3600000).toISOString(), status: 'seen' },
    { id: 'm2', chatId: 'c1', senderId: 'u1', text: 'Hi! How are you?', type: 'text', createdAt: new Date(Date.now() - 3500000).toISOString(), status: 'seen' },
  ],
};

const mockChats: Chat[] = [
  {
    id: 'c1',
    participant: { id: 'u2', phone: '+989000000002', name: 'Ali', username: 'ali_dev', avatar: 'https://i.pravatar.cc/150?u=u2' },
    lastMessage: mockMessages['c1'][1],
    unreadCount: 0,
  },
  {
    id: 'c2',
    participant: { id: 'u3', phone: '+989000000003', name: 'Sara', avatar: 'https://i.pravatar.cc/150?u=u3' },
    unreadCount: 2,
    lastMessage: { id: 'm3', chatId: 'c2', senderId: 'u3', text: 'Please send the file', type: 'text', createdAt: new Date(Date.now() - 50000).toISOString(), status: 'delivered' }
  }
];

export const chatService = {
  getChats: async (): Promise<Chat[]> => {
    await delay(800);
    return [...mockChats];
  },

  getMessages: async (chatId: string): Promise<Message[]> => {
    await delay(500);
    return mockMessages[chatId] || [];
  },

  sendMessage: async (messageData: Omit<Message, 'id' | 'createdAt' | 'status'>): Promise<Message> => {
    await delay(600);
    const newMessage: Message = {
      ...messageData,
      id: `m_${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    
    if (!mockMessages[newMessage.chatId]) {
      mockMessages[newMessage.chatId] = [];
    }
    mockMessages[newMessage.chatId].push(newMessage);
    
    // Simulate mock delivery/read receipts asynchronously
    setTimeout(() => {
      newMessage.status = 'delivered';
      // In a real app, this would trigger a store update/re-render via webhook/websocket
    }, 2000);
    
    return newMessage;
  }
};
