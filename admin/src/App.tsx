import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Kanban from './pages/apps/Kanban';
import Invoices from './pages/apps/Invoices';
import Calendar from './pages/apps/Calendar';
import EmailContact from './pages/apps/EmailContact';
import Chat from './pages/apps/Chat';
import Settings from './pages/apps/Settings';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/email" element={<EmailContact />} />
              <Route path="/contact" element={<Navigate to="/email" replace />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/settings" element={<Settings />} />
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
