
import { Bell, MessageSquare, Search, Sun, Moon, ChevronDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const Topbar = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-20 bg-white dark:bg-surface-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 transition-colors duration-200">
      <div className="flex items-center flex-1 max-w-2xl">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search here"
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-surface-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow dark:text-white"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          ENG
        </button>

        <button 
          onClick={toggleTheme}
          className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-surface-100"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors relative rounded-lg hover:bg-gray-50 dark:hover:bg-surface-100">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-pink-500 rounded-full border-2 border-white dark:border-surface-900"></span>
        </button>

        <button className="p-2 text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors relative rounded-lg hover:bg-gray-50 dark:hover:bg-surface-100">
          <MessageSquare className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-white dark:border-surface-900"></span>
        </button>

        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

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
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </header>
  );
};
