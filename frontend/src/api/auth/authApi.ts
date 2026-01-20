import { api } from '../../api/axiosInstance';
import type { LoginRequest, LoginResponse, RefreshTokenResponse, User } from './types';

export const authApi = {
  // Login user
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return await api.post('/auth/login', credentials);
  },

  // Refresh access token
  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    return await api.post('/auth/refresh', {}, {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
  },

  // Logout user
  logout: async (accessToken: string): Promise<void> => {
    await api.post('/auth/logout', {}, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  // Get user profile
  getProfile: async (): Promise<{ success: boolean; data: User }> => {
    return await api.get('/users/profile');
  },

  // Update user profile
  updateProfile: async (data: {
    full_name?: string;
    phone?: string;
    avatar?: string;
  }): Promise<{ success: boolean; data: User }> => {
    return await api.put('/users/profile', data);
  },

  // Forgot password (basic implementation)
  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    return await api.post('/auth/forgot-password', { email });
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    return await api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
  },
};