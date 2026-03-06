import { useState, useEffect } from 'react';
import { Search, Filter, MoreHorizontal, ShieldBan } from 'lucide-react';
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
    if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
    try {
      await apiClient.put(`/admin/users/${id}/status`, { isBanned: !isBanned });
      fetchUsers();
    } catch (error) {
      alert(`Failed to ${action} user`);
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
            <input
              type="text"
              placeholder="Search users..."
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
                <th className="py-4 px-6 font-medium">User</th>
                <th className="py-4 px-6 font-medium">Email</th>
                <th className="py-4 px-6 font-medium">Role</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium">Joined</th>
                <th className="py-4 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {loading ? (
                <tr><td colSpan={6} className="py-4 text-center text-gray-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">No users found.</td></tr>
              ) : users.map((user) => (
                <tr key={user._id || user.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{user.name || user.username || 'Unknown'}</td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{user.email || user.phone}</td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{user.role || 'User'}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.isBanned ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400'}`}>
                      {user.isBanned ? 'Banned' : 'Active'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">
                    {user.createdAt || user.registeredAt 
                      ? new Date(user.createdAt || user.registeredAt || '').toLocaleDateString() 
                      : 'Unknown'}
                  </td>
                  <td className="py-4 px-6 text-right flex justify-end gap-2">
                    <button 
                      onClick={() => handleToggleBan(user._id || user.id || '', !!user.isBanned)}
                      className={`${user.isBanned ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-red-500'} transition-colors`} 
                      title={user.isBanned ? "Unban User" : "Ban User"}
                    >
                      <ShieldBan className="w-5 h-5" />
                    </button>
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
