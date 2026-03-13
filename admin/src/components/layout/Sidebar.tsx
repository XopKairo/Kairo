import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, UserCheck, Building2, Wallet, Flag, Settings, Image, ChevronRight, Bell, CreditCard, Video, History, ShieldAlert, Crown, Trash2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Users", path: "/users" },
  { icon: UserCheck, label: "Approved Hosts", path: "/hosts" },
  { icon: ShieldAlert, label: "Verification Requests", path: "/verification" },
  { icon: Building2, label: "Agencies", path: "/agencies" },
  { icon: Wallet, label: "Economy", path: "/economy" },
  { icon: Crown, label: "VIP & Coupons", path: "/vip-coupons" },
  { icon: Video, label: "Active Calls", path: "/calls" },
  { icon: ShieldAlert, label: "Call Monitoring", path: "/monitoring" },
  { icon: CreditCard, label: "Payout Requests", path: "/payouts" },
  { icon: Bell, label: "Marketing Push", path: "/notifications" },
  { icon: Flag, label: "Reports", path: "/reports" },
  { icon: Image, label: "Banners", path: "/banners" },
  { icon: History, label: "Audit Logs", path: "/audit-logs" },
  { icon: Trash2, label: "Deletion Requests", path: "/deletion-requests" },
  { icon: ShieldAlert, label: "Security Blacklist", path: "/blacklist" },
  { icon: Settings, label: "App Settings", path: "/settings" },
];

export const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (val: boolean) => void }) => {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 dark:bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 h-screen bg-white dark:bg-surface-900 border-r border-gray-100 dark:border-gray-800 flex flex-col transition-transform duration-300 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      <div className="p-6 flex items-center space-x-3">
        <img src="/zora.png" alt="Zora Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-brand-500/20" />
        <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Zora</span>
      </div>
      <div className="px-6 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Menu</div>
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} onClick={() => setIsOpen(false)} className={({ isActive }) => cn(
              "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              isActive ? "bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-500 font-medium" : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-800/50 hover:text-gray-900 dark:hover:text-white"
            )}>
            {({ isActive }) => (<>
                <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-brand-600 dark:text-brand-500" : "text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300")} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-brand-600 dark:text-brand-500" />}
              </>)}
          </NavLink>
        ))}
      </nav>
    </aside>
    </>
  );
};