import { delay } from './auth.service';
import type { User } from './auth.service';

const mockUsersDatabase: User[] = [
  { id: 'u2', phone: '+989000000002', name: 'Ali', username: 'ali_dev', avatar: 'https://i.pravatar.cc/150?u=u2' },
  { id: 'u3', phone: '+989000000003', name: 'Sara', avatar: 'https://i.pravatar.cc/150?u=u3' },
  { id: 'u4', phone: '+989000000004', name: 'Reza', username: 'reza123', avatar: 'https://i.pravatar.cc/150?u=u4' },
];

export const contactService = {
  searchUsers: async (query: string): Promise<User[]> => {
    await delay(600);
    if (!query) return [];
    
    const lowercaseQuery = query.toLowerCase();
    return mockUsersDatabase.filter(u => 
      u.username?.toLowerCase().includes(lowercaseQuery) || 
      u.id.toLowerCase() === lowercaseQuery ||
      u.phone.includes(lowercaseQuery)
    );
  },

  addContact: async (phone: string): Promise<User> => {
    await delay(1000);
    const user = mockUsersDatabase.find(u => u.phone === phone);
    if (user) {
      return user;
    }
    throw new Error('User not found');
  }
};
