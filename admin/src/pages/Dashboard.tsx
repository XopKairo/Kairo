
import { Mail, Receipt, Clock, Users, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const data = [
  { name: 'Mon', value: 4000 },
  { name: 'Tue', value: 3000 },
  { name: 'Wed', value: 2000 },
  { name: 'Thu', value: 2780 },
  { name: 'Fri', value: 1890 },
  { name: 'Sat', value: 2390 },
  { name: 'Sun', value: 3490 },
];

const barData = [
  { name: 'Jan', uv: 4000, pv: 2400 },
  { name: 'Feb', uv: 3000, pv: 1398 },
  { name: 'Mar', uv: 2000, pv: 9800 },
  { name: 'Apr', uv: 2780, pv: 3908 },
  { name: 'May', uv: 1890, pv: 4800 },
  { name: 'Jun', uv: 2390, pv: 3800 },
];

export default function Dashboard() {
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
          <button className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20">
            Create New
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Emails', value: '8,642', icon: Mail, trend: '+12.5%', isUp: true, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
          { title: 'Total Invoices', value: '$24,500', icon: Receipt, trend: '+8.2%', isUp: true, color: 'text-brand-500', bg: 'bg-brand-50 dark:bg-brand-500/10' },
          { title: 'Pending Tasks', value: '142', icon: Clock, trend: '-2.4%', isUp: false, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-500/10' },
          { title: 'Active Clients', value: '1,240', icon: Users, trend: '+4.1%', isUp: true, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-500/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-surface-900 rounded-[24px] p-6 shadow-soft border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stat.title}</p>
            <div className={`flex items-center mt-4 text-sm font-medium ${stat.isUp ? 'text-green-500' : 'text-red-500'}`}>
              {stat.isUp ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
              {stat.trend} <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white dark:bg-surface-900 rounded-[24px] p-6 shadow-soft border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Conversion Statistics</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly user engagement and conversion</p>
            </div>
            <select className="bg-gray-50 dark:bg-surface-800 border-none text-sm font-medium rounded-lg px-3 py-2 outline-none cursor-pointer text-gray-700 dark:text-gray-300">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
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
            <button className="text-gray-400 hover:text-brand-500">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="h-[200px] w-full mb-6">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="pv" fill="#7C3AED" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="uv" fill="#F472B6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Subscriptions</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">$12,400</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-pink-400"></div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Direct Sales</span>
              </div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">$8,200</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
