import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import type { User } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData?: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
    } catch {
      // If unauthorized or error, fall back gracefully
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [token]);

  const login = (newToken: string, userData?: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    if (userData) {
      setUser(userData);
    }
    toast.success('Successfully logged in!');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
