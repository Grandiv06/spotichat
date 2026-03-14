import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { MessageSoundId } from '@/lib/notification-sound';

export type SettingsView =
  | 'main'
  | 'profile'
  | 'contacts'
  | 'notifications'
  | 'privacy'
  | 'privacy-phone-number'
  | 'privacy-last-seen'
  | 'privacy-profile-photo'
  | 'privacy-contacts-picker'
  | 'privacy-blocked-users'
  | 'devices'
  | 'storage'
  | 'help'
  | 'logout';

interface SettingsState {
  isOpen: boolean;
  activeView: SettingsView;
  viewHistory: SettingsView[];
  messageSound: MessageSoundId;
  muteAllChats: boolean;
  mutedChatIds: Record<string, true>;
  
  // Actions
  setOpen: (isOpen: boolean) => void;
  navigate: (view: SettingsView) => void;
  goBack: () => void;
  reset: () => void;
  setMessageSound: (soundId: MessageSoundId) => void;
  setMuteAllChats: (muted: boolean) => void;
  setChatMuted: (chatId: string, muted: boolean) => void;
  isChatMuted: (chatId: string) => boolean;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      activeView: 'main',
      viewHistory: [],
      messageSound: 'telegram',
      muteAllChats: false,
      mutedChatIds: {},
      
      setOpen: (isOpen) => {
        if (isOpen) {
          set({ isOpen: true });
        } else {
          // Close and reset view after a small delay to allow animation to complete
          set({ isOpen: false });
          setTimeout(() => {
            set({ activeView: 'main', viewHistory: [] });
          }, 300);
        }
      },
      
      navigate: (view) => 
        set((state) => ({ 
          activeView: view, 
          viewHistory: [...state.viewHistory, state.activeView] 
        })),
        
      goBack: () => 
        set((state) => {
          const newHistory = [...state.viewHistory];
          const previousView = newHistory.pop() || 'main';
          return { 
            activeView: previousView, 
            viewHistory: newHistory 
          };
        }),
        
      reset: () => set({ activeView: 'main', viewHistory: [] }),

      setMessageSound: (soundId) => set({ messageSound: soundId }),

      setMuteAllChats: (muted) => set({ muteAllChats: muted }),

      setChatMuted: (chatId, muted) =>
        set((state) => {
          const next = { ...state.mutedChatIds };
          if (muted) next[chatId] = true;
          else delete next[chatId];
          return { mutedChatIds: next };
        }),

      isChatMuted: (chatId) => !!get().mutedChatIds[chatId],
    }),
    {
      name: 'spotichat:settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        messageSound: state.messageSound,
        muteAllChats: state.muteAllChats,
        mutedChatIds: state.mutedChatIds,
      }),
    },
  ),
);
