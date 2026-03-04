import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Smartphone } from 'lucide-react';
import apiClient from '../../api/apiClient';

export default function Settings() {
  const [maintenance, setMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiClient.get('/settings');
      if (response.data) {
        setMaintenance(response.data.maintenance || false);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaintenance = async () => {
    setSaving(true);
    const newStatus = !maintenance;
    try {
      await apiClient.put('/settings', { maintenance: newStatus });
      setMaintenance(newStatus);
    } catch (error) {
      console.error('Failed to update maintenance mode:', error);
      alert('Failed to update maintenance mode. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading settings...</div>;
  }

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
                 <button className="px-4 py-2 bg-gray-50 dark:bg-surface-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium w-full text-left hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors">Manage Home Banners</button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-brand-500" /> Global Configuration
              </h3>
              <div className="space-y-4">
                 <button className="px-4 py-2 bg-gray-50 dark:bg-surface-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium w-full text-left hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors">Coin Pricing & Packages</button>
                 
                 <div className="p-4 bg-gray-50 dark:bg-surface-800 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">System Maintenance Mode</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">When enabled, the app will be inaccessible to users.</p>
                    </div>
                    <button 
                      onClick={toggleMaintenance}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
                        maintenance ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                      } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span className="sr-only">Toggle maintenance mode</span>
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          maintenance ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                 </div>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}
