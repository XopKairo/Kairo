import { useState, useEffect } from 'react';
import { MoreHorizontal, CheckCircle, Edit, Eye, XCircle } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface Host {
  id?: string;
  _id?: string;
  name?: string;
  agency?: string;
  status?: string;
  earnings?: number;
  totalCalls?: number;
  totalMinutes?: number;
  isVerified?: boolean;
  isBoosted?: boolean;
  isBanned?: boolean;
  rankingScore?: number;
  profilePicture?: string;
  verificationSelfie?: string;
}

export default function Hosts() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [editForm, setEditForm] = useState<Partial<Host>>({});

  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banForm, setBanForm] = useState({ reason: '', duration: '1', customDate: '' });

  const fetchHosts = async () => {
    try {
      const response = await apiClient.get('/admin/hosts');
      setHosts(response.data);
    } catch (error: any) {
      console.error('Failed to fetch hosts', error);
    }
  };

  useEffect(() => { fetchHosts(); }, []);

  const toggleMenu = (id: string) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  const handleUpdateHost = async () => {
    if (!editingHost) return;
    try {
      await apiClient.put('/admin/hosts/' + (editingHost._id || editingHost.id), editForm);
      fetchHosts();
      setIsEditModalOpen(false);
    } catch { alert('Failed'); }
  };

  const handleVerify = async (id: string, isVerified: boolean) => {
    try {
      await apiClient.post('/admin/hosts/' + id + '/verify', { isVerified });
      fetchHosts();
      setActiveMenu(null);
    } catch (error: any) {
      console.error('Failed to verify host', error);
      alert('Failed to verify host');
    }
  };

  const handleBanSubmit = async () => {
    if (!editingHost) return;
    const rowId = (editingHost._id || editingHost.id);
    try {
      await apiClient.post('/admin/hosts/' + rowId + '/ban', {
        isBanned: true,
        reason: banForm.reason,
        durationDays: banForm.duration,
        customDate: banForm.duration === 'custom' ? banForm.customDate : undefined
      });
      fetchHosts();
      setIsBanModalOpen(false);
    } catch { alert('Ban failed'); }
  };

  const handleUnban = async (id: string) => {
    try {
      await apiClient.post('/admin/hosts/' + id + '/ban', { isBanned: false });
      fetchHosts();
      setActiveMenu(null);
    } catch (e: any) {
      console.error('Failed to unban host', e);
      alert('Failed to unban host');
    }
  };

  const deleteHost = async (id: string) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this host? This cannot be undone.')) return;
    try {
      await apiClient.delete('/admin/hosts/' + id);
      fetchHosts();
      setActiveMenu(null);
      alert('Host deleted successfully');
    } catch {
      alert('Failed to delete host');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hosts & Verification</h1>

      <div className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-surface-800 text-gray-500 text-sm">
            <tr>
              <th className="p-6">Host</th>
              <th className="p-6 text-center">Calls / Mins</th>
              <th className="p-6 text-center">Earnings</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            {hosts.map(host => {
              const rowId = (host._id || host.id || "").toString();
              return (
                <tr key={rowId}>
                  <td className="p-6 flex items-center gap-3">
                    <img src={host.profilePicture || "https://ui-avatars.com/api/?name="+host.name} className="w-10 h-10 rounded-full" />
                    <div>
                       <span className="font-bold text-gray-900 dark:text-white block">{host.name}</span>
                       <span className="text-[10px] text-gray-400">{host.agency || 'Independent'}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <p className="font-bold">{host.totalCalls || 0}</p>
                    <p className="text-[10px] text-gray-400">{host.totalMinutes || 0} mins</p>
                  </td>
                  <td className="p-6 text-center">
                    <p className="font-black text-brand-600">₹{((host.earnings || 0) * 0.1).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">({host.earnings || 0} coins)</p>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${host.status === 'Online' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {host.status}
                    </span>
                  </td>
                  <td className="p-6 text-right relative">
                    <button onClick={() => window.open(host.verificationSelfie, '_blank')} className="text-blue-500 mr-2 p-2 hover:bg-blue-50 rounded-lg"><Eye size={18}/></button>
                    <button onClick={() => toggleMenu(rowId)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg"><MoreHorizontal /></button>
                    {activeMenu === rowId && (
                      <div className="absolute right-6 top-12 w-48 bg-white dark:bg-surface-800 border rounded-2xl shadow-xl z-50 p-2">
                        <button onClick={() => { setEditingHost(host); setEditForm({...host}); setIsEditModalOpen(true); setActiveMenu(null); }} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex gap-2 text-sm"><Edit size={16}/> Edit Host</button>
                        {host.isVerified ? 
                           <button onClick={() => handleVerify(rowId, false)} className="w-full text-left p-3 hover:bg-orange-50 rounded-xl flex gap-2 text-sm text-orange-600"><XCircle size={16}/> Unverify Host</button> :
                           <button onClick={() => handleVerify(rowId, true)} className="w-full text-left p-3 hover:bg-green-50 rounded-xl flex gap-2 text-sm text-green-600"><CheckCircle size={16}/> Approve</button>
                        }
                        {host.isBanned ?
                           <button onClick={() => handleUnban(rowId)} className="w-full text-left p-3 hover:bg-green-50 rounded-xl flex gap-2 text-sm text-green-600"><CheckCircle size={16}/> Unban Host</button> :
                           <button onClick={() => { setEditingHost(host); setIsBanModalOpen(true); setActiveMenu(null); }} className="w-full text-left p-3 hover:bg-red-50 rounded-xl flex gap-2 text-sm text-red-600"><XCircle size={16}/> Ban Host</button>
                        }
                        <button onClick={() => deleteHost(rowId)} className="w-full text-left p-3 hover:bg-red-50 rounded-xl flex gap-2 text-sm text-red-600 font-bold mt-1 border-t"><XCircle size={16}/> Delete Host</button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[32px] p-8">
            <h2 className="text-xl font-bold mb-6">Edit Host</h2>
            <div className="space-y-4">
              <label className="block text-xs font-bold text-gray-400 uppercase">Host Name</label>
              <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-3 border rounded-xl" />
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl">
                 <input type="checkbox" checked={editForm.isBoosted} onChange={e => setEditForm({...editForm, isBoosted: e.target.checked})} className="w-5 h-5 accent-brand-600" />
                 <span className="text-sm font-bold text-gray-700 dark:text-gray-200">🚀 BOOST HOST</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ranking Score</label>
                <input type="number" value={editForm.rankingScore} onChange={e => setEditForm({...editForm, rankingScore: parseInt(e.target.value) || 0})} className="w-full p-3 border rounded-xl" />
              </div>

              <button onClick={handleUpdateHost} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold">Save Changes</button>
              <button onClick={() => setIsEditModalOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}
      {isBanModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[32px] p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Host Ban</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reason for Ban</label>
                <textarea value={banForm.reason} onChange={e => setBanForm({...banForm, reason: e.target.value})} placeholder="Inappropriate behavior, spam, etc." className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm h-24" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Ban Duration</label>
                <select value={banForm.duration} onChange={e => setBanForm({...banForm, duration: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm mb-3">
                  <option value="1">1 Day</option>
                  <option value="custom">Custom Date</option>
                  <option value="permanent">Permanent</option>
                </select>
                {banForm.duration === 'custom' && (
                  <input type="date" value={banForm.customDate} onChange={e => setBanForm({...banForm, customDate: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm" />
                )}
              </div>
              <button onClick={handleBanSubmit} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 transition-all">Suspend Host</button>
              <button onClick={() => setIsBanModalOpen(false)} className="w-full py-2 text-gray-500 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}