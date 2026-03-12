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
  duration?: number; // In seconds
  replyToId?: string; // ID of the referenced message
  reactions?: Record<string, string[]>; // emoji -> array of userIds
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
    lastMessage: mockMessages['c1']?.[1],
    unreadCount: 0,
  },
  {
    id: 'c2',
    participant: { id: 'u3', phone: '+989000000003', name: 'Sara', avatar: 'https://i.pravatar.cc/150?u=u3' },
    unreadCount: 2,
    lastMessage: { id: 'm3', chatId: 'c2', senderId: 'u3', text: 'Please send the file', type: 'text', createdAt: new Date(Date.now() - 50000).toISOString(), status: 'delivered' }
  },
  { id: 'c3', participant: { id: 'u4', phone: '+989000000004', name: 'Reza', avatar: 'https://i.pravatar.cc/150?u=u4' }, unreadCount: 0 },
  { id: 'c4', participant: { id: 'u5', phone: '+989000000005', name: 'Mina', avatar: 'https://i.pravatar.cc/150?u=u5' }, unreadCount: 0 },
  { id: 'c5', participant: { id: 'u6', phone: '+989000000006', name: 'Omid', avatar: 'https://i.pravatar.cc/150?u=u6' }, unreadCount: 1 },
  { id: 'c6', participant: { id: 'u7', phone: '+989000000007', name: 'Zahra', avatar: 'https://i.pravatar.cc/150?u=u7' }, unreadCount: 0 },
  { id: 'c7', participant: { id: 'u8', phone: '+989000000008', name: 'Hassan', avatar: 'https://i.pravatar.cc/150?u=u8' }, unreadCount: 0 },
  { id: 'c8', participant: { id: 'u9', phone: '+989000000009', name: 'Maryam', avatar: 'https://i.pravatar.cc/150?u=u9' }, unreadCount: 0 },
  { id: 'c9', participant: { id: 'u10', phone: '+989000000010', name: 'Javad', avatar: 'https://i.pravatar.cc/150?u=u10' }, unreadCount: 0 },
  { id: 'c10', participant: { id: 'u11', phone: '+989000000011', name: 'Neda', avatar: 'https://i.pravatar.cc/150?u=u11' }, unreadCount: 0 },
  { id: 'c11', participant: { id: 'u12', phone: '+989000000012', name: 'Saeed', avatar: 'https://i.pravatar.cc/150?u=u12' }, unreadCount: 0 },
  { id: 'c12', participant: { id: 'u13', phone: '+989000000013', name: 'Fatemeh', avatar: 'https://i.pravatar.cc/150?u=u13' }, unreadCount: 0 },
  { id: 'c13', participant: { id: 'u14', phone: '+989000000014', name: 'Hamed', avatar: 'https://i.pravatar.cc/150?u=u14' }, unreadCount: 0 },
];

const mockStories: Story[] = [
  { 
    id: 's1', 
    user: { id: 'u2', phone: '+989000000002', name: 'Ali', avatar: 'https://i.pravatar.cc/150?u=u2' }, 
    hasUnseen: true, 
    imageUrl: '/stories/tech.png',
    caption: 'Great day at work! 🚀',
    timestamp: '2 hours ago'
  },
  { 
    id: 's2', 
    user: { id: 'u3', phone: '+989000000003', name: 'Sara', avatar: 'https://i.pravatar.cc/150?u=u3' }, 
    hasUnseen: true,
    imageUrl: '/stories/nature.png',
    caption: 'Nature is beautiful 🏔️',
    timestamp: '5 hours ago'
  },
  { id: 's3', user: { id: 'u4', phone: '+989000000004', name: 'Reza', avatar: 'https://i.pravatar.cc/150?u=u4' }, hasUnseen: false },
  { id: 's4', user: { id: 'u5', phone: '+989000000005', name: 'Mina', avatar: 'https://i.pravatar.cc/150?u=u5' }, hasUnseen: true },
  { id: 's5', user: { id: 'u6', phone: '+989000000006', name: 'Omid', avatar: 'https://i.pravatar.cc/150?u=u6' }, hasUnseen: false },
  { id: 's6', user: { id: 'u7', phone: '+989000000007', name: 'Zahra', avatar: 'https://i.pravatar.cc/150?u=u7' }, hasUnseen: true },
];

export const chatService = {
  getChats: async (): Promise<Chat[]> => {
    await delay(800);
    return [...mockChats];
  },

  getStories: async (): Promise<Story[]> => {
    await delay(400);
    return [...mockStories];
  },

  getMessages: async (chatId: string): Promise<Message[]> => {
    await delay(500);
    return mockMessages[chatId] || [];
  },

  sendMessage: async (messageData: Omit<Message, 'id' | 'createdAt' | 'status'>): Promise<Message> => {
    await delay(300);
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
