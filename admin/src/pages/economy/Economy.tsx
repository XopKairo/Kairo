import { DollarSign, CreditCard, DownloadCloud } from 'lucide-react';

export default function Economy() {
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
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Revenue</p>
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white">$124,500</h3>
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
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white">$98,200</h3>
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
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white">$12,300</h3>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 p-6 text-center">
         <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Transactions Module</h3>
         <p className="text-gray-500">Transaction history and payout management tables will go here.</p>
      </div>
    </div>
  );
}
