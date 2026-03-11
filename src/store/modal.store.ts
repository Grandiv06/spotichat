import { create } from 'zustand';

interface ModalState {
  isProfileOpen: boolean;
  isAddContactOpen: boolean;
  isSearchOpen: boolean;
  isCreateGroupOpen: boolean;
  isCreateChannelOpen: boolean;
  setProfileOpen: (isOpen: boolean) => void;
  setAddContactOpen: (isOpen: boolean) => void;
  setSearchOpen: (isOpen: boolean) => void;
  setCreateGroupOpen: (isOpen: boolean) => void;
  setCreateChannelOpen: (isOpen: boolean) => void;
  closeAll: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isProfileOpen: false,
  isAddContactOpen: false,
  isSearchOpen: false,
  isCreateGroupOpen: false,
  isCreateChannelOpen: false,
  setProfileOpen: (isOpen) => set({ isProfileOpen: isOpen }),
  setAddContactOpen: (isOpen) => set({ isAddContactOpen: isOpen }),
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
  setCreateGroupOpen: (isOpen) => set({ isCreateGroupOpen: isOpen }),
  setCreateChannelOpen: (isOpen) => set({ isCreateChannelOpen: isOpen }),
  closeAll: () => set({ 
    isProfileOpen: false, 
    isAddContactOpen: false, 
    isSearchOpen: false,
    isCreateGroupOpen: false,
    isCreateChannelOpen: false
  }),
}));
