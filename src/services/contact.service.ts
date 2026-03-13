import { apiFetch } from '@/lib/api';
import type { User } from './auth.service';

export const contactService = {
  searchUsers: async (query: string): Promise<User[]> => {
    if (!query || query.length < 2) return [];
    return apiFetch(`/users/search?q=${encodeURIComponent(query)}`);
  },

  getContacts: async (): Promise<any[]> => {
    return apiFetch('/contacts');
  },

  addContact: async (phone: string): Promise<User> => {
    return apiFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  },

  addContactByUserId: async (userId: string, customName?: string): Promise<any> => {
    return apiFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify({ userId, customName }),
    });
  },

  removeContact: async (contactId: string): Promise<void> => {
    await apiFetch(`/contacts/${contactId}`, { method: 'DELETE' });
  },
};
