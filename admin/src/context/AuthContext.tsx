/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useState, useEffect, type ReactNode } from 'react';
import apiClient from '../api/apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
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
      if (token && isMounted) {
        // Ideally we should verify token or fetch user profile here
        // For now, keep the dummy user to avoid getting stuck if no /me endpoint
        setUser({ id: '1', name: 'Admin', role: 'ADMIN', email: 'admin@zora.com' });
      }
      if (isMounted) setLoading(false);
    };
    initAuth();
    return () => { isMounted = false; };
  }, []);

  const login = async (credentials: any) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const { accessToken, user } = response.data;
      
      localStorage.setItem('token', accessToken);
      setUser(user);
    } catch (error) {
      console.error("Login failed", error);
      throw new Error("Invalid admin credentials");
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
