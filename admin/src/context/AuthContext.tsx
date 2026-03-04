import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAdmin: boolean;
  adminData: any;
  login: (token: string, data: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const data = localStorage.getItem('adminData');
    if (token && data) {
      setIsAdmin(true);
      setAdminData(JSON.parse(data));
    }
  }, []);

  const login = (token: string, data: any) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminData', JSON.stringify(data));
    setIsAdmin(true);
    setAdminData(data);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setIsAdmin(false);
    setAdminData(null);
  };

  return (
    <AuthContext.Provider value={{ isAdmin, adminData, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
