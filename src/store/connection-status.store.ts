import { create } from 'zustand';

export type ConnectionStatus = 'offline' | 'connecting' | 'updating' | 'connected';

interface ConnectionStatusState {
  status: ConnectionStatus;
  setStatus: (status: ConnectionStatus) => void;
}

export const useConnectionStatusStore = create<ConnectionStatusState>((set) => ({
  status: 'connecting',
  setStatus: (status) => set({ status }),
}));
