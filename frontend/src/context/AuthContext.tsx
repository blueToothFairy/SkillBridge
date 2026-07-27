'use client';
 
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole, RegisterPayload } from '../types';
import { registerApi, loginApi, getMeApi, updateProfileApi } from '../lib/api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  updateProfile: (profileData: any) => Promise<User>;
  logout: () => void;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fallbackRole, setFallbackRole] = useState<UserRole>('STUDENT');

  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('sb_auth_token') : null;
    if (savedToken) {
      setToken(savedToken);
      getMeApi(savedToken)
        .then((res) => {
          setUser(res.user);
        })
        .catch(() => {
          localStorage.removeItem('sb_auth_token');
          setToken(null);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await loginApi(email, password);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('sb_auth_token', data.token);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const data = await registerApi(payload);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('sb_auth_token', data.token);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: any): Promise<User> => {
    if (!token) {
      throw new Error('Not authenticated');
    }
    const data = await updateProfileApi(token, profileData);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sb_auth_token');
    }
    router.push('/login');
  };

  const activeRole: UserRole = user ? user.role : fallbackRole;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: activeRole,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        updateProfile,
        logout,
        setRole: setFallbackRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
