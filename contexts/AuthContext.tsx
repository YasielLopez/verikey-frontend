import { AuthAPI, TokenManager, User } from '@/services/api';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setIsLoading(true);
      const token = await TokenManager.getToken();
      
      if (token) {
        try {
          const response = await AuthAPI.verifyToken();
          if (response && response.user) {
            setUser(response.user);
            setIsAuthenticated(true);
            console.log('✅ Auth state restored from token');
          } else {
            throw new Error('Invalid token response');
          }
        } catch (tokenError) {
          console.log('Token verification failed, attempting refresh...');
          const refreshSuccess = await refreshToken();
          if (!refreshSuccess) {
            throw new Error('Token refresh failed');
          }
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('Auth state check failed:', error);
      await TokenManager.removeToken();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const { ProfileAPI } = await import('@/services/api');
      const userData = await ProfileAPI.getProfile();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setUser({
        id: 0,
        email: '',
        profile_completed: false,
        created_at: new Date().toISOString()
      } as User);
      setIsAuthenticated(true);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await AuthAPI.refreshToken();
      if (response && response.token) {
        await TokenManager.saveToken(response.token);
        if (response.user) {
          setUser(response.user);
          setIsAuthenticated(true);
        }
        console.log('✅ Token refreshed successfully');
        return true;
      }
      throw new Error('No token in refresh response');
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      return false;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await AuthAPI.login({ email, password });
      if (response && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        console.log('✅ Login successful');
      } else {
        throw new Error('Invalid login response');
      }
    } catch (error) {
      console.error('Login failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await AuthAPI.signup({ email, password });
      if (response && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
        console.log('✅ Signup successful');
      } else {
        throw new Error('Invalid signup response');
      }
    } catch (error) {
      console.error('Signup failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await AuthAPI.logout();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await TokenManager.removeToken();
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    refreshUser,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};