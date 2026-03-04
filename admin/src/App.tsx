import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';

// Simple Login Component
const Login = () => {
  const { login } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API Login
    setTimeout(() => {
      login('mock-jwt-token', { name: 'Admin', email: 'admin@kairo.com' });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-2xl w-96">
        <h1 className="text-2xl font-bold text-center mb-6">Kairo Admin Access</h1>
        <div className="space-y-4">
          <input type="email" placeholder="Email" defaultValue="admin@kairo.com" className="w-full p-3 border rounded-lg" required />
          <input type="password" placeholder="Password" defaultValue="Ajil6304admin" className="w-full p-3 border rounded-lg" required />
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
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
