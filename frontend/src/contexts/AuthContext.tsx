import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../api/auth/types';
import AuthService from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is already authenticated
        if (AuthService.isAuthenticated()) {
          const storedUser = AuthService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            
            // Refresh user data from server in background
            try {
              const freshUser = await AuthService.getProfile();
              setUser(freshUser);
              AuthService.storeUser(freshUser);
            } catch (refreshError) {
              console.warn('Failed to refresh user data:', refreshError);
              // Continue with stored user if refresh fails
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        AuthService.clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Setup token refresh interval
  useEffect(() => {
    if (!AuthService.isAuthenticated()) return;

    const interval = setInterval(async () => {
      try {
        await AuthService.refreshAccessToken();
      } catch (error) {
        console.warn('Token refresh failed:', error);
      }
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [user]);

  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await AuthService.login({ email, password, rememberMe });
      setUser(result.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.message || 'Logout failed');
      // Clear local data anyway
      AuthService.clearAuthData();
      setUser(null);
      window.location.href = '/login';
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const freshUser = await AuthService.getProfile();
      setUser(freshUser);
      AuthService.storeUser(freshUser);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh user data');
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const hasPermission = (permission: string): boolean => {
    return AuthService.hasPermission(user, permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return AuthService.hasAnyPermission(user, permissions);
  };

  const hasRole = (role: string | string[]): boolean => {
    return AuthService.hasRole(user, role as any);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    logout,
    refreshUser,
    clearError,
    hasPermission,
    hasAnyPermission,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export a higher-order component for easier usage
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return function WithAuth(props: P) {
    const auth = useAuthContext();
    return <Component {...props} auth={auth} />;
  };
};