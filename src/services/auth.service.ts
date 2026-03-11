export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface User {
  id: string;
  phone: string;
  name: string;
  username?: string;
  avatar?: string;
  bio?: string;
}

const mockUser: User = {
  id: 'u1',
  phone: '+989123456789',
  name: 'Soroush',
  username: 'soroush',
  avatar: 'https://i.pravatar.cc/150?u=u1',
};

export const authService = {
  // Simulates sending OTP
  sendOtp: async (phone: string): Promise<boolean> => {
    await delay(1000);
    console.log(`Mock OTP sent to ${phone}: 12345`);
    return true; // success
  },

  // Simulates verifying OTP and returning user data
  verifyOtp: async (phone: string, code: string): Promise<User> => {
    await delay(1500);
    if (code === '12345') {
      return { ...mockUser, phone };
    }
    throw new Error('Invalid OTP');
  },
  
  // Simulates checking session
  getCurrentUser: async (): Promise<User | null> => {
    await delay(500);
    // In a real app we'd check tokens. Currently just return null or mock if persisted
    return null;
  }
};
