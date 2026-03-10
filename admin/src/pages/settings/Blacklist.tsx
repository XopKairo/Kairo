import { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, Plus, Globe, Smartphone, X } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface BlacklistItem {
  _id: string;
  type: string;
  value: string;
  reason: string;
  createdAt: string;
}

export default function Blacklist() {
  const [list, setList] = useState<BlacklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ value: '', type: 'IP', reason: '' });

  const fetchBlacklist = async () => {
    try {
      const res = await apiClient.get('/admin/blacklist');
      setList(res.data);
    } catch {
      console.error('Failed to fetch blacklist:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBlacklist(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/blacklist', formData);
      fetchBlacklist();
      setIsModalOpen(false);
      setFormData({ value: '', type: 'IP', reason: '' });
    } catch { alert('Failed to add to blacklist'); }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this entry?')) return;
    try {
      await apiClient.delete(`/admin/blacklist/${id}`);
      fetchBlacklist();
    } catch { alert('Failed to remove'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShieldAlert className="text-red-500" /> Security Blacklist
          </h1>
          <p className="text-sm text-gray-500">Block specific IP addresses or device IDs from accessing the app.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-500/20"
        >
          <Plus size={20}/> Blacklist Entry
        </button>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-surface-800/50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="p-6">Entity Value</th>
              <th className="p-6">Type</th>
              <th className="p-6">Reason</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (
              <tr><td colSpan={4} className="p-10 text-center text-gray-500">Scanning blacklist...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={4} className="p-10 text-center text-gray-500">No blacklisted entities found.</td></tr>
            ) : list.map(item => (
              <tr key={item._id} className="hover:bg-red-50/10 transition-colors">
                <td className="p-6 text-sm">
                  <div className="flex items-center gap-3 font-mono font-bold text-gray-900 dark:text-white">
                    {item.type === 'IP' ? <Globe size={16} className="text-blue-500"/> : <Smartphone size={16} className="text-purple-500"/>}
                    {item.value}
                  </div>
                </td>
                <td className="p-6 text-sm">
                   <span className="px-2 py-1 bg-gray-100 dark:bg-surface-800 rounded text-[10px] font-bold">{item.type}</span>
                </td>
                <td className="p-6 text-sm text-gray-500 italic">"{item.reason || 'No reason provided'}"</td>
                <td className="p-6 text-right">
                  <button onClick={() => handleRemove(item._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Blacklist Entry</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Entity Type</label>
                <div className="flex gap-4 p-1 bg-gray-100 dark:bg-surface-800 rounded-xl">
                   <button type="button" onClick={() => setFormData({...formData, type:'IP'})} className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.type === 'IP' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}>IP Address</button>
                   <button type="button" onClick={() => setFormData({...formData, type:'DEVICE'})} className={`flex-1 py-2 rounded-lg text-sm font-bold ${formData.type === 'DEVICE' ? 'bg-white shadow-sm text-brand-600' : 'text-gray-500'}`}>Device ID</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Value ({formData.type})</label>
                <input required value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder={formData.type === 'IP' ? 'e.g. 192.168.1.1' : 'e.g. device_serial_123'} className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reason for blocking</label>
                <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Spamming, harassment, etc." className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl border-none text-sm h-24" />
              </div>
              <button type="submit" className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold shadow-lg shadow-red-500/20 transition-all uppercase tracking-widest">Add to Blacklist</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
