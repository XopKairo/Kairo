import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, 
  PhoneCall, 
  IndianRupee, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'https://kairo-b1i9.onrender.com/api';
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${API_URL}/admin/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Stats fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-8">Loading Dashboard...</div>;

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
      <div className={`p-4 rounded-lg ${color} mr-4 text-white`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          title="Total Users" 
          value={stats?.totalUsers || 0} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Active Today" 
          value={stats?.activeUsersToday || 0} 
          icon={TrendingUp} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Live Calls" 
          value={stats?.totalCalls || 0} 
          icon={PhoneCall} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Total Revenue" 
          value={stats?.totalRevenue || '₹0'} 
          icon={IndianRupee} 
          color="bg-orange-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-blue-500" />
            System Health
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Database Status</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">STABLE</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Socket.io Server</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">CONNECTED</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Redis Cache</span>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Pending Actions</h2>
          <p className="text-gray-500 text-sm">Review withdrawal requests and reported content.</p>
          <div className="mt-4 space-y-3">
             <div className="p-3 border-l-4 border-orange-500 bg-orange-50 rounded-r-lg">
                <p className="text-sm font-medium text-orange-800">{stats?.pendingPayouts || 0} Pending Payouts</p>
                <p className="text-xs text-orange-600 mt-1">Require manual verification and approval.</p>
             </div>
             <div className="p-3 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
                <p className="text-sm font-medium text-red-800">12 Reported Users</p>
                <p className="text-xs text-red-600 mt-1">Immediate action recommended.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
