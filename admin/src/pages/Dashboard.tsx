import { useState, useEffect } from 'react';
import { Receipt, Users, PhoneCall, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import apiClient from '../api/apiClient';

interface LiveCall {
  _id: string;
  callId: string;
  user: { name: string; phone: string; profilePicture?: string };
  host: { name: string; hostId: string; profilePicture?: string };
  duration: number;
  startTime: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([]);
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsersToday: 0,
    totalCalls: 0,
    totalTransactions: 0,
    verifiedHosts: 0,
    pendingPayouts: 0,
    totalReports: 0,
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

  const fetchLiveCalls = async () => {
    try {
      const res = await apiClient.get('/admin/dashboard/live-calls');
      setLiveCalls(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Live calls fetch failed');
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          apiClient.get('/admin/dashboard/stats'),
          apiClient.get('/admin/dashboard/analytics')
        ]);
        setStats(statsRes.data);
        setAnalytics(analyticsRes.data);
        fetchLiveCalls();
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Check backend connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchLiveCalls, 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleForceEnd = async (callId: string) => {
    if (!window.confirm('Are you sure you want to force terminate this call?')) return;
    try {
      await apiClient.post('/admin/calls/force-end', { callId });
      fetchLiveCalls();
    } catch (e) {
      alert('Failed to end call');
    }
  };

  const areaData = analytics.labels.map((label, index) => ({
    name: label,
    value: analytics.userGrowth[index] || 0
  }));

  const barData = analytics.labels.map((label, index) => ({
    name: label,
    revenue: analytics.revenueData[index] || 0
  }));

  if (loading) return <div className="p-8 text-gray-500 font-bold animate-pulse">SUPREME CONTROL LOADING...</div>;
  if (error) return <div className="p-8 text-red-600 font-black">{error}</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1 uppercase tracking-tighter">Command Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">Kairo Supreme Architectural Control Dashboard</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-green-50 text-green-600 text-[10px] font-black rounded-xl border border-green-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            SYSTEM LIVE
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Users', value: stats.totalUsers, icon: Users, trend: 'Active: ' + stats.activeUsersToday, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { title: 'Total Revenue', value: stats.totalRevenue, icon: Receipt, trend: 'Daily: ' + stats.dailyRevenue, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-500/10' },
          { title: 'Verified Hosts', value: stats.verifiedHosts, icon: Users, trend: 'Calls: ' + stats.totalCalls, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
          { title: 'Reports', value: stats.totalReports, icon: ShieldAlert, trend: 'Action required', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-surface-900 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">{stat.value}</h3>
            <p className="text-xs text-gray-400 font-black uppercase tracking-widest">{stat.title}</p>
            <div className="flex items-center mt-4 text-[10px] font-black uppercase tracking-wider text-gray-400">
              {stat.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Live Monitoring Section */}
      <div className="bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Live Monitor</h3>
            </div>
            <span className="px-4 py-1.5 bg-red-50 text-red-600 text-[10px] font-black rounded-full border border-red-100 uppercase tracking-widest">
              {liveCalls.length} ACTIVE CALLS
            </span>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-800">
                   <tr>
                      <th className="p-4">Host</th>
                      <th className="p-4">User</th>
                      <th className="p-4 text-center">Duration</th>
                      <th className="p-4 text-right">Supreme Control</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                   {liveCalls.length === 0 ? (
                     <tr><td colSpan={4} className="p-16 text-center text-gray-300 font-black uppercase tracking-widest italic">Zero Active Sessions</td></tr>
                   ) : (
                     liveCalls.map(call => (
                       <tr key={call._id} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors">
                          <td className="p-4">
                             <div className="flex items-center gap-3">
                                <img src={call.host.profilePicture || `https://ui-avatars.com/api/?name=${call.host.name}`} className="w-10 h-10 rounded-full object-cover border-2 border-brand-100" />
                                <div>
                                   <p className="font-bold text-gray-900 dark:text-white text-sm">{call.host.name}</p>
                                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">ID: {call.host.hostId}</p>
                                </div>
                             </div>
                          </td>
                          <td className="p-4">
                             <div className="flex items-center gap-3">
                                <img src={call.user.profilePicture || `https://ui-avatars.com/api/?name=${call.user.name}`} className="w-10 h-10 rounded-full object-cover border-2 border-blue-100" />
                                <div>
                                   <p className="font-bold text-gray-900 dark:text-white text-sm">{call.user.name}</p>
                                   <p className="text-[10px] text-gray-400 font-bold">{call.user.phone}</p>
                                </div>
                             </div>
                          </td>
                          <td className="p-4 text-center">
                             <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-500/10 rounded-lg">
                                <PhoneCall size={12} className="text-green-600 animate-pulse" />
                                <span className="font-mono text-sm font-black text-green-700 dark:text-green-400">
                                   {Math.floor(call.duration / 60)}:{(call.duration % 60).toString().padStart(2, '0')}
                                </span>
                             </div>
                          </td>
                          <td className="p-4 text-right">
                             <button 
                               onClick={() => handleForceEnd(call.callId)}
                               className="px-5 py-2.5 bg-red-600 text-white text-[10px] font-black rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 uppercase tracking-widest"
                             >
                               TERMINATE SESSION
                             </button>
                          </td>
                       </tr>
                     ))
                   )}
                </tbody>
             </table>
          </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { title: 'Server CPU', value: stats.system?.cpuUsage, color: 'text-blue-500' },
          { title: 'Server RAM', value: stats.system?.memoryUsage, color: 'text-purple-500' },
          { title: 'Uptime', value: stats.system?.uptime, color: 'text-orange-500' },
          { title: 'DB Engine', value: stats.system?.dbStatus, color: stats.system?.dbStatus === 'Healthy' ? 'text-green-500' : 'text-red-500' },
        ].map((sys, i) => (
          <div key={i} className="bg-white dark:bg-surface-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{sys.title}</p>
            <p className={`text-xl font-black ${sys.color}`}>{sys.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest">User Growth</h3>
              <p className="text-xs text-gray-400 font-bold">Monthly Registration Analytics</p>
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="value" stroke="#7C3AED" strokeWidth={4} fillOpacity={1} fill="url(#colorBrand)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest mb-8">Revenue Logic</h3>
          <div className="h-[250px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold'}} />
                <Bar dataKey="revenue" fill="#7C3AED" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
