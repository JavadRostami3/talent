import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import type { User, LoginResponse } from '@/types/models';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (nationalId: string, trackingCode: string) => Promise<LoginResponse>;
  adminLogin: (nationalId: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const login = async (nationalId: string, trackingCode: string): Promise<LoginResponse> => {
    const response = await authService.login(nationalId, trackingCode);
    setUser(response.user);
    return response;
  };

  const adminLogin = async (nationalId: string, password: string): Promise<LoginResponse> => {
    const response = await authService.adminLogin(nationalId, password);
    setUser(response.user);
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    adminLogin,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
