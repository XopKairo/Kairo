import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

const API_URL = import.meta.env.VITE_API_URL || 'https://kairo-b1i9.onrender.com/api';

const Login = () => {
  const { login } = useAuth();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('Ajil6304admin');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_URL}/auth/admin/login`, { username, password });
      if (response.data.success) {
        login(response.data.accessToken, response.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-2xl w-96">
        <h1 className="text-2xl font-bold text-center mb-6">Kairo Admin Access</h1>
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm font-medium">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              required 
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/login" />;

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
          <Route path="/users" element={<ProtectedLayout><div className="p-8">Users Management Coming Soon</div></ProtectedLayout>} />
          <Route path="/reports" element={<ProtectedLayout><div className="p-8">Reports Management Coming Soon</div></ProtectedLayout>} />
          <Route path="/economy/coins" element={<ProtectedLayout><div className="p-8">Coin Packages Management Coming Soon</div></ProtectedLayout>} />
          <Route path="/economy/gifts" element={<ProtectedLayout><div className="p-8">Gifts Management Coming Soon</div></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><div className="p-8">Settings Coming Soon</div></ProtectedLayout>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
