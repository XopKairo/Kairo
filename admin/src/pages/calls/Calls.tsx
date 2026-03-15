import { useState, useEffect } from 'react';
import { Video, PhoneOff, User, Monitor } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface ActiveCall {
  _id: string;
  callId: string;
  userId: string;
  hostId: string;
  status: string;
  startTime: string;
  user?: { name: string };
  host?: { name: string };
}

export default function Calls() {
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveCalls = async () => {
    try {
      const res = await apiClient.get('/calls/active');
      setActiveCalls(res.data);
    } catch (e) {
      console.error('Failed to fetch active calls:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveCalls();
    const interval = setInterval(fetchActiveCalls, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleForceEnd = async (callId: string) => {
    if (!window.confirm('Are you sure you want to FORCE END this call?')) return;
    try {
      await apiClient.post('/admin/calls/force-end', { callId });
      alert('Call termination command sent');
      fetchActiveCalls();
    } catch {
      alert('Failed to terminate call');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Monitor className="text-brand-500" /> Live Call Monitoring
        </h1>
        <p className="text-sm text-gray-500">Monitor and manage all currently active video calls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-gray-500 p-4">Loading active sessions...</p>
        ) : activeCalls.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-surface-900 p-12 rounded-[32px] text-center border border-gray-100 dark:border-gray-800">
            <Video className="mx-auto w-12 h-12 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">No active calls at the moment.</p>
          </div>
        ) : activeCalls.map(call => (
          <div key={call._id} className="bg-white dark:bg-surface-900 rounded-[32px] p-6 shadow-soft border border-gray-100 dark:border-gray-800 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-2xl">
                <Video className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Room ID</p>
                <p className="font-mono text-sm dark:text-white">{call.callId}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-800 rounded-2xl">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-blue-500" />
                  <span className="text-sm font-bold dark:text-white">User</span>
                </div>
                <span className="text-sm text-gray-500 truncate max-w-[120px]">{call.userId}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-surface-800 rounded-2xl">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-pink-500" />
                  <span className="text-sm font-bold dark:text-white">Host</span>
                </div>
                <span className="text-sm text-gray-500 truncate max-w-[120px]">{call.hostId}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 mb-6">
              <span>Started: {new Date(call.startTime).toLocaleTimeString()}</span>
              <span className="font-bold text-brand-600">LIVE SESSION</span>
            </div>

            <button 
              onClick={() => handleForceEnd(call.callId)}
              className="w-full py-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-red-100 dark:border-red-500/20"
            >
              <PhoneOff size={18} /> Force Terminate
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
