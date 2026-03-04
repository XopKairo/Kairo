import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, DownloadCloud } from 'lucide-react';
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
         <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Coin Packages</h3>
         {loading ? (
            <p className="text-gray-500">Loading packages...</p>
         ) : coins.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {coins.map(pkg => (
                <div key={pkg._id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-surface-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{pkg.coins} Coins</p>
                    <p className="text-sm text-gray-500">₹{pkg.priceINR}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {pkg.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
         ) : (
            <p className="text-gray-500">No coin packages found.</p>
         )}
      </div>
    </div>
  );
}
