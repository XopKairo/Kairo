import { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, User, Clock, Trash2 } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface FlaggedScreenshot {
  _id: string;
  hostId: { name: string };
  userId: { name: string };
  imageUrl: string;
  flagReason: string;
  confidenceScore: number;
  createdAt: string;
}

export default function CallMonitoring() {
  const [screenshots, setScreenshots] = useState<FlaggedScreenshot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlagged = async () => {
    try {
      const res = await apiClient.get('/admin/monitoring/flagged-screenshots');
      setScreenshots(res.data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFlagged(); }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <ShieldAlert className="text-red-500" /> AI Call Monitoring
        </h1>
        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 px-4 py-2 rounded-xl text-sm font-bold animate-pulse">
          LIVE PROTECTION ACTIVE
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-20">Analysing call logs...</p>
      ) : screenshots.length === 0 ? (
        <div className="bg-white dark:bg-surface-900 p-20 rounded-[32px] text-center border border-gray-100 dark:border-gray-800">
           <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
           <p className="text-gray-500 font-medium">No flagged activities detected in recent calls.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {screenshots.map(s => (
            <div key={s._id} className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden border border-red-100 dark:border-red-900/30 shadow-xl shadow-red-500/5">
              <div className="relative group">
                <img src={s.imageUrl} className="w-full h-64 object-cover blur-sm hover:blur-none transition-all duration-500" />
                <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  {s.flagReason}
                </div>
                <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-md">
                  Score: {(s.confidenceScore * 100).toFixed(0)}%
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Participants</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                       <User size={14} className="text-brand-500" /> {s.hostId?.name} (Host)
                    </p>
                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                       <User size={14} /> {s.userId?.name} (User)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Time</p>
                    <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                       <Clock size={12} /> {new Date(s.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-50 dark:border-gray-800">
                   <button className="flex-1 py-3 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors">BLOCK USER</button>
                   <button className="p-3 bg-gray-100 dark:bg-surface-800 text-gray-500 rounded-xl hover:text-gray-700 transition-colors"><Trash2 size={18}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
