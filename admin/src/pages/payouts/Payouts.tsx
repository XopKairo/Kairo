import { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface Payout {
  _id: string;
  user?: { name: string; email: string; phone: string; gender: string };
  amountINR: number;
  coinsDeducted: number;
  paymentDetails: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  clientRequestId: string;
  createdAt: string;
}

export default function Payouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState('Pending');

  const fetchPayouts = async () => {
    try {
      const res = await apiClient.get('/admin/payouts');
      setPayouts(res.data);
    } catch {
      console.error('Failed to fetch payouts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayouts(); }, []);

  const handleAction = async (id: string, status: 'Approved' | 'Rejected') => {
    if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;
    
    setProcessingId(id);
    try {
      await apiClient.put(`/admin/payouts/${id}`, { status });
      setPayouts(prev => prev.map(p => p._id === id ? { ...p, status } : p));
      alert(`Payout request ${status} successfully.`);
    } catch {
      alert('Action failed. Check logs.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPayouts = payouts.filter(p => filter === 'All' ? true : p.status === filter);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Withdrawal Requests</h1>
          <p className="text-sm text-gray-500">Manage and process host withdrawal requests.</p>
        </div>
        <div className="flex bg-white dark:bg-surface-900 border border-gray-100 dark:border-gray-800 p-1 rounded-2xl">
          {['Pending', 'Approved', 'Rejected', 'All'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === f ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 dark:bg-surface-800/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">User/Host</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Amount (INR)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Payment Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500 font-medium">Loading requests...</td></tr>
              ) : filteredPayouts.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500 font-medium">No {filter.toLowerCase()} requests found.</td></tr>
              ) : filteredPayouts.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/30 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-bold text-gray-900 dark:text-white">{p.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-400">{p.user?.phone || p.user?.email}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-lg font-black text-brand-600">₹{p.amountINR}</div>
                    <div className="text-[10px] font-bold text-gray-400 uppercase">{p.coinsDeducted} Coins</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">{p.paymentDetails}</div>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-5 text-right">
                    {p.status === 'Pending' ? (
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={processingId === p._id}
                          onClick={() => handleAction(p._id, 'Approved')}
                          className="p-2 bg-green-50 dark:bg-green-500/10 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                          title="Approve & Pay"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button
                          disabled={processingId === p._id}
                          onClick={() => handleAction(p._id, 'Rejected')}
                          className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                          title="Reject & Refund"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${p.status === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {p.status}
                      </span>
                    )}
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
