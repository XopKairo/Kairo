/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useState, useEffect, type ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
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
        setUser({ id: '1', name: 'Franklin Jr.', role: 'ADMIN', email: 'admin@kleon.com' });
      }
      if (isMounted) setLoading(false);
    };
    initAuth();
    return () => { isMounted = false; };
  }, []);

  const login = async () => {
    localStorage.setItem('token', 'dummy-jwt-token');
    setUser({ id: '1', name: 'Franklin Jr.', role: 'ADMIN', email: 'admin@kleon.com' });
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
