import { apiFetch } from '@/lib/api';

export interface BlockedUserItem {
  id: string;
  name?: string;
  username?: string;
  avatar?: string;
}

export const settingsService = {
  getBlockedUsers: async (): Promise<BlockedUserItem[]> => {
    return apiFetch('/blocked-users');
  },

  blockUser: async (targetUserId: string): Promise<void> => {
    await apiFetch(`/blocked-users/${targetUserId}`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  unblockUser: async (targetUserId: string): Promise<void> => {
    await apiFetch(`/blocked-users/${targetUserId}`, {
      method: 'DELETE',
    });
  },
};
