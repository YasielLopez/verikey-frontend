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

  const isAuthenticated = !!user;

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await TokenManager.getToken();
      if (token) {
        // Verify token is still valid
        await AuthAPI.verifyToken();
        // If valid, fetch user profile
        await refreshUser();
      }
    } catch (error) {
      console.log('Token invalid or expired:', error);
      await TokenManager.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const { ProfileAPI } = await import('@/services/api');
      const userData = await ProfileAPI.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Don't throw here - user might not have completed profile yet
      setUser({ 
        id: 0, 
        email: '', 
        profile_completed: false, 
        created_at: new Date().toISOString() 
      } as User);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await AuthAPI.login({ email, password });
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const response = await AuthAPI.signup({ email, password });
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Still remove user from state even if API call fails
      setUser(null);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};