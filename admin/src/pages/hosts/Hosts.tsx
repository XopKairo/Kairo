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

  const removeHostRole = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this host role? The user account will remain active, but they will no longer be a host.')) return;
    try {
      await apiClient.delete('/admin/hosts/' + id);
      fetchHosts();
      setActiveMenu(null);
      alert('Host role removed');
    } catch {
      alert('Failed to remove host role');
    }
  };

  const deletePermanently = async (id: string) => {
    if (!window.confirm('WARNING: This will PERMANENTLY DELETE the user account and all data. This cannot be undone. Proceed?')) return;
    try {
      await apiClient.delete('/admin/delete-permanent/' + id);
      fetchHosts();
      setActiveMenu(null);
      alert('User and Host permanently deleted');
    } catch {
      alert('Failed to delete permanently');
    }
  };

  return (
    <div className="space-y-6 pb-40">
      <h1 className="text-2xl font-bold">Hosts & Verification</h1>

      <div className="bg-white dark:bg-surface-900 rounded-[32px] shadow-sm overflow-x-auto border border-gray-100 dark:border-surface-800">
        <table className="w-full text-left min-w-[900px]">
          <thead className="bg-gray-50 dark:bg-surface-800 text-gray-500 text-sm">
            <tr>
              <th className="p-6">Host</th>
              <th className="p-6 text-center">Calls / Mins</th>
              <th className="p-6 text-center">Earnings</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm relative">
            {hosts.map((host, index) => {
              const rowId = (host._id || host.id || "").toString();
              const isLastRows = index > hosts.length - 4;
              return (
                <tr key={rowId} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="p-6 flex items-center gap-3">
                    <img src={host.profilePicture || "https://ui-avatars.com/api/?name="+host.name} className="w-10 h-10 rounded-full border-2 border-brand-50" />
                    <div className="min-w-0 flex-1">
                       <span className="font-bold text-gray-900 dark:text-white block truncate">{host.name}</span>
                       <span className="text-[10px] text-gray-400 font-medium">{host.agency || 'Independent'}</span>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <p className="font-bold text-gray-900 dark:text-white">{host.totalCalls || 0}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{host.totalMinutes || 0} mins</p>
                  </td>
                  <td className="p-6 text-center">
                    <p className="font-black text-brand-600">₹{((host.earnings || 0) * 0.1).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 font-medium">({host.earnings || 0} coins)</p>
                  </td>
                  <td className="p-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${host.status === 'Online' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {host.status}
                    </span>
                  </td>
                  <td className="p-6 text-right relative overflow-visible">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => window.open(host.verificationSelfie, '_blank')} 
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors"
                        title="View Selfie"
                      >
                        <Eye size={18}/>
                      </button>
                      <button 
                        onClick={() => toggleMenu(rowId)} 
                        className={`p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-xl transition-colors ${activeMenu === rowId ? 'bg-gray-100 dark:bg-surface-800' : ''}`}
                      >
                        <MoreHorizontal size={20} />
                      </button>
                    </div>

                    {activeMenu === rowId && (
                      <div className={`absolute right-6 ${isLastRows ? 'bottom-full mb-2' : 'top-full mt-2'} w-52 bg-white dark:bg-surface-800 border border-gray-100 dark:border-surface-700 rounded-2xl shadow-2xl z-[100] p-2 ring-1 ring-black/5`}>
                        <button onClick={() => { setEditingHost(host); setEditForm({...host}); setIsEditModalOpen(true); setActiveMenu(null); }} className="w-full text-left p-3 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl flex gap-3 text-sm font-semibold transition-colors"><Edit size={16} className="text-brand-500"/> Edit Host</button>
                        
                        <div className="h-px bg-gray-100 dark:bg-surface-700 my-1 mx-2" />

                        {host.isVerified ? 
                           <button onClick={() => handleVerify(rowId, false)} className="w-full text-left p-3 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl flex gap-3 text-sm text-orange-600 font-semibold transition-colors"><XCircle size={16}/> Unverify Host</button> :
                           <button onClick={() => handleVerify(rowId, true)} className="w-full text-left p-3 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-xl flex gap-3 text-sm text-green-600 font-semibold transition-colors"><CheckCircle size={16}/> Approve Host</button>
                        }

                        {host.isBanned ?
                           <button onClick={() => handleUnban(rowId)} className="w-full text-left p-3 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-xl flex gap-3 text-sm text-green-600 font-semibold transition-colors"><CheckCircle size={16}/> Unban Host</button> :
                           <button onClick={() => { setEditingHost(host); setIsBanModalOpen(true); setActiveMenu(null); }} className="w-full text-left p-3 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl flex gap-3 text-sm text-red-600 font-semibold transition-colors"><XCircle size={16}/> Ban Host</button>
                        }

                        <div className="h-px bg-gray-100 dark:bg-surface-700 my-1 mx-2" />
                        
                        <button onClick={() => removeHostRole(rowId)} className="w-full text-left p-3 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl flex gap-3 text-sm text-red-600 font-bold transition-colors"><XCircle size={16}/> Remove Host Role</button>
                        
                        <button onClick={() => deletePermanently(rowId)} className="w-full text-left p-3 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl flex gap-3 text-sm text-red-800 font-black transition-colors"><Trash2 size={16}/> PERMANENT DELETE</button>
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