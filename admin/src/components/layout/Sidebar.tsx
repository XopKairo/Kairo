
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Mail, MessageSquare, Trello, Users, CalendarDays, Receipt, Settings, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Mail, label: 'Email', path: '/email' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: Trello, label: 'Kanban', path: '/kanban' },
  { icon: Users, label: 'Contact', path: '/contact' },
  { icon: CalendarDays, label: 'Calendar', path: '/calendar' },
  { icon: Receipt, label: 'Invoices', path: '/invoices' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar = () => {
  return (
    <aside className="w-64 h-screen bg-white dark:bg-surface-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-colors duration-200">
      <div className="p-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
          K
        </div>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">Kleon</span>
      </div>

      <div className="px-6 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Main Menu
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive 
                ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-500 font-medium" 
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-brand-600 dark:text-brand-500" : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300"
                )} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-brand-600 dark:text-brand-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 m-4 bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl text-white relative overflow-hidden shadow-soft">
        <div className="relative z-10">
          <h4 className="font-semibold mb-1 text-sm">Increase your work with kanban</h4>
          <p className="text-brand-100 text-xs mb-3">Organize projects clearly.</p>
          <button className="bg-white text-brand-600 text-sm font-medium py-2 px-4 rounded-lg w-full hover:bg-brand-50 transition-colors">
            Try Now
          </button>
        </div>
      </div>
    </aside>
  );
};
