import { useState, useEffect, useCallback } from 'react';
import { MoreHorizontal, ShieldBan, Trash2, Edit, X, Save, UserCheck, UserPlus, Search, Receipt, Filter } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface User {
  _id: string;
  name: string;
  phone: string;
  gender: string;
  age?: number;
  location?: string;
  languages?: string[];
  coins: number;
  cashBalance: number;
  isBanned: boolean;
  banReason?: string;
  banUntil?: string;
  profilePicture?: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Advanced Filters
  const [search, setSearch] = useState('');
  const [gender, setGender] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isHost, setIsHost] = useState('');

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', password: '', gender: 'Male' });

  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banForm, setBanForm] = useState({ reason: '', duration: '1', customDate: '' });

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletForm, setWalletForm] = useState({ amount: '', type: 'ADD', reason: '' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (gender) params.append('gender', gender);
      if (sortBy) params.append('sortBy', sortBy);
      if (isHost) params.append('isHost', isHost);

      const res = await apiClient.get(`/admin/users?${params.toString()}`);
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error('Fetch users failed:', e);
    } finally {
      setLoading(false);
    }
  }, [search, gender, sortBy, isHost]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500); 
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleWalletSubmit = async () => {
    if (!editingUser) return;
    try {
      await apiClient.post('/admin/wallet/adjust', {
        userId: editingUser._id,
        amount: walletForm.amount,
        type: walletForm.type,
        reason: walletForm.reason
      });
      alert('Wallet adjusted successfully');
      fetchUsers();
      setIsWalletModalOpen(false);
      setWalletForm({ amount: '', type: 'ADD', reason: '' });
    } catch (error) {
      alert('Adjustment failed: ' + ((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Unknown error'));
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/users', addForm);
      alert('User created successfully');
      setIsAddModalOpen(false);
      setAddForm({ name: '', phone: '', password: '', gender: 'Male' });
      fetchUsers();
    } catch (error) { 
      alert((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Creation failed'); 
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await apiClient.put('/admin/users/' + editingUser._id, editForm);
      fetchUsers();
      setIsEditModalOpen(false);
    } catch { alert('Update failed'); }
  };

  const handleBanSubmit = async () => {
    if (!editingUser) return;
    try {
      await apiClient.post('/admin/users/' + editingUser._id + '/ban', {
        isBanned: true,
        reason: banForm.reason,
        durationDays: banForm.duration,
        customDate: banForm.duration === 'custom' ? banForm.customDate : undefined
      });
      fetchUsers();
      setIsBanModalOpen(false);
    } catch { alert('Ban failed'); }
  };

  const handleUnban = async (id: string) => {
    try {
      await apiClient.post('/admin/users/' + id + '/ban', { isBanned: false });
      fetchUsers();
    } catch {
      alert('Failed to unban user');
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this user?')) return;
    try {
      await apiClient.delete('/admin/delete-permanent/' + id);
      fetchUsers();
      alert('User permanently deleted');
    } catch {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500">Manage all registered accounts and their finances.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all whitespace-nowrap"
        >
          <UserPlus size={18}/> Add User
        </button>
      </div>

      {/* Supreme Filter Bar */}
      <div className="bg-white dark:bg-surface-900 p-4 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search name or phone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-surface-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all"
          />
        </div>

        <select 
          value={gender} 
          onChange={(e) => setGender(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border-none rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 outline-none"
        >
          <option value="">All Genders</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>

        <select 
          value={isHost} 
          onChange={(e) => setIsHost(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border-none rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 outline-none"
        >
          <option value="">All Types</option>
          <option value="true">Hosts</option>
          <option value="false">Users</option>
        </select>

        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 dark:bg-surface-800 border-none rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 outline-none"
        >
          <option value="newest">Newest</option>
          <option value="coins">Top Coins</option>
        </select>

        <button onClick={fetchUsers} className="p-2.5 bg-brand-50 text-brand-600 rounded-xl hover:bg-brand-100 transition-colors">
          <Filter size={20} />
        </button>
      </div>
      
      <div className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-surface-800/50 text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="p-6">User Details</th>
                <th className="p-6">Wallet / Cash</th>
                <th className="p-6">Account Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-400 font-bold animate-pulse">FETCHING...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="p-16 text-center text-gray-400 font-black uppercase tracking-widest italic">No Data</td></tr>
              ) : users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/30 transition-colors">
                  <td className="p-6 text-sm">
                    <div className="flex items-center gap-3">
                      <img src={u.profilePicture || `https://ui-avatars.com/api/?name=${u.name}&background=random`} className="w-10 h-10 rounded-xl border border-gray-100 dark:border-gray-700 object-cover" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white leading-tight">{u.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{u.phone} • {u.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-sm">
                    <p className="font-bold text-gray-900 dark:text-white">{u.coins} <span className="text-[10px] text-gray-400">Coins</span></p>
                    <p className="text-brand-600 font-medium">₹{u.cashBalance || 0} Balance</p>
                  </td>
                  <td className="p-6 text-sm">
                    {u.isBanned ? (
                      <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Banned</span>
                    ) : (
                      <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Active</span>
                    )}
                  </td>
                  <td className="p-6 text-right relative">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === u._id ? null : u._id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                    >
                      <MoreHorizontal size={20} className="text-gray-400" />
                    </button>
                    {activeMenu === u._id && (
                      <div className="absolute right-6 top-12 w-52 bg-white dark:bg-surface-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 p-2 text-left">
                        <button onClick={() => { setEditingUser(u); setEditForm({...u}); setIsEditModalOpen(true); setActiveMenu(null); }} className="w-full p-3 hover:bg-gray-50 dark:hover:bg-surface-700/50 rounded-xl flex gap-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"><Edit size={18} className="text-blue-500"/> Edit Profile</button>
                        <button onClick={() => { setEditingUser(u); setIsWalletModalOpen(true); setActiveMenu(null); }} className="w-full p-3 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl flex gap-3 text-sm font-medium text-brand-600 transition-colors"><Receipt size={18} className="text-brand-500"/> Adjust Wallet</button>
                        {u.isBanned ? 
                          <button onClick={() => handleUnban(u._id)} className="w-full p-3 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-xl flex gap-3 text-sm font-medium text-green-600 transition-colors"><UserCheck size={18}/> Unban User</button> :
                          <button onClick={() => { setEditingUser(u); setIsBanModalOpen(true); setActiveMenu(null); }} className="w-full p-3 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl flex gap-3 text-sm font-medium text-red-600 transition-colors"><ShieldBan size={18}/> Ban User</button>
                        }
                        <div className="h-px bg-gray-100 dark:bg-gray-700 my-1 mx-2"></div>
                        <button onClick={() => deleteUser(u._id)} className="w-full p-3 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl flex gap-3 text-sm font-medium text-red-600 transition-colors"><Trash2 size={18}/> Permanent Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals omitted for brevity, keeping existing logic */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative border border-white/10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New User</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm" placeholder="Enter full name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Gender</label>
                  <select value={addForm.gender} onChange={e => setAddForm({...addForm, gender: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                <input required value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm" placeholder="Enter phone number" />
              </div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Login Password</label>
                <input required type="password" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 transition-all mt-4">Create User Account</button>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-2xl rounded-[32px] p-8 shadow-2xl relative border border-white/10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile: {editingUser?.name}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Gender</label>
                <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm">
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Coin Balance</label>
                <input type="number" value={editForm.coins} onChange={e => setEditForm({...editForm, coins: parseInt(e.target.value?.toString() || '0')})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cash Balance (INR)</label>
                <input type="number" value={editForm.cashBalance} onChange={e => setEditForm({...editForm, cashBalance: parseInt(e.target.value?.toString() || '0')})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm font-bold text-brand-600" />
              </div>
            </div>
            <button onClick={handleUpdateUser} className="w-full mt-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"><Save size={20}/> Save Changes</button>
          </div>
        </div>
      )}

      {isBanModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[32px] p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Account Ban</h2>
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
              <button onClick={handleBanSubmit} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 transition-all">Suspend Account</button>
              <button onClick={() => setIsBanModalOpen(false)} className="w-full py-2 text-gray-500 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {isWalletModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[32px] p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Receipt className="text-brand-500" /> Wallet Adjust</h2>
              <button onClick={() => setIsWalletModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="space-y-5">
              <div className="flex gap-4 p-1 bg-gray-100 dark:bg-surface-800 rounded-2xl">
                <button 
                  onClick={() => setWalletForm({...walletForm, type: 'ADD'})}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${walletForm.type === 'ADD' ? 'bg-white dark:bg-surface-700 text-brand-600 shadow-sm' : 'text-gray-500'}`}
                >Add Coins</button>
                <button 
                  onClick={() => setWalletForm({...walletForm, type: 'REMOVE'})}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${walletForm.type === 'REMOVE' ? 'bg-white dark:bg-surface-700 text-red-600 shadow-sm' : 'text-gray-500'}`}
                >Remove Coins</button>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Amount (Coins)</label>
                <input type="number" value={walletForm.amount} onChange={e => setWalletForm({...walletForm, amount: e.target.value})} placeholder="e.g. 500" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reason (Optional)</label>
                <textarea value={walletForm.reason} onChange={e => setWalletForm({...walletForm, reason: e.target.value})} placeholder="Bonus, refund, penalty etc." className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm h-24" />
              </div>
              <button onClick={handleWalletSubmit} className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all ${walletForm.type === 'ADD' ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20' : 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20'}`}>
                {walletForm.type === 'ADD' ? 'Confirm Addition' : 'Confirm Removal'}
              </button>
              <button onClick={() => setIsWalletModalOpen(false)} className="w-full py-2 text-gray-500 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
