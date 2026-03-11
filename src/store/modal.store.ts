import { create } from 'zustand';

interface ModalState {
  isProfileOpen: boolean;
  isAddContactOpen: boolean;
  isSearchOpen: boolean;
  setProfileOpen: (isOpen: boolean) => void;
  setAddContactOpen: (isOpen: boolean) => void;
  setSearchOpen: (isOpen: boolean) => void;
  closeAll: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isProfileOpen: false,
  isAddContactOpen: false,
  isSearchOpen: false,
  setProfileOpen: (isOpen) => set({ isProfileOpen: isOpen }),
  setAddContactOpen: (isOpen) => set({ isAddContactOpen: isOpen }),
  setSearchOpen: (isOpen) => set({ isSearchOpen: isOpen }),
  closeAll: () => set({ isProfileOpen: false, isAddContactOpen: false, isSearchOpen: false }),
}));
