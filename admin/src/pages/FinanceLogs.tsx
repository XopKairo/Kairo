import { useState, useEffect } from 'react';
import { Receipt, CheckCircle2, XCircle, Clock, Search, Filter } from 'lucide-react';
import apiClient from '../api/apiClient';

interface Transaction {
  _id: string;
  userId: { name: string; phone: string; profilePicture?: string };
  amount: number;
  coins: number;
  status: 'completed' | 'pending' | 'failed';
  paymentGateway: string;
  transactionId: string;
  createdAt: string;
}

export default function FinanceLogs() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/economy/transactions'); // This endpoint should exist in economy routes
      setTransactions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter(t => {
    const matchesSearch = t.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <div className="p-8 text-gray-500 font-bold animate-pulse uppercase tracking-widest text-center mt-20">Accessing Secure Finance Vault...</div>;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-1 uppercase tracking-tighter italic">Finance Hub</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">Transaction Auditing & Revenue Tracking</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-white dark:bg-surface-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Transaction ID or User Name..." 
            className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-surface-800 border-none rounded-2xl text-sm font-bold focus:ring-2 ring-brand-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-gray-400" size={18} />
          <select 
            className="bg-gray-50 dark:bg-surface-800 border-none rounded-2xl py-3 px-6 text-sm font-bold focus:ring-2 ring-brand-500 cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 dark:border-gray-800">
              <tr>
                <th className="p-6">Transaction ID</th>
                <th className="p-6">User</th>
                <th className="p-6">Amount</th>
                <th className="p-6">Coins</th>
                <th className="p-6">Gateway</th>
                <th className="p-6">Status</th>
                <th className="p-6">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="p-6 font-mono text-xs text-gray-500 font-bold">{t.transactionId}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <img src={t.userId?.profilePicture || `https://ui-avatars.com/api/?name=${t.userId?.name}`} className="w-10 h-10 rounded-xl object-cover ring-2 ring-gray-100" />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{t.userId?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{t.userId?.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 font-black text-gray-900 dark:text-white">₹{t.amount}</td>
                  <td className="p-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 rounded-lg text-xs font-black">
                      <Receipt size={12} />
                      {t.coins} COINS
                    </div>
                  </td>
                  <td className="p-6 text-xs font-black uppercase text-gray-400">{t.paymentGateway}</td>
                  <td className="p-6">
                    {t.status === 'completed' ? (
                      <div className="flex items-center gap-1.5 text-green-600 font-black uppercase text-[10px]">
                        <CheckCircle2 size={14} /> COMPLETED
                      </div>
                    ) : t.status === 'failed' ? (
                      <div className="flex items-center gap-1.5 text-red-600 font-black uppercase text-[10px]">
                        <XCircle size={14} /> FAILED
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-orange-500 font-black uppercase text-[10px]">
                        <Clock size={14} /> PENDING
                      </div>
                    )}
                  </td>
                  <td className="p-6 text-xs font-bold text-gray-400">
                    {new Date(t.createdAt).toLocaleDateString()}
                    <br/>
                    <span className="text-[10px] opacity-60">{new Date(t.createdAt).toLocaleTimeString()}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-20 text-center text-gray-300 font-black uppercase tracking-widest italic">No financial records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
