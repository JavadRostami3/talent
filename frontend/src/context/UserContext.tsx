import React, { createContext, useContext, useState, useEffect } from 'react';
import { userService, StudentProfile } from '@/services/userService';
import { useAuth } from './AuthContext';

interface UserContextType {
  profile: StudentProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  submitApplication: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const refreshProfile = async () => {
    if (!isAuthenticated || user?.role !== 'student') return;
    
    setLoading(true);
    try {
      const data = await userService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    const updated = await userService.updateProfile(data);
    setProfile(updated);
  };

  const submitApplication = async () => {
    const updated = await userService.submitApplication();
    setProfile(updated);
  };

  useEffect(() => {
    refreshProfile();
  }, [isAuthenticated, user]);

  const value = {
    profile,
    loading,
    refreshProfile,
    updateProfile,
    submitApplication,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
