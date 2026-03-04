import { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, CheckCircle, XCircle } from 'lucide-react';

interface Host {
  id: string;
  name: string;
  agency: string;
  status: string;
  calls: number;
  revenue: string;
}

export default function Hosts() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        setHosts([
          { id: '1', name: 'Alice Wonderland', agency: 'Star Agency', status: 'Pending Verification', calls: 0, revenue: '$0' },
          { id: '2', name: 'Bob Builder', agency: 'None', status: 'Verified', calls: 120, revenue: '$1,200' },
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching hosts:', error);
        setLoading(false);
      }
    };
    fetchHosts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Hosts & Verification</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage host profiles and verify requests.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search hosts..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-surface-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow dark:text-white border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-surface-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-surface-800/50 text-gray-500 dark:text-gray-400 text-sm font-medium">
                <th className="py-4 px-6 font-medium">Host Name</th>
                <th className="py-4 px-6 font-medium">Agency</th>
                <th className="py-4 px-6 font-medium">Total Calls</th>
                <th className="py-4 px-6 font-medium">Revenue</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {loading ? (
                <tr><td colSpan={6} className="py-4 text-center text-gray-500">Loading...</td></tr>
              ) : hosts.map((host) => (
                <tr key={host.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{host.name}</td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{host.agency}</td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{host.calls}</td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{host.revenue}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${host.status === 'Verified' ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'}`}>
                      {host.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right flex justify-end gap-2">
                    {host.status === 'Pending Verification' && (
                      <>
                        <button className="text-green-500 hover:text-green-600 transition-colors" title="Approve">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button className="text-red-500 hover:text-red-600 transition-colors" title="Reject">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button className="text-gray-400 hover:text-brand-500 transition-colors">
                      <MoreHorizontal className="w-5 h-5" />
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
