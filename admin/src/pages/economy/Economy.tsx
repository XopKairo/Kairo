import { useState, useEffect } from 'react';
import { Edit, History } from 'lucide-react';
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
    } catch (e) {}
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
    } catch (e) {} finally { setSaving(false); }
  };

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Economy & Store</h1>

      <div className="bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm">
         <div className="flex justify-between items-center mb-8">
           <h3 className="text-lg font-bold">Coin Store Packages</h3>
           <button onClick={() => { setSelectedPackage(null); setFormData({coins:0, priceINR:0, bonus:0, isActive:true}); setIsEditModalOpen(true); }} className="bg-brand-600 text-white px-6 py-2 rounded-xl">+ Add Package</button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {coins.map(pkg => (
              <div key={pkg._id} className="p-5 border rounded-3xl">
                <p className="font-bold">{pkg.coins} Coins</p>
                <p className="text-sm text-brand-600">₹{pkg.priceINR}</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setSelectedPackage(pkg); setFormData({...pkg}); setIsEditModalOpen(true); }} className="p-2 bg-gray-50 rounded-lg"><Edit size={14}/></button>
                </div>
              </div>
            ))}
         </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[32px] p-8 shadow-sm">
         <h3 className="text-lg font-bold mb-8 flex items-center gap-2"><History/> Recent Purchases</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-gray-400 text-sm">
                <tr>
                  <th className="pb-4">User</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {transactions.map(t => (
                  <tr key={t._id}>
                    <td className="py-4">{t.userId?.name || 'User'}</td>
                    <td className="py-4 font-bold">₹{t.amount}</td>
                    <td className="py-4">
                      <span className={"px-2 py-1 rounded-full text-[10px] " + (t.status === 'completed' ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-600")}>{t.status}</span>
                    </td>
                    <td className="py-4 text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
         </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl">
            <h2 className="text-xl font-bold mb-6">{selectedPackage ? 'Edit Package' : 'Add Package'}</h2>
            <form onSubmit={handleSaveChanges} className="space-y-4">
              <input type="number" value={formData.coins} onChange={e => setFormData({...formData, coins: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl" />
              <input type="number" value={formData.bonus} onChange={e => setFormData({...formData, bonus: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl" />
              <input type="number" value={formData.priceINR} onChange={e => setFormData({...formData, priceINR: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl" />
              <button type="submit" disabled={saving} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold">{saving ? 'Saving...' : 'Save'}</button>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}