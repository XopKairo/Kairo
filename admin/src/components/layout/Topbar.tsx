import { Bell, MessageSquare, Sun, Moon, ChevronDown, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

export const Topbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { theme, toggleTheme } = useTheme();
  const [lang, setLang] = useState(localStorage.getItem('zora-lang') || 'ENG');
  const [stats, setStats] = useState({ payouts: 0, messages: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get('/admin/dashboard/stats');
        // Bell icon: pendingPayouts
        // Message icon: reports (if any) + totalTransactions (as placeholder for purchases)
        setStats({
          payouts: res.data.pendingPayouts || 0,
          messages: (res.data.totalReports || 0) // Placeholder logic
        });
      } catch (e) {}
    };
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const toggleLanguage = () => {
    const newLang = lang === 'ENG' ? 'MAL' : 'ENG';
    setLang(newLang);
    localStorage.setItem('zora-lang', newLang);
    window.location.reload();
  };

  return (
    <header className="h-20 bg-white dark:bg-surface-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 transition-colors duration-200">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="md:hidden p-2 text-gray-500 rounded-xl hover:bg-gray-50">
          <Menu className="w-6 h-6" />
        </button>
        <h2 className="font-bold text-gray-800 dark:text-white hidden sm:block">ZORA ADMIN</h2>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        <button onClick={toggleLanguage} className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-300">
          {lang}
        </button>

        <button onClick={toggleTheme} className="p-2 text-gray-400 rounded-lg hover:bg-gray-50">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Bell Icon - Withdrawal Requests */}
        <button className="p-2 text-gray-400 relative rounded-lg hover:bg-gray-50">
          <Bell className="w-5 h-5" />
          {stats.payouts > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center bg-pink-500 text-[10px] text-white font-bold rounded-full border-2 border-white dark:border-surface-900">
              {stats.payouts}
            </span>
          )}
        </button>

        {/* Message Icon - Purchases & Reports */}
        <button className="p-2 text-gray-400 relative rounded-lg hover:bg-gray-50">
          <MessageSquare className="w-5 h-5" />
          {stats.messages > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center bg-brand-500 text-[10px] text-white font-bold rounded-full border-2 border-white dark:border-surface-900">
              {stats.messages}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

        <button className="flex items-center space-x-2 p-1 sm:p-2 rounded-xl hover:bg-gray-50">
          <img src="https://ui-avatars.com/api/?name=Admin&background=7C3AED&color=fff" alt="P" className="w-8 h-8 rounded-lg" />
          <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
        </button>
      </div>
    </header>
  );
}