import { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, ShieldBan, Trash2, Edit, UserCheck } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface User {
  profilePicture?: string;
  isVerified?: boolean;
  id?: string;
  _id?: string;
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  isBanned?: boolean;
  createdAt?: string;
  registeredAt?: string;
  role?: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBan = async (id: string, isBanned: boolean) => {
    const action = isBanned ? 'unban' : 'ban';
    if (!window.confirm('Are you sure you want to ' + action + ' this user?')) return;
    try {
      await apiClient.put('/admin/users/' + id + '/status', { isBanned: !isBanned });
      fetchUsers();
      setActiveMenu(null);
    } catch (error) {
      alert('Failed to ' + action + ' user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await apiClient.delete('/admin/users/' + id);
      setUsers(users.filter(u => (u._id || u.id) !== id));
      setActiveMenu(null);
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View and manage all registered users.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search users..." className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-surface-800 rounded-xl text-sm outline-none dark:text-white border-transparent" />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-surface-800/50 text-gray-500 dark:text-gray-400 text-sm font-medium">
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Email/Phone</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {loading ? (
                <tr><td colSpan={4} className="py-4 text-center">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center">No users found.</td></tr>
              ) : users.map((user) => {
                const rowId = (user._id || user.id || '').toString();
                return (
                <tr key={rowId} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <img src={user.profilePicture || 'https://ui-avatars.com/api/?name='+user.name} className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-700" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{user.name || 'Unknown'}</p>
                      <p className="text-[10px] text-gray-400">ID: {rowId.substring(0,8)}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{user.email || user.phone}</td>
                  <td className="py-4 px-6">
                    <span className={"px-3 py-1 rounded-full text-xs font-medium " + (user.isBanned ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                      {user.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right flex justify-end gap-2 relative">
                    <button 
                      onClick={() => handleToggleBan(rowId, !!user.isBanned)}
                      className={user.isBanned ? 'text-green-500' : 'text-gray-400'} 
                      title={user.isBanned ? "Unban" : "Ban"}
                    >
                      <ShieldBan className="w-5 h-5" />
                    </button>
                    
                    <button onClick={() => setActiveMenu(activeMenu === rowId ? null : rowId)} className="text-gray-400 hover:text-brand-500 p-1 relative z-10">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {activeMenu === rowId && (
                      <div className="absolute right-8 top-10 w-40 bg-white dark:bg-surface-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-20 overflow-hidden">
                        <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-surface-700 flex items-center gap-2 dark:text-white">
                          <Edit className="w-4 h-4" /> Edit User
                        </button>
                        <button onClick={() => handleDeleteUser(rowId)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
                          <Trash2 className="w-4 h-4" /> Delete User
                        </button>
                      </div>
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