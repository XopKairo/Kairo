import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, DownloadCloud, Plus, Edit, Trash2 } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface CoinPackage {
  _id: string;
  coins: number;
  priceINR: number;
  isActive: boolean;
}

export default function Economy() {
  const [coins, setCoins] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchEconomy();
  }, []);

  const handleAction = (action: string, id?: string) => {
    alert(`${action} Coin Package ${id ? id : ''}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Economy & Payouts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage transactions, coin packages, and payouts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-surface-900 rounded-[24px] p-6 shadow-soft border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-xl">
               <DollarSign className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Packages</p>
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{coins.length}</h3>
             </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-[24px] p-6 shadow-soft border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-xl">
               <CreditCard className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Coin Sales</p>
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Active</h3>
             </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-[24px] p-6 shadow-soft border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-xl">
               <DownloadCloud className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pending Payouts</p>
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white">0</h3>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 p-6">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white">Coin Packages</h3>
           <button onClick={() => handleAction('Add')} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20">
             <Plus className="w-4 h-4" /> Add Package
           </button>
         </div>

         {loading ? (
            <p className="text-gray-500">Loading packages...</p>
         ) : coins.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {coins.map(pkg => (
                <div key={pkg._id} className="p-5 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-surface-800 flex justify-between items-center group">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{pkg.coins} Coins</p>
                    <p className="text-sm text-brand-600 dark:text-brand-400 font-medium mt-1">₹{pkg.priceINR}</p>
                    <span className={`inline-block mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${pkg.isActive ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                      {pkg.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleAction('Edit', pkg._id)} className="p-2 text-gray-400 hover:text-brand-500 bg-white dark:bg-surface-900 rounded-lg shadow-sm transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleAction('Delete', pkg._id)} className="p-2 text-gray-400 hover:text-red-500 bg-white dark:bg-surface-900 rounded-lg shadow-sm transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
         ) : (
            <p className="text-gray-500 text-center py-8">No coin packages found. Create one to get started.</p>
         )}
      </div>
    </div>
  );
}
