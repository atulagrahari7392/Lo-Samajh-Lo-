import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('lsl_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const { success, error: toastError } = useToast();

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('lsl_token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await api.auth.me();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: any) => {
    try {
      const data = await api.auth.login(credentials);
      if (data.success && data.token) {
        localStorage.setItem('lsl_token', data.token);
        setToken(data.token);
        setUser(data.user);
        success(`Welcome back, ${data.user.name}!`);
      }
    } catch (err: any) {
      toastError(err.message || 'Login failed. Please check credentials.');
      throw err;
    }
  };

  const register = async (formData: any) => {
    try {
      const data = await api.auth.register(formData);
      if (data.success && data.token) {
        localStorage.setItem('lsl_token', data.token);
        setToken(data.token);
        setUser(data.user);
        success(`Account created successfully! Welcome, ${data.user.name}`);
      }
    } catch (err: any) {
      toastError(err.message || 'Registration failed.');
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('lsl_token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
