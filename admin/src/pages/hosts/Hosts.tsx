import { useState, useEffect } from 'react';
import { Search, MoreHorizontal, CheckCircle, Trash2, Edit, Eye } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface Host {
  id?: string;
  _id?: string;
  name?: string;
  agency?: string;
  status?: string;
  isVerified?: boolean;
  calls?: number;
  revenue?: string;
  profilePicture?: string;
  verificationSelfie?: string;
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
    setActiveMenu(activeMenu === id ? null : id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await apiClient.delete('/admin/hosts/' + id);
      setHosts(hosts.filter(h => (h._id || h.id) !== id));
    } catch (error) {
      alert('Failed');
    }
  };

  const handleVerify = async (id: string, isVerified: boolean) => {
    try {
      await apiClient.post('/admin/hosts/' + id + '/verify', { isVerified });
      fetchHosts();
      setActiveMenu(null);
    } catch (error) {
      alert('Failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Hosts & Verification</h1>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search hosts..." className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-surface-800 rounded-xl text-sm outline-none dark:text-white" />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-surface-800/50 text-gray-500 dark:text-gray-400 text-sm font-medium">
                <th className="py-4 px-6">Host Name</th>
                <th className="py-4 px-6">Agency</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {loading ? (
                <tr><td colSpan={4} className="py-4 text-center">Loading...</td></tr>
              ) : hosts.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center">No hosts found.</td></tr>
              ) : hosts.map((host) => {
                const rowId = (host._id || host.id || "").toString();
                return (
                  <tr key={rowId} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <img src={host.profilePicture || "https://ui-avatars.com/api/?name="+host.name} className="w-8 h-8 rounded-full" />
                      <span className="font-medium text-gray-900 dark:text-white">{host.name || 'Unknown'}</span>
                    </td>
                    <td className="py-4 px-6">{host.agency || 'None'}</td>
                    <td className="py-4 px-6">
                      <span className={"px-3 py-1 rounded-full text-xs font-medium " + (host.isVerified ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600")}>
                        {host.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right flex justify-end gap-2 relative">
                      {host.verificationSelfie && (
                        <button onClick={() => window.open(host.verificationSelfie, "_blank")} className="text-blue-500 hover:text-blue-600" title="View Selfie">
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                      {!host.isVerified && (
                        <button onClick={() => handleVerify(rowId, true)} className="text-green-500 hover:text-green-600"><CheckCircle className="w-5 h-5" /></button>
                      )}
                      <button onClick={() => toggleMenu(rowId)} className="text-gray-400 p-1"><MoreHorizontal className="w-5 h-5" /></button>
                      {activeMenu === rowId && (
                        <div className="absolute right-8 top-10 w-40 bg-white dark:bg-surface-800 rounded-xl shadow-lg border p-2 z-20">
                          <button className="w-full text-left px-4 py-2 flex items-center gap-2"><Edit className="w-4 h-4" /> Edit</button>
                          <button onClick={() => handleDelete(rowId)} className="w-full text-left px-4 py-2 text-red-600 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}