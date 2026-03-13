import { create } from "zustand";

interface MessageStatusState {
  /** messageId -> status (delivered | seen) */
  statusByMessageId: Record<string, string>;
  setStatus: (messageId: string, status: string) => void;
  getStatus: (messageId: string) => string | undefined;
}

export const useMessageStatusStore = create<MessageStatusState>((set, get) => ({
  statusByMessageId: {},

  setStatus: (messageId, status) =>
    set((s) => ({
      statusByMessageId: { ...s.statusByMessageId, [messageId]: status },
    })),

  getStatus: (messageId) => get().statusByMessageId[messageId],
}));
