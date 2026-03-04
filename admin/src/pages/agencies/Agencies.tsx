import { useState, useEffect } from 'react';
import { Search, MoreHorizontal, Plus } from 'lucide-react';

interface Agency {
  id: string;
  name: string;
  code: string;
  hosts: number;
  revenue: string;
  status: string;
}

export default function Agencies() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        setAgencies([
          { id: '1', name: 'Star Agency', code: 'STAR', hosts: 45, revenue: '$12,500', status: 'Active' },
          { id: '2', name: 'Moonlight Models', code: 'MOON', hosts: 12, revenue: '$3,200', status: 'Active' },
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching agencies:', error);
        setLoading(false);
      }
    };
    fetchAgencies();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Agencies</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage agency partners and their hosts.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20">
          <Plus className="w-4 h-4" />
          Add Agency
        </button>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search agencies..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-surface-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow dark:text-white border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-surface-800/50 text-gray-500 dark:text-gray-400 text-sm font-medium">
                <th className="py-4 px-6 font-medium">Agency Name</th>
                <th className="py-4 px-6 font-medium">Code</th>
                <th className="py-4 px-6 font-medium">Hosts</th>
                <th className="py-4 px-6 font-medium">Total Revenue</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {loading ? (
                <tr><td colSpan={6} className="py-4 text-center text-gray-500">Loading...</td></tr>
              ) : agencies.map((agency) => (
                <tr key={agency.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{agency.name}</td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300 font-mono">{agency.code}</td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{agency.hosts}</td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{agency.revenue}</td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                      {agency.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-gray-400 hover:text-brand-500 transition-colors">
                      <MoreHorizontal className="w-5 h-5 ml-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
