import { Settings as SettingsIcon, Smartphone } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">App Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Configure global application variables and features.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 p-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-brand-500" /> App Banners
              </h3>
              <div className="space-y-4">
                 <button className="px-4 py-2 bg-gray-50 dark:bg-surface-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium w-full text-left">Manage Home Banners</button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-brand-500" /> Global Configuration
              </h3>
              <div className="space-y-4">
                 <button className="px-4 py-2 bg-gray-50 dark:bg-surface-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium w-full text-left">Coin Pricing & Packages</button>
                 <button className="px-4 py-2 bg-gray-50 dark:bg-surface-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium w-full text-left">System Maintenance Mode</button>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}
