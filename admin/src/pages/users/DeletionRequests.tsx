import { useState, useEffect } from 'react';
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface DeletedUser {
  _id: string;
  name: string;
  phone: string;
  gender: string;
  coins: number;
  deletionRequestedAt: string;
  profilePicture?: string;
}

export default function DeletionRequests() {
  const [users, setUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await apiClient.get('/admin/deletion-requests');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleRestore = async (id: string) => {
    if (!window.confirm('Restore this user account?')) return;
    try {
      await apiClient.post(`/admin/restore-user/${id}`);
      fetchRequests();
      alert('User restored successfully');
    } catch { alert('Restore failed'); }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('WARNING: This will PERMANENTLY PURGE all user data from Kairo OS. This cannot be undone. Proceed?')) return;
    try {
      await apiClient.delete(`/admin/delete-permanent/${id}`);
      fetchRequests();
      alert('User purged from system');
    } catch { alert('Purge failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Deletion Requests</h1>
          <p className="text-sm text-gray-500">Users who requested account deletion. Review before purging.</p>
        </div>
        <div className="px-4 py-2 bg-red-50 text-red-600 text-xs font-black rounded-full border border-red-100">
          {users.length} REQUESTS PENDING
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-surface-800/50 text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="p-6">User Details</th>
                <th className="p-6">Requested On</th>
                <th className="p-6">Wallet Balance</th>
                <th className="p-6 text-right">Supreme Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-400 font-bold animate-pulse">SCANNING DATABASE...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="p-16 text-center text-gray-400 font-black uppercase tracking-widest italic">No Deletion Requests</td></tr>
              ) : users.map(u => (
                <tr key={u._id} className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <img src={u.profilePicture || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-10 h-10 rounded-xl border border-gray-100 dark:border-gray-700 grayscale" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white leading-tight">{u.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-sm">
                    <p className="font-medium text-gray-600 dark:text-gray-300">{new Date(u.deletionRequestedAt).toLocaleDateString()}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{new Date(u.deletionRequestedAt).toLocaleTimeString()}</p>
                  </td>
                  <td className="p-6 text-sm">
                    <p className="font-bold text-gray-900 dark:text-white">{u.coins} <span className="text-[10px] text-gray-400 font-bold">COINS</span></p>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleRestore(u._id)}
                        className="p-2.5 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-all border border-green-100"
                        title="Restore Account"
                      >
                        <RotateCcw size={18}/>
                      </button>
                      <button 
                        onClick={() => handlePermanentDelete(u._id)}
                        className="p-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                        title="Permanent Purge"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-6 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-[24px] flex items-start gap-4">
         <AlertTriangle className="text-orange-500 w-6 h-6 mt-1" />
         <div>
            <h4 className="font-bold text-orange-800 dark:text-orange-400">Supreme Retention Policy</h4>
            <p className="text-sm text-orange-700 dark:text-orange-500/80 mt-1 leading-relaxed">
               When a user deletes their account from the app, they are moved to this list. As an Admin, you should review their wallet balance and history before performing a <span className="font-bold underline">Permanent Purge</span>. A purge will surgically remove every digital footprint from the Kairo OS engine.
            </p>
         </div>
      </div>
    </div>
  );
}
