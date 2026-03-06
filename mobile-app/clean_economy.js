const fs = require('fs');
const content = `import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, DownloadCloud, Plus, Edit, Trash2, X, Gift } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface CoinPackage {
  _id: string;
  coins: number;
  priceINR: number;
  bonus: number;
  isActive: boolean;
}

export default function Economy() {
  const [coins, setCoins] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  
  const [formData, setFormData] = useState({
    coins: 0,
    priceINR: 0,
    bonus: 0,
    isActive: true
  });

  useEffect(() => { fetchEconomy(); }, []);

  const fetchEconomy = async () => {
    try {
      const response = await apiClient.get('/admin/economy/coins');
      setCoins(response.data);
    } catch (error) {
      console.error('Failed to fetch economy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (pkg?: CoinPackage) => {
    if (pkg) {
      setSelectedPackage(pkg);
      setFormData({
        coins: pkg.coins,
        priceINR: pkg.priceINR,
        bonus: pkg.bonus || 0,
        isActive: pkg.isActive
      });
    } else {
      setSelectedPackage(null);
      setFormData({ coins: 0, priceINR: 0, bonus: 0, isActive: true });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedPackage) {
        const response = await apiClient.put(\`/admin/economy/coins/\${selectedPackage._id}\`, formData);
        setCoins(prev => prev.map(p => p._id === selectedPackage._id ? response.data : p));
      } else {
        const response = await apiClient.post('/admin/economy/coins', formData);
        setCoins(prev => [...prev, response.data]);
      }
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to save package:', error);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedPackage) return;
    setSaving(true);
    try {
      await apiClient.delete(\`/admin/economy/coins/\${selectedPackage._id}\`);
      setCoins(prev => prev.filter(p => p._id !== selectedPackage._id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Failed to delete package:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Economy & Payouts</h1>
      </div>
      <div className="bg-white rounded-3xl p-6 shadow-sm">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-lg font-bold">Coin Packages</h3>
           <button onClick={() => openEditModal()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl">Add Package</button>
         </div>
         {loading ? <p>Loading...</p> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {coins.map(pkg => (
                <div key={pkg._id} className="p-5 border rounded-xl relative">
                  {pkg.bonus > 0 && <span className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] px-2">+{pkg.bonus} BONUS</span>}
                  <p className="font-bold">{pkg.coins} Coins</p>
                  <p className="text-sm">₹{pkg.priceINR}</p>
                  <div className="mt-2">
                    <button onClick={() => openEditModal(pkg)} className="mr-2 text-indigo-600">Edit</button>
                    <button onClick={() => { setSelectedPackage(pkg); setIsDeleteModalOpen(true); }} className="text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
         )}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-md rounded-2xl p-8">
            <h2 className="text-xl font-bold mb-6">{selectedPackage ? 'Edit Package' : 'Add Package'}</h2>
            <form onSubmit={handleSaveChanges} className="space-y-4">
              <input type="number" placeholder="Base Coins" value={formData.coins} onChange={e => setFormData({...formData, coins: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl" />
              <input type="number" placeholder="Bonus" value={formData.bonus} onChange={e => setFormData({...formData, bonus: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl" />
              <input type="number" placeholder="Price (INR)" value={formData.priceINR} onChange={e => setFormData({...formData, priceINR: parseInt(e.target.value)})} className="w-full p-3 border rounded-xl" />
              <button type="submit" disabled={saving} className="w-full py-3 bg-indigo-600 text-white rounded-xl">{saving ? 'Saving...' : 'Save'}</button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white p-8 rounded-2xl text-center">
            <h2 className="text-xl font-bold mb-4">Delete?</h2>
            <button onClick={confirmDelete} className="px-6 py-2 bg-red-600 text-white rounded-xl mr-2">Delete</button>
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-6 py-2 bg-gray-200 rounded-xl">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
\`;
fs.writeFileSync('../admin/src/pages/economy/Economy.tsx', content);
