import { useState, useEffect } from 'react';
import { Search, Eye, MoreHorizontal, CheckCircle, XCircle, Trash2, Edit } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface Host {
  profilePicture?: string;
  verificationSelfie?: string;
  id?: string;
  _id?: string;
  name?: string;
  agency?: string;
  status?: string;
  isVerified?: boolean;
  calls?: number;
  revenue?: string;
}

export default function Hosts() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const fetchHosts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/hosts');
      setHosts(response.data);
    } catch (error) {
      console.error('Error fetching hosts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHosts();
  }, []);

  const toggleMenu = (id: string) => {
    if (activeMenu === id) {
      setActiveMenu(null);
    } else {
      setActiveMenu(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this host?')) return;
    try {
      await apiClient.delete(`/admin/hosts/${id}`);
      setHosts(hosts.filter(h => (h._id || h.id) !== id));
      setActiveMenu(null);
    } catch (error) {
      alert('Failed to delete host');
    }
  };

  const handleVerify = async (id: string, isVerified: boolean) => {
    try {
      await apiClient.post(`/admin/hosts/${id}/verify`, { isVerified });
      fetchHosts();
      setActiveMenu(null);
    } catch (error) {
      alert('Failed to update verification status');
    }
  };

  const handleAction = (action: string, id: string) => {
    if (action === 'Delete') {
      handleDelete(id);
    } else {
      alert(`Action: ${action} on Host ID: ${id}`);
    }
    setActiveMenu(null);
  };

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
        </div>

        <div className="overflow-x-auto min-h-[300px]">
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
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm relative">
              {loading ? (
                <tr><td colSpan={6} className="py-4 text-center text-gray-500">Loading hosts...</td></tr>
              ) : hosts.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">No hosts found.</td></tr>
              ) : hosts.map((host) => {
                const rowId = host._id || host.id || Math.random().toString();
                return (
                <tr key={rowId} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{host.name || 'Unknown'}</td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{host.agency || 'None'}</td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{host.calls || 0}</td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{host.revenue || '$0'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${host.isVerified ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'}`}>
                      {host.isVerified ? 'Verified' : (host.status || 'Pending')}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right flex justify-end gap-2 relative">
                    {!host.isVerified && (
                      <>
                        <button 
                          onClick={() => handleVerify(rowId, true)}
                          className="text-green-500 hover:text-green-600 transition-colors" 
                          title="View Selfie" onClick={() => window.open(host.verificationSelfie, "_blank")} className="text-blue-500 hover:text-blue-600 mr-2"><Eye className="w-5 h-5" /></button><button onClick={() => handleVerify(rowId, true)} className="text-green-500 hover:text-green-600 transition-colors" title="Approve"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(rowId)}
                          className="text-red-500 hover:text-red-600 transition-colors" 
                          title="Reject"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                    <button onClick={() => toggleMenu(rowId)} className="text-gray-400 hover:text-brand-500 transition-colors p-1 relative z-10">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {activeMenu === rowId && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)}></div>
                        <div className="absolute right-8 top-10 w-40 bg-white dark:bg-surface-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-20 overflow-hidden">
                          <button onClick={() => handleAction('Edit', rowId)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-surface-700 flex items-center gap-2">
                            <Edit className="w-4 h-4" /> Edit Profile
                          </button>
                          <button onClick={() => handleAction('Delete', rowId)} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Delete Host
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
