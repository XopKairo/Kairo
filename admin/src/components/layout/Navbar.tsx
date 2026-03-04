import React from 'react';
import { Bell, Search, User, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Navbar: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
      <div className="flex items-center flex-1 space-x-4">
        <button onClick={onMenuClick} className="lg:hidden p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-brand-50 hover:text-brand-500 transition-colors">
          <Menu size={22} />
        </button>
        
        <div className="hidden md:flex flex-1 max-w-md relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Universal search (⌘K)..." 
            className="w-full bg-slate-50 border-none rounded-2xl py-2.5 pl-12 pr-4 focus:ring-4 focus:ring-brand-500/10 transition-all outline-none text-slate-600 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 lg:space-x-6">
        <button className="relative p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
          <Bell size={22} />
          <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white animate-pulse"></span>
        </button>
        
        <div className="flex items-center space-x-4 pl-4 border-l border-slate-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name || 'Admin'}</p>
            <p className="text-[11px] text-brand-600 font-bold uppercase tracking-wider">{user?.role || 'Moderator'}</p>
          </div>
          <div className="w-11 h-11 bg-gradient-to-tr from-brand-500 to-purple-400 rounded-2xl p-[2px]">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-brand-600 shadow-inner">
              <User size={20} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
