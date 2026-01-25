import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

type AppRole = 'agent' | 'business_owner' | 'admin';

interface Profile {
  id: string; // Keeping 'id' for compatibility, mapped from _id
  _id: string;
  name: string;
  email: string;
  role: AppRole;
  mobile_number?: string;
  token?: string;
}

interface AuthContextType {
  user: Profile | null; // User and Profile are essentially the same now
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, mobileNumber?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

import { api } from '@/lib/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // api utility automatically attaches token from localStorage
          const data = await api.get('/auth/me');
          const userProfile = { ...data, id: data._id, token };
          setUser(userProfile);
          setProfile(userProfile);
        } catch (error) {
          console.error('Failed to load user', error);
          localStorage.removeItem('token');
          setUser(null);
          setProfile(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    mobileNumber?: string
  ) => {
    try {
      const data = await api.post('/auth/signup', {
          email,
          password,
          name,
          mobile_number: mobileNumber,
      });

      localStorage.setItem('token', data.token);
      const userProfile = { ...data, id: data._id };
      setUser(userProfile);
      setProfile(userProfile);

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.post('/auth/login', {
          email,
          password,
      });

      localStorage.setItem('token', data.token);
      const userProfile = { ...data, id: data._id };
      setUser(userProfile);
      setProfile(userProfile);

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = async () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
