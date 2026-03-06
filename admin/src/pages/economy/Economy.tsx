import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Edit, Trash2, X, Gift as GiftIcon } from 'lucide-react';
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

  useEffect(() => {
    fetchEconomy();
  }, []);

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
      setFormData({
        coins: 0,
        priceINR: 0,
        bonus: 0,
        isActive: true
      });
    }
    setIsEditModalOpen(true);
  };

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
      await apiClient.delete('/admin/economy/coins/' + selectedPackage._id);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Economy & Payouts</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-surface-900 rounded-[24px] p-6 shadow-soft border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-xl">
               <DollarSign className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Packages</p>
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{coins.length}</h3>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 p-6">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white">Coin Packages</h3>
           <button onClick={() => openEditModal()} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20">
             <Plus className="w-4 h-4" /> Add Package
           </button>
         </div>

         {loading ? (
            <p className="text-gray-500">Loading packages...</p>
         ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {coins.map(pkg => (
                <div key={pkg._id} className="p-5 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-surface-800 flex justify-between items-center group relative overflow-hidden">
                  {pkg.bonus > 0 && (
                    <div className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                      +{pkg.bonus} BONUS
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{pkg.coins} Coins</p>
                    <div className="flex items-center gap-2 mt-1">
                       <p className="text-sm text-brand-600 dark:text-brand-400 font-bold">₹{pkg.priceINR}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(pkg)} className="p-2 text-gray-400 hover:text-brand-500 bg-white dark:bg-surface-900 rounded-lg shadow-sm transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setSelectedPackage(pkg); setIsDeleteModalOpen(true); }} className="p-2 text-gray-400 hover:text-red-500 bg-white dark:bg-surface-900 rounded-lg shadow-sm transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
         )}
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-surface-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedPackage ? 'Edit Coin Package' : 'Add New Package'}
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-full transition-colors text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveChanges} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Base Coins</label>
                  <input
                    type="number"
                    required
                    value={formData.coins}
                    onChange={(e) => setFormData({ ...formData, coins: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-transparent focus:border-brand-500 rounded-xl text-sm outline-none dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <GiftIcon className="w-3.5 h-3.5 text-orange-500" /> Bonus
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-orange-50/50 dark:bg-orange-500/5 border border-transparent focus:border-orange-500 rounded-xl text-sm outline-none dark:text-white transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price (INR)</label>
                <input
                  type="number"
                  required
                  value={formData.priceINR}
                  onChange={(e) => setFormData({ ...formData, priceINR: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-transparent focus:border-brand-500 rounded-xl text-sm outline-none dark:text-white transition-all"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Package Active</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ' + (formData.isActive ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600')}
                >
                  <span className={'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' + (formData.isActive ? 'translate-x-6' : 'translate-x-1')} />
                </button>
              </div>
              
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25 mt-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : (selectedPackage ? 'Update Package' : 'Create Package')}
              </button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-surface-900 w-full max-w-sm rounded-[32px] p-8 shadow-2xl text-center border border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Package?</h2>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-surface-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={saving}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
