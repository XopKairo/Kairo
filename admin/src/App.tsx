import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';
import { useContext, type ReactNode } from 'react';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/users/Users';
import Hosts from './pages/hosts/Hosts';
import Agencies from './pages/agencies/Agencies';
import Economy from './pages/economy/Economy';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import Banners from './pages/banners/Banners';
import Posts from "./pages/posts/Posts";
import MarketingNotifications from './pages/MarketingNotifications';

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const authContext = useContext(AuthContext);
  if (!authContext) return null;
  const { user, loading } = authContext;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 text-gray-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} />
            <Route path="/hosts" element={<ProtectedRoute><Layout><Hosts /></Layout></ProtectedRoute>} />
            <Route path="/agencies" element={<ProtectedRoute><Layout><Agencies /></Layout></ProtectedRoute>} />
            <Route path="/economy" element={<ProtectedRoute><Layout><Economy /></Layout></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
            <Route path="/banners" element={<ProtectedRoute><Layout><Banners /></Layout></ProtectedRoute>} />
            <Route path="/posts" element={<ProtectedRoute><Layout><Posts /></Layout></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Layout><MarketingNotifications /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
