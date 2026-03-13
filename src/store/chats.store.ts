import { create } from 'zustand';
import type { Chat, Message } from '@/services/chat.service';

interface ChatsState {
  chats: Chat[];
  unreadByChatId: Record<string, number>;
  setChats: (chats: Chat[]) => void;
  updateLastMessage: (chatId: string, lastMessage: Message) => void;
  addUnread: (chatId: string, count?: number) => void;
  clearUnread: (chatId: string) => void;
  getUnreadCount: (chatId: string) => number;
}

export const useChatsStore = create<ChatsState>((set, get) => ({
  chats: [],
  unreadByChatId: {},

  setChats: (chats) => set({ chats }),

  updateLastMessage: (chatId, lastMessage) =>
    set((s) => {
      const updated = s.chats.map((c) =>
        c.id === chatId ? { ...c, lastMessage } : c,
      );
      updated.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return bTime - aTime;
      });
      return { chats: updated };
    }),

  addUnread: (chatId, count = 1) =>
    set((s) => ({
      unreadByChatId: {
        ...s.unreadByChatId,
        [chatId]: (s.unreadByChatId[chatId] ?? 0) + count,
      },
    })),

  clearUnread: (chatId) =>
    set((s) => {
      const next = { ...s.unreadByChatId };
      delete next[chatId];
      return { unreadByChatId: next };
    }),

  getUnreadCount: (chatId) => get().unreadByChatId[chatId] ?? 0,
}));
