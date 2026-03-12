import { create } from 'zustand';

export type SettingsView =
  | 'main'
  | 'profile'
  | 'contacts'
  | 'notifications'
  | 'privacy'
  | 'privacy-phone-number'
  | 'privacy-last-seen'
  | 'privacy-profile-photo'
  | 'devices'
  | 'storage'
  | 'help'
  | 'logout';

interface SettingsState {
  isOpen: boolean;
  activeView: SettingsView;
  viewHistory: SettingsView[];
  
  // Actions
  setOpen: (isOpen: boolean) => void;
  navigate: (view: SettingsView) => void;
  goBack: () => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isOpen: false,
  activeView: 'main',
  viewHistory: [],
  
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
    
  reset: () => set({ activeView: 'main', viewHistory: [] })
}));
