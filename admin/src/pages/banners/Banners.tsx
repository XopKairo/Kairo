import { useState } from 'react';
import { Plus, Image as ImageIcon, Trash2, Edit } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  status: string;
}

export default function Banners() {
  const [banners] = useState<Banner[]>([
    { id: '1', title: 'Welcome Bonus', imageUrl: 'https://via.placeholder.com/400x150', status: 'Active' },
    { id: '2', title: 'Diwali Offer', imageUrl: 'https://via.placeholder.com/400x150', status: 'Inactive' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">App Banners</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage promotional banners displayed on the mobile app.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20">
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map(banner => (
          <div key={banner.id} className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col group">
            <div className="h-32 bg-gray-100 dark:bg-surface-800 relative">
              <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/90 dark:bg-black/90 backdrop-blur-sm shadow-sm">
                {banner.status}
              </div>
            </div>
            <div className="p-5 flex justify-between items-center bg-white dark:bg-surface-900">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{banner.title}</h3>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 text-gray-400 hover:text-brand-500 rounded-lg hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
