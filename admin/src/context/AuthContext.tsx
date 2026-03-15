/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../api/apiClient';

interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  role: 'Super Admin' | 'Moderator' | 'Finance Manager' | 'ADMIN' | 'MODERATOR' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: Record<string, string>) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await apiClient.get('/admin/auth/me');
          if (isMounted) {
            setUser(response.data.user);
          }
        } catch (error) {
          console.error("Token verification failed", error);
          localStorage.removeItem('token');
          if (isMounted) setUser(null);
        }
      }
      if (isMounted) setLoading(false);
    };
    initAuth();
    return () => { isMounted = false; };
  }, []);

  const login = async (credentials: Record<string, string>) => {
    try {
      const response = await apiClient.post('/admin/auth/login', credentials);
      const { accessToken, user } = response.data;
      
      localStorage.setItem('token', accessToken);
      setUser(user);
    } catch (error) {
      console.error("Login failed", error);
      throw error; // Throw the exact axios error up to the component
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
