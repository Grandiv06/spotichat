import { create } from 'zustand';

interface OnlineState {
  onlineUserIds: Set<string>;
  setOnline: (ids: string[]) => void;
  addOnline: (userId: string) => void;
  removeOnline: (userId: string) => void;
  isOnline: (userId: string) => boolean;
}

export const useOnlineStore = create<OnlineState>((set, get) => ({
  onlineUserIds: new Set(),
  setOnline: (ids) => set({ onlineUserIds: new Set(ids) }),
  addOnline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUserIds);
      next.add(userId);
      return { onlineUserIds: next };
    }),
  removeOnline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUserIds);
      next.delete(userId);
      return { onlineUserIds: next };
    }),
  isOnline: (userId) => get().onlineUserIds.has(userId),
}));
