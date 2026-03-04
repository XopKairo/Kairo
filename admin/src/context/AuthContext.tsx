import React, { createContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MODERATOR';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (_credentials: any) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ id: '1', name: 'Alex Zora', role: 'ADMIN', email: 'admin@zora.com' });
    }
    setLoading(false);
  }, []);

  const login = async (_credentials: any) => {
    localStorage.setItem('token', 'dummy-jwt-token');
    setUser({ id: '1', name: 'Alex Zora', role: 'ADMIN', email: 'admin@zora.com' });
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
