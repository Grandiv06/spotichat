import { apiFetch, setTokens, clearTokens } from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

export interface User {
  id: string;
  phone: string;
  name: string;
  username?: string;
  avatar?: string;
  bio?: string;
  lastSeenAt?: string;
}

export const authService = {
  sendOtp: async (phone: string): Promise<boolean> => {
    await apiFetch('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    return true;
  },

  verifyOtp: async (phone: string, code: string): Promise<User> => {
    const data = await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone,
        code,
        deviceName: navigator.userAgent.slice(0, 50),
        platform: navigator.platform,
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' :
                 navigator.userAgent.includes('Firefox') ? 'Firefox' :
                 navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
      }),
    });

    // Store tokens
    setTokens(data.accessToken, data.refreshToken);

    // Connect WebSocket after login
    connectSocket();

    return data.user;
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const user = await apiFetch('/users/me');
      connectSocket();
      return user;
    } catch {
      return null;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', body: JSON.stringify({}) });
    } catch {
      // ignore
    }
    disconnectSocket();
    clearTokens();
  },

  updateProfile: async (data: { name?: string; username?: string; bio?: string }): Promise<User> => {
    return apiFetch('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiFetch('/users/me/avatar', {
      method: 'POST',
      body: formData,
    });
  },
};
