import { useState, useEffect } from 'react';
import { Search, MoreHorizontal, ShieldBan, Trash2, Edit, X, Save, Clock } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Ban Modal States
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [banForm, setBanForm] = useState({ reason: '', duration: '1' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/users');
      setUsers(res.data);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ ...user });
    setIsEditModalOpen(true);
    setActiveMenu(null);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await apiClient.put('/admin/users/' + editingUser._id, editForm);
      fetchUsers();
      setIsEditModalOpen(false);
    } catch (e) { alert('Update failed'); }
  };

  const openBan = (user: User) => {
    setEditingUser(user);
    setBanForm({ reason: user.banReason || '', duration: '1' });
    setIsBanModalOpen(true);
    setActiveMenu(null);
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
    if (!window.confirm('Permanent delete?')) return;
    try {
      await apiClient.delete('/admin/users/' + id);
      fetchUsers();
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      
      <div className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-surface-800 text-gray-500 text-sm">
              <tr>
                <th className="p-6">User</th>
                <th className="p-6">Finance</th>
                <th className="p-6">Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50/50">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <img src={u.profilePicture || 'https://ui-avatars.com/api/?name='+u.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-bold">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email || u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="text-sm font-bold">{u.coins} Coins</p>
                    <p className="text-xs text-green-600">₹{u.cashBalance || 0} Cash</p>
                  </td>
                  <td className="p-6">
                    {u.isBanned ? (
                      <div className="flex flex-col">
                        <span className="bg-red-50 text-red-600 px-2 py-1 rounded text-xs w-fit">Banned</span>
                        {u.banUntil && <p className="text-[10px] text-gray-400 mt-1">Until: {new Date(u.banUntil).toLocaleDateString()}</p>}
                      </div>
                    ) : (
                      <span className="bg-green-50 text-green-600 px-2 py-1 rounded text-xs">Active</span>
                    )}
                  </td>
                  <td className="p-6 text-right relative">
                    <button onClick={() => setActiveMenu(activeMenu === u._id ? null : u._id)}><MoreHorizontal /></button>
                    {activeMenu === u._id && (
                      <div className="absolute right-6 top-12 w-48 bg-white dark:bg-surface-800 border rounded-2xl shadow-xl z-50 p-2">
                        <button onClick={() => openEdit(u)} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex gap-2 text-sm text-gray-700"><Edit size={16}/> Edit Profile</button>
                        {u.isBanned ? 
                          <button onClick={() => handleUnban(u._id)} className="w-full text-left p-3 hover:bg-green-50 rounded-xl flex gap-2 text-sm text-green-600"><UserCheck size={16}/> Unban</button> :
                          <button onClick={() => openBan(u)} className="w-full text-left p-3 hover:bg-red-50 rounded-xl flex gap-2 text-sm text-red-600"><ShieldBan size={16}/> Ban User</button>
                        }
                        <button onClick={() => deleteUser(u._id)} className="w-full text-left p-3 hover:bg-red-50 rounded-xl flex gap-2 text-sm text-red-600"><Trash2 size={16}/> Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-2xl rounded-[32px] p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Edit Everything: {editingUser?.name}</h2>
              <button onClick={() => setIsEditModalOpen(false)}><X/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500">Display Name</label>
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-3 border rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500">Email Address</label>
                <input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full p-3 border rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500">Phone Number</label>
                <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full p-3 border rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500">Coin Balance</label>
                <input type="number" value={editForm.coins} onChange={e => setEditForm({...editForm, coins: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500">Cash Balance (INR)</label>
                <input type="number" value={editForm.cashBalance} onChange={e => setEditForm({...editForm, cashBalance: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl text-green-600 font-bold" />
              </div>
            </div>

            <button onClick={handleUpdateUser} className="w-full mt-8 py-4 bg-brand-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2"><Save size={20}/> Save All Changes</button>
          </div>
        </div>
      )}

      {/* Advanced Ban Modal */}
      {isBanModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><ShieldBan className="text-red-600"/> Ban Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold">Ban Reason</label>
                <textarea value={banForm.reason} onChange={e => setBanForm({...banForm, reason: e.target.value})} placeholder="Violating community rules..." className="w-full p-3 border rounded-xl h-24" />
              </div>
              <div>
                <label className="text-sm font-bold">Duration</label>
                <select value={banForm.duration} onChange={e => setBanForm({...banForm, duration: e.target.value})} className="w-full p-3 border rounded-xl">
                  <option value="1">1 Day</option>
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="permanent">Permanent Ban</option>
                </select>
              </div>
              <button onClick={handleBanSubmit} className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold mt-4">Apply Ban</button>
              <button onClick={() => setIsBanModalOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}