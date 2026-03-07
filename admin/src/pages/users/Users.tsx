import { useState, useEffect } from 'react';
import { MoreHorizontal, ShieldBan, Trash2, Edit, X, Save, UserCheck, UserPlus, Search } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  coins: number;
  cashBalance: number;
  isBanned: boolean;
  banReason?: string;
  banUntil?: string;
  profilePicture?: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '', password: '', gender: 'Male' });

  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banForm, setBanForm] = useState({ reason: '', duration: '1' });

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/admin/users');
      setUsers(res.data);
    } catch (e) {
      console.error('Fetch users failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/users', addForm);
      alert('User created successfully');
      setIsAddModalOpen(false);
      setAddForm({ name: '', email: '', phone: '', password: '', gender: 'Male' });
      fetchUsers();
    } catch (e: any) { 
      const msg = e.response?.data?.message || 'Creation failed. User might already exist.';
      alert(msg); 
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await apiClient.put('/admin/users/' + editingUser._id, editForm);
      fetchUsers();
      setIsEditModalOpen(false);
    } catch (e) { alert('Update failed'); }
  };

  const handleBanSubmit = async () => {
    if (!editingUser) return;
    try {
      await apiClient.post('/admin/users/' + editingUser._id + '/ban', {
        isBanned: true,
        reason: banForm.reason,
        durationDays: banForm.duration
      });
      fetchUsers();
      setIsBanModalOpen(false);
    } catch (e) { alert('Ban failed'); }
  };

  const handleUnban = async (id: string) => {
    try {
      await apiClient.post('/admin/users/' + id + '/ban', { isBanned: false });
      fetchUsers();
    } catch (e) {}
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY delete this user? This cannot be undone.')) return;
    try {
      await apiClient.delete('/admin/users/' + id);
      fetchUsers();
      alert('User deleted successfully');
    } catch (e) {
      alert('Failed to delete user');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.phone && u.phone.includes(searchQuery))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500">View and manage all {users.length} registered users.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search by name, email, phone..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all whitespace-nowrap"
          >
            <UserPlus size={18}/> Add User
          </button>
        </div>
      </div>
      
      <div className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-surface-800/50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="p-6">User Details</th>
                <th className="p-6">Wallet / Cash</th>
                <th className="p-6">Account Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-500">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-500">No users found matching your search.</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u._id} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/30 transition-colors">
                  <td className="p-6 text-sm">
                    <div className="flex items-center gap-3">
                      <img src={u.profilePicture || 'https://ui-avatars.com/api/?name='+u.name} className="w-10 h-10 rounded-xl border border-gray-100 dark:border-gray-700" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email || u.phone}</p>
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
                      <div className="absolute right-6 top-12 w-52 bg-white dark:bg-surface-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 p-2 text-left animate-in fade-in zoom-in-95 duration-100">
                        <button onClick={() => { setEditingUser(u); setEditForm({...u}); setIsEditModalOpen(true); setActiveMenu(null); }} className="w-full p-3 hover:bg-gray-50 dark:hover:bg-surface-700/50 rounded-xl flex gap-3 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"><Edit size={18} className="text-blue-500"/> Edit Profile</button>
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

      {/* Add User Modal */}
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
                  <input required value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Gender</label>
                  <select value={addForm.gender} onChange={e => setAddForm({...addForm, gender: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                <input type="email" value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm" placeholder="john@example.com" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                <input value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm" placeholder="+919876543210" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Login Password</label>
                <input required type="password" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm" placeholder="••••••••" />
              </div>
              <button type="submit" className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 transition-all mt-4">Create User Account</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-2xl rounded-[32px] p-8 shadow-2xl relative border border-white/10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile: {editingUser?.name}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email</label>
                <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Coin Balance</label>
                <input type="number" value={editForm.coins} onChange={e => setEditForm({...editForm, coins: parseInt(e.target.value) || 0})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cash Balance (INR)</label>
                <input type="number" value={editForm.cashBalance} onChange={e => setEditForm({...editForm, cashBalance: parseInt(e.target.value) || 0})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm font-bold text-brand-600" />
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
                <select value={banForm.duration} onChange={e => setBanForm({...banForm, duration: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm">
                  <option value="1">1 Day</option>
                  <option value="3">3 Days</option>
                  <option value="7">1 Week</option>
                  <option value="30">1 Month</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
              <button onClick={handleBanSubmit} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 transition-all">Suspend Account</button>
              <button onClick={() => setIsBanModalOpen(false)} className="w-full py-2 text-gray-500 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
