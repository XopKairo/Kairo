
import { useState, useEffect } from 'react';
import { Receipt, Clock, Users } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import apiClient from '../api/apiClient';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsersToday: 0,
    totalCalls: 0,
    totalTransactions: 0,
    verifiedHosts: 0,
    pendingPayouts: 0,
    dailyRevenue: '₹0',
    totalRevenue: '₹0',
    retentionRate: '0%',
    peakHours: [],
    system: {
      cpuUsage: '0%',
      memoryUsage: '0%',
      uptime: '0h',
      dbStatus: 'Healthy'
    }
  });
  
  const [analytics, setAnalytics] = useState({
    labels: [],
    userGrowth: [],
    revenueData: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          apiClient.get('/admin/dashboard/stats'),
          apiClient.get('/admin/dashboard/analytics')
        ]);
        setStats(statsRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Check backend connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const areaData = analytics.labels.map((label, index) => ({
    name: label,
    value: analytics.userGrowth[index] || 0
  }));

  const barData = analytics.labels.map((label, index) => ({
    name: label,
    revenue: analytics.revenueData[index] || 0
  }));

  if (loading) return <div className="p-8 text-gray-500 font-medium text-lg">Loading dashboard metrics...</div>;
  if (error) return <div className="p-8 text-red-500 font-medium text-lg">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, Admin! Here's your overview.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-surface-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors shadow-sm">
            Download Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Users', value: stats.totalUsers, icon: Users, trend: 'Active: ' + stats.activeUsersToday, isUp: true, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { title: 'Total Revenue', value: stats.totalRevenue, icon: Receipt, trend: 'Daily: ' + stats.dailyRevenue, isUp: true, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-500/10' },
          { title: 'Verified Hosts', value: stats.verifiedHosts, icon: Users, trend: 'Calls: ' + stats.totalCalls, isUp: true, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
          { title: 'Pending Payouts', value: stats.pendingPayouts, icon: Clock, trend: 'Requests pending', isUp: false, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
          { title: 'Retention Rate', value: stats.retentionRate, icon: Users, trend: 'Last 7 Days', isUp: true, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-surface-900 rounded-[24px] p-6 shadow-soft border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.title}</p>
            <div className={`flex items-center mt-4 text-sm font-medium text-gray-500 dark:text-gray-400`}>
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { title: 'Server CPU', value: stats.system?.cpuUsage, color: 'text-blue-500' },
          { title: 'Server RAM', value: stats.system?.memoryUsage, color: 'text-purple-500' },
          { title: 'Server Uptime', value: stats.system?.uptime, color: 'text-orange-500' },
          { title: 'Database', value: stats.system?.dbStatus, color: stats.system?.dbStatus === 'Healthy' ? 'text-green-500' : 'text-red-500' },
        ].map((sys, i) => (
          <div key={i} className="bg-white dark:bg-surface-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{sys.title}</p>
            <p className={`text-lg font-black ${sys.color}`}>{sys.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white dark:bg-surface-900 rounded-[24px] p-6 shadow-soft border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">User Growth</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly registered users</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBrand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)' }}
                  cursor={{stroke: '#7C3AED', strokeWidth: 1, strokeDasharray: '3 3'}}
                />
                <Area type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorBrand)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-900 rounded-[24px] p-6 shadow-soft border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Revenue Sources</h3>
          </div>
          <div className="h-[200px] w-full mb-6">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-900 rounded-[24px] p-6 shadow-soft border border-gray-100 dark:border-gray-800 lg:col-span-3">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Peak Usage Hours (24h)</h3>
          <div className="h-[200px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.peakHours.map((h: { _id: number; count: number }) => ({ hour: `${h._id}h`, count: h.count }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-800" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10}} />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
