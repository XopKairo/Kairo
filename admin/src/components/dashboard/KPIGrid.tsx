import React from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '../../utils/cn';

const stats = [
  { label: 'Total Users', value: '24,512', change: '+12%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Active Listings', value: '1,843', change: '+5.4%', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Total Revenue', value: '$84,230', change: '+18%', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Avg. Growth', value: '24.8%', change: '+2%', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
];

export const KPIGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {stats.map((s, index) => (
        <motion.div 
          key={s.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-soft hover:shadow-xl hover:shadow-brand-500/5 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className={cn("p-3.5 rounded-2xl group-hover:scale-110 transition-transform duration-300", s.bg)}>
              <s.icon className={s.color} size={24} />
            </div>
            <div className="flex items-center space-x-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-xs font-bold">
              <TrendingUp size={14} />
              <span>{s.change}</span>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{s.label}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1 tracking-tight">{s.value}</h3>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
