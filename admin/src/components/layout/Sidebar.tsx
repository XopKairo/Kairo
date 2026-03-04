import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { 
  LayoutDashboard, Users, ShoppingBag, 
  CreditCard, BarChart3, Settings, 
  LogOut, X 
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Users', path: '/users' },
  { icon: ShoppingBag, label: 'Listings', path: '/listings' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const sidebarVariants = {
    open: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 300, damping: 30 } }
  } as const;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        variants={sidebarVariants}
        animate={isOpen ? 'open' : 'closed'}
        initial="closed"
        className={cn(
          "fixed inset-y-0 left-0 w-72 bg-slate-950 text-slate-300 z-50 lg:static lg:translate-x-0 flex flex-col shadow-2xl shadow-brand-500/10",
          "lg:block" 
        )}
      >
        <div className="p-8 flex items-center justify-between border-b border-white/5">
          <span className="text-2xl font-bold text-white tracking-tight">ZORA<span className="text-brand-500">.</span></span>
          <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 hover:bg-white/5 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink 
              key={item.label} 
              to={item.path} 
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center p-3.5 rounded-xl transition-all duration-200 group relative",
                isActive 
                  ? "bg-brand-500 text-white shadow-lg shadow-brand-500/25 font-semibold" 
                  : "hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={22} className="min-w-[22px]" />
              <span className="ml-4">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <button className="flex items-center w-full p-3.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-medium group">
            <LogOut size={22} className="group-hover:translate-x-1 transition-transform" />
            <span className="ml-4">Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
};
