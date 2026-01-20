import { authApi } from '../api/auth/authApi';
import type { LoginRequest, LoginCredentials, User, UserRole } from '../api/auth/types';
import { AUTH_CONFIG } from '../config/api.config';

export class AuthService {
  // Validate AASTU email
  static validateAASTUEmail(email: string): boolean {
    const regex = /^[^\s@]+@(aastu\.edu\.et|aastustudent\.edu\.et)$/;
    return regex.test(email);
  }

  // Store tokens in localStorage
  static storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
  }

  // Store user data
  static storeUser(user: User): void {
    localStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
  }

  // Get stored tokens
  static getStoredTokens(): { accessToken: string | null; refreshToken: string | null } {
    const accessToken = localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    const refreshToken = localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    return { accessToken, refreshToken };
  }

  // Get stored user
  static getStoredUser(): User | null {
    const userStr = localStorage.getItem(AUTH_CONFIG.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Clear all auth data
  static clearAuthData(): void {
    localStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
  }

  // Check if user has permission
  static hasPermission(user: User | null, permission: string): boolean {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin' && user.permissions.includes('*')) {
      return true;
    }
    
    return user.permissions.includes(permission);
  }

  // Check if user has any of the permissions
  static hasAnyPermission(user: User | null, permissions: string[]): boolean {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === 'admin' && user.permissions.includes('*')) {
      return true;
    }
    
    return permissions.some(permission => user.permissions.includes(permission));
  }

  // Check if user has role
  static hasRole(user: User | null, role: UserRole | UserRole[]): boolean {
    if (!user) return false;
    
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    
    return user.role === role;
  }

  // Login with credentials
  static async login(credentials: LoginCredentials): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    // Validate AASTU email
    if (!this.validateAASTUEmail(credentials.email)) {
      throw new Error('Please use an AASTU email address (@aastu.edu.et or @aastustudent.edu.et)');
    }

    const requestData: LoginRequest = {
      email: credentials.email,
      password: credentials.password,
      device_id: `web-${navigator.userAgent.slice(0, 50)}`,
    };

    const response = await authApi.login(requestData);
    
    if (!response.success) {
      throw new Error('Login failed. Please check your credentials.');
    }

    const { user, access_token, refresh_token } = response.data;

    // Store tokens and user
    this.storeTokens(access_token, refresh_token);
    this.storeUser(user);

    return { user, accessToken: access_token, refreshToken: refresh_token };
  }

  // Logout
  static async logout(): Promise<void> {
    const { accessToken } = this.getStoredTokens();
    
    if (accessToken) {
      try {
        await authApi.logout(accessToken);
      } catch (error) {
        console.warn('Logout API call failed, clearing local data anyway:', error);
      }
    }
    
    this.clearAuthData();
  }

  // Refresh token
  static async refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = this.getStoredTokens();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await authApi.refreshToken(refreshToken);
    
    if (!response.success) {
      throw new Error('Failed to refresh token');
    }

    const { access_token, refresh_token } = response.data;
    
    // Update stored tokens
    this.storeTokens(access_token, refresh_token);
    
    return { accessToken: access_token, refreshToken: refresh_token };
  }

  // Get user profile (with refresh if needed)
  static async getProfile(): Promise<User> {
    try {
      const response = await authApi.getProfile();
      return response.data;
    } catch (error: any) {
      if (error.code === 'AUTH_002') {
        // Token expired, try to refresh
        await this.refreshAccessToken();
        const response = await authApi.getProfile();
        return response.data;
      }
      throw error;
    }
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const { accessToken } = this.getStoredTokens();
    const user = this.getStoredUser();
    
    return !!(accessToken && user);
  }

  // Get current user role
  static getCurrentUserRole(): UserRole | null {
    const user = this.getStoredUser();
    return user?.role || null;
  }

  // Validate password strength
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default AuthService;