import { Gift } from "lucide-react";
import { useState, useEffect } from 'react';
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
  
  
  
  const [selectedPackage, setSelectedPackage] = useState<CoinPackage | null>(null);
  const [formData, setFormData] = useState({ coins: 0, priceINR: 0, bonus: 0, isActive: true });

  useEffect(() => { fetchEconomy(); }, []);

  const fetchEconomy = async () => {
    try {
      const res = await apiClient.get('/admin/economy/coins');
      setCoins(res.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const openEditModal = (pkg?: CoinPackage) => {
    if (pkg) {
      setSelectedPackage(pkg);
      setFormData({ coins: pkg.coins, priceINR: pkg.priceINR, bonus: pkg.bonus || 0, isActive: pkg.isActive });
    } else {
      setSelectedPackage(null);
      setFormData({ coins: 0, priceINR: 0, bonus: 0, isActive: true });
    }
    setIsEditModalOpen(true);
  };

  const handleSaveChanges = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedPackage) {
        const res = await apiClient.put(`/admin/economy/coins/${selectedPackage._id}`, formData);
        setCoins(prev => prev.map(p => p._id === selectedPackage._id ? res.data : p));
      } else {
        const res = await apiClient.post('/admin/economy/coins', formData);
        setCoins(prev => [...prev, res.data]);
      }
      setIsEditModalOpen(false);
    } catch (e) {} finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!selectedPackage) return;
    setSaving(true);
    try {
      await apiClient.delete(`/admin/economy/coins/${selectedPackage._id}`);
      setCoins(prev => prev.filter(p => p._id !== selectedPackage._id));
      setIsDeleteModalOpen(false);
    } catch (e) {} finally { setSaving(false); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Economy</h1>
        <button onClick={() => openEditModal()} className="bg-indigo-600 text-white px-4 py-2 rounded-xl">Add Package</button>
      </div>
      {loading ? <p>Loading...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coins.map(pkg => (
            <div key={pkg._id} className="p-4 border rounded-xl bg-white shadow-sm">
              <p className="font-bold">{pkg.coins} Coins (+{pkg.bonus} Bonus)</p>
              <p className="text-sm">₹{pkg.priceINR}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => openEditModal(pkg)} className="text-indigo-600">Edit</button>
                <button onClick={() => { setSelectedPackage(pkg); setIsDeleteModalOpen(true); }} className="text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
