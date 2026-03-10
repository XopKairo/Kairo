import { useState, useEffect } from 'react';
import { History, Shield, User, Clock, Info } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface AuditLog {
  _id: string;
  adminId: { name: string; username: string };
  action: string;
  targetId?: string;
  details: string;
  createdAt: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await apiClient.get('/admin/audit-logs');
        setLogs(res.data);
      } catch {
        console.error('Failed to fetch audit logs:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'BAN_USER': return 'bg-red-100 text-red-600';
      case 'PAYMENT_OVERRIDE': return 'bg-blue-100 text-blue-600';
      case 'SETTINGS_UPDATE': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <History className="text-brand-500" /> Admin Audit Logs
        </h1>
        <p className="text-sm text-gray-500">Track all administrator activities and system changes.</p>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-surface-800/50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="p-6">Administrator</th>
                <th className="p-6">Action Type</th>
                <th className="p-6">Details / Target</th>
                <th className="p-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-500">Loading activity logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="p-10 text-center text-gray-500">No admin activities recorded yet.</td></tr>
              ) : logs.map(log => (
                <tr key={log._id} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/30 transition-colors">
                  <td className="p-6 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-brand-50 dark:bg-brand-500/10 rounded-lg">
                        <Shield size={16} className="text-brand-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{log.adminId?.name || 'Unknown Admin'}</p>
                        <p className="text-xs text-gray-400">@{log.adminId?.username || 'system'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-sm">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getActionColor(log.action)}`}>
                      {log.action.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-6 text-sm">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200 font-medium">
                        <Info size={14} className="text-gray-400" />
                        {log.details}
                      </div>
                      {log.targetId && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                          <User size={12} /> Target ID: {log.targetId}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6 text-right text-xs text-gray-500 font-medium whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Clock size={12} />
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
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
