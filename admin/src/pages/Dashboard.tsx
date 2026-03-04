import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/common/Card';
import { KPIGrid } from '../components/dashboard/KPIGrid';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { Table } from '../components/common/Table';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Hi, {user?.name?.split(' ')[0] || 'Admin'} <span className="wave">👋</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-lg">Zora business summary at a glance.</p>
        </div>
        <div className="flex space-x-3">
          <button className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all">Download Report</button>
          <button className="bg-brand-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-brand-600 shadow-lg shadow-brand-500/20 transition-all">+ New Listing</button>
        </div>
      </header>

      <KPIGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card title="Revenue Growth" className="lg:col-span-2 hover:shadow-xl hover:shadow-brand-500/5 transition-all">
          <div className="h-[380px] w-full">
            <RevenueChart />
          </div>
        </Card>

        <Card title="System Activity" className="lg:col-span-1 overflow-hidden relative">
          <div className="space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div 
                key={i} 
                whileHover={{ x: 5 }}
                className="flex items-center space-x-4 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-500 font-bold text-xs border border-brand-100">
                  Z{i}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">New user verified</p>
                  <p className="text-xs text-slate-500 font-medium">User #00{i} identity check success</p>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Just now</span>
              </motion.div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </Card>
      </div>

      <Card title="Real-time Transactions">
        <Table 
          headers={['Order ID', 'Customer', 'Status', 'Revenue']}
          data={[
            [<span className="font-bold text-slate-900">#9021</span>, 'Liam Neeson', <Badge variant="success">Paid</Badge>, <span className="font-semibold text-slate-900">$1,200</span>],
            [<span className="font-bold text-slate-900">#9022</span>, 'Emma Watson', <Badge variant="warning">Pending</Badge>, <span className="font-semibold text-slate-900">$450</span>],
            [<span className="font-bold text-slate-900">#9023</span>, 'Zoe Kravitz', <Badge variant="danger">Refunded</Badge>, <span className="font-semibold text-slate-900">$85</span>]
          ]}
        />
      </Card>
    </motion.div>
  );
};

export default Dashboard;
