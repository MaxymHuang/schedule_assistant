import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiClient } from '../api/client';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async () => {
    try {
      const userProfile = await apiClient.getCurrentUser();
      setUser(userProfile);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Token might be invalid, clear it
      localStorage.removeItem('token');
      setToken(null);
      apiClient.setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check for stored token on app load
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Set token in API client
      apiClient.setToken(storedToken);
      // Fetch user profile
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [fetchUserProfile]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiClient.login(email, password);
      
      // Store token
      localStorage.setItem('token', response.access_token);
      setToken(response.access_token);
      apiClient.setToken(response.access_token);
      
      // Fetch user profile
      await fetchUserProfile();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      await apiClient.register(email, password, fullName);
      
      // After successful registration, automatically log in
      await login(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    apiClient.setToken(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
