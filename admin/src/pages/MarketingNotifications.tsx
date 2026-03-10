import { useState, useEffect } from 'react';
import { Send, Bell } from 'lucide-react';
import apiClient from '../api/apiClient';

interface NotificationLog {
  _id: string;
  title: string;
  message: string;
  targetAudience: string;
  type: string;
  sentAt: string;
}

export default function MarketingNotifications() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: 'All',
    type: 'Info'
  });

  const fetchLogs = async () => {
    try {
      const response = await apiClient.get('/admin/notifications');
      setLogs(response.data);
    } catch {
      console.error('Failed to fetch logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) return alert('Fill title and message');
    
    setSaving(true);
    try {
      await apiClient.post('/admin/notifications', formData);
      alert('Notification sent to ' + formData.targetAudience);
      setFormData({ title: '', message: '', targetAudience: 'All', type: 'Info' });
      fetchLogs();
    } catch {
      alert('Failed to send notification');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Marketing Notifications</h1>
        <p className="text-sm text-gray-500">Send push notifications to your users and hosts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1 bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Send className="text-brand-500" size={20}/> New Message</h3>
          <form onSubmit={handleSend} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Audience</label>
              <select 
                value={formData.targetAudience} 
                onChange={e => setFormData({...formData, targetAudience: e.target.value})}
                className="w-full p-4 bg-gray-50 dark:bg-surface-800 border-none rounded-2xl text-sm"
              >
                <option value="All">All Registered Users</option>
                <option value="Hosts">Hosts Only</option>
                <option value="Users">Regular Users Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Title</label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Notification Title" 
                className="w-full p-4 bg-gray-50 dark:bg-surface-800 border-none rounded-2xl text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Message</label>
              <textarea 
                value={formData.message} 
                onChange={e => setFormData({...formData, message: e.target.value})}
                placeholder="What do you want to say?" 
                rows={4}
                className="w-full p-4 bg-gray-50 dark:bg-surface-800 border-none rounded-2xl text-sm" 
              />
            </div>

            <button 
              type="submit" 
              disabled={sending}
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Broadcast Now'}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Bell className="text-brand-500" size={20}/> Broadcast History</h3>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {loading ? <p>Loading logs...</p> : logs.length === 0 ? <p className="text-gray-500">No previous notifications found.</p> : logs.map(log => (
              <div key={log._id} className="p-5 bg-gray-50 dark:bg-surface-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-1 bg-brand-50 dark:bg-brand-500/10 text-brand-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">{log.targetAudience}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{new Date(log.sentAt).toLocaleString()}</span>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white">{log.title}</h4>
                <p className="text-sm text-gray-500 mt-1">{log.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
