import { useState, useEffect } from 'react';
import { History, Plus } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface CoinPackage {
  _id: string;
  coins: number;
  priceINR: number;
  bonus: number;
  isActive: boolean;
}

interface Transaction {
  _id: string;
  userId?: { name: string };
  amount: number;
  status: string;
  paymentId: string;
  createdAt: string;
}

export default function Economy() {
  const [coins, setCoins] = useState<CoinPackage[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [saving, setSaving] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [formData, setFormData] = useState({ coins: 0, priceINR: 0, bonus: 0, isActive: true });

  const fetchData = async () => {
    try {
      const [coinsRes, transRes] = await Promise.all([
        apiClient.get('/admin/economy/coins'),
        apiClient.get('/admin/monitoring/transactions')
      ]);
      setCoins(coinsRes.data);
      setTransactions(transRes.data);
    } catch {
      console.error('Failed to fetch economy data:', e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedPackage) {
        const response = await apiClient.put('/admin/economy/coins/' + selectedPackage._id, formData);
        setCoins(prev => prev.map(p => p._id === selectedPackage._id ? response.data : p));
      } else {
        const response = await apiClient.post('/admin/economy/coins', formData);
        setCoins(prev => [...prev, response.data]);
      }
      setIsEditModalOpen(false);
    } catch {
      alert('Failed to save package');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Economy & Store</h1>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
         <div className="flex justify-between items-center mb-8">
           <div>
             <h3 className="text-lg font-bold text-gray-900 dark:text-white">Coin Store Packages</h3>
             <p className="text-sm text-gray-500">Manage packages available for users to buy</p>
           </div>
           <button 
             onClick={() => { setSelectedPackage(null); setFormData({coins:0, priceINR:0, bonus:0, isActive:true}); setIsEditModalOpen(true); }} 
             className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all"
           >
             <Plus size={20}/> Add Package
           </button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {coins.map(pkg => (
              <div key={pkg._id} className="p-6 bg-gray-50 dark:bg-surface-800 rounded-[24px] border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                <div className="relative z-10">
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{pkg.coins} <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Coins</span></p>
                  <p className="text-xl font-bold text-brand-600 mt-1">₹{pkg.priceINR}</p>
                  {pkg.bonus > 0 && <p className="text-xs font-bold text-green-500 mt-2 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-lg inline-block">+{pkg.bonus} Bonus</p>}
                  
                  <div className="flex gap-2 mt-6">
                    <button 
                      onClick={() => { setSelectedPackage(pkg); setFormData({...pkg}); setIsEditModalOpen(true); }} 
                      className="w-full py-2 bg-white dark:bg-surface-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors"
                    >
                      Edit Package
                    </button>
                  </div>
                </div>
              </div>
            ))}
         </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
         <h3 className="text-lg font-bold mb-8 flex items-center gap-2 text-gray-900 dark:text-white"><History className="text-brand-500"/> Recent Purchases</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-gray-400 text-sm uppercase tracking-wider">
                <tr>
                  <th className="pb-4 font-bold">User</th>
                  <th className="pb-4 font-bold">Amount</th>
                  <th className="pb-4 font-bold">Status</th>
                  <th className="pb-4 font-bold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {transactions.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">No recent transactions found</td></tr>
                ) : transactions.map(t => (
                  <tr key={t._id} className="group">
                    <td className="py-4 font-medium text-gray-900 dark:text-white">{t.userId?.name || 'Unknown User'}</td>
                    <td className="py-4 font-black text-gray-900 dark:text-white">₹{t.amount}</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.status === 'completed' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>{t.status}</span>
                    </td>
                    <td className="py-4 text-sm text-gray-400 text-right">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-white/10">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">{selectedPackage ? 'Edit Package' : 'Add Package'}</h2>
            <form onSubmit={handleSaveChanges} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-widest">Coin Amount</label>
                <input 
                  type="number" 
                  value={formData.coins} 
                  placeholder="e.g. 1000"
                  onChange={e => setFormData({...formData, coins: parseInt(e.target.value) || 0})} 
                  className="w-full p-4 bg-gray-50 dark:bg-surface-800 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-widest">Bonus Coins</label>
                <input 
                  type="number" 
                  value={formData.bonus} 
                  placeholder="e.g. 50"
                  onChange={e => setFormData({...formData, bonus: parseInt(e.target.value) || 0})} 
                  className="w-full p-4 bg-gray-50 dark:bg-surface-800 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-500 mb-2 uppercase tracking-widest">Price (INR)</label>
                <input 
                  type="number" 
                  value={formData.priceINR} 
                  placeholder="e.g. 99"
                  onChange={e => setFormData({...formData, priceINR: parseInt(e.target.value) || 0})} 
                  className="w-full p-4 bg-gray-50 dark:bg-surface-800 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 text-gray-900 dark:text-white" 
                />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button type="submit" disabled={saving} className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg transition-all disabled:opacity-50 uppercase tracking-widest">
                  {saving ? 'Processing...' : selectedPackage ? 'Update Package' : 'Create Package'}
                </button>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-full py-2 text-gray-500 font-bold hover:text-gray-700 transition-colors">
                  Discard Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
