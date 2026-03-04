
import { Bell, MessageSquare, Search, Sun, Moon, ChevronDown, Menu } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useState } from 'react';

export const Topbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { theme, toggleTheme } = useTheme();
  const [lang, setLang] = useState(localStorage.getItem('zora-lang') || 'ENG');

  const toggleLanguage = () => {
    const newLang = lang === 'ENG' ? 'MAL' : 'ENG';
    setLang(newLang);
    localStorage.setItem('zora-lang', newLang);
    window.location.reload();
  };

  return (
    <header className="h-20 bg-white dark:bg-surface-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 sm:px-8 transition-colors duration-200">
      <div className="flex items-center flex-1 max-w-2xl gap-4">
        <button onClick={onMenuClick} className="md:hidden p-2 text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-100 transition-colors">
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search here"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-surface-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 sm:space-x-6">
        <button onClick={toggleLanguage} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          {lang}
        </button>

        <button 
          onClick={toggleTheme}
          className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-surface-100"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors relative rounded-lg hover:bg-gray-50 dark:hover:bg-surface-100 hidden sm:block">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-white dark:border-surface-900"></span>
        </button>

        <button className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors relative rounded-lg hover:bg-gray-50 dark:hover:bg-surface-100 hidden sm:block">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-white dark:border-surface-900"></span>
        </button>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block"></div>

        <button className="flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-surface-100 p-2 rounded-xl transition-colors">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Admin</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Super Admin</p>
          </div>
          <img
            src="https://ui-avatars.com/api/?name=Admin&background=7C3AED&color=fff&rounded=true"
            alt="Profile"
            className="w-10 h-10 rounded-xl object-cover"
          />
          <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
        </button>
      </div>
    </header>
  );
};
