import { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, Trash2, Edit, X } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface Banner {
  _id: string;
  id?: string;
  title: string;
  imageUrl: string;
  status: string;
  startDate?: string;
  endDate?: string;
}

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    status: 'Active',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/banners');
      setBanners(response.data);
    } catch (error: any) {
      console.error('Failed to fetch banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (banner?: Banner) => {
    if (banner) {
      setSelectedBanner(banner);
      setFormData({
        title: banner.title,
        imageUrl: banner.imageUrl,
        status: banner.status,
        startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
        endDate: banner.endDate ? banner.endDate.split('T')[0] : ''
      });
    } else {
      setSelectedBanner(null);
      setFormData({
        title: '',
        imageUrl: '',
        status: 'Active',
        startDate: '',
        endDate: ''
      });
    }
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsDeleteModalOpen(true);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedBanner) {
        await apiClient.put(`/admin/banners/${selectedBanner._id || selectedBanner.id}`, formData);
      } else {
        await apiClient.post('/admin/banners', formData);
      }
      fetchBanners();
      setIsEditModalOpen(false);
    } catch {
      alert('Failed to save banner');
    }
  };

  const confirmDelete = async () => {
    if (selectedBanner) {
      try {
        await apiClient.delete(`/admin/banners/${selectedBanner._id || selectedBanner.id}`);
        fetchBanners();
        setIsDeleteModalOpen(false);
      } catch {
        alert('Failed to delete banner');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">App Banners</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage promotional banners displayed on the mobile app.</p>
        </div>
        <button onClick={() => openEditModal()} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20">
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading banners...</div>
      ) : banners.length === 0 ? (
        <div className="p-12 bg-white dark:bg-surface-900 rounded-[32px] border border-dashed border-gray-200 dark:border-gray-800 text-center">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No banners found. Click 'Add Banner' to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map(banner => {
            const bannerId = banner._id || banner.id || '';
            return (
            <div key={bannerId} className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col group">
              <div className="h-32 bg-gray-100 dark:bg-surface-800 relative">
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm ${banner.status === 'Active' ? 'bg-green-500/90 text-white' : 'bg-white/90 dark:bg-black/90 text-gray-600 dark:text-gray-400'}`}>
                  {banner.status}
                </div>
              </div>
              <div className="p-5 flex justify-between items-center bg-white dark:bg-surface-900">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-lg">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[120px]">{banner.title}</h3>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(banner)} className="p-1.5 text-gray-400 hover:text-brand-500 rounded-lg hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => openDeleteModal(banner)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Edit/Add Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-surface-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-200 border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedBanner ? 'Edit Banner' : 'Add New Banner'}
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-surface-800 rounded-full transition-colors text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveChanges} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Banner Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Welcome Special Offer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-transparent focus:border-brand-500 rounded-xl text-sm outline-none dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="Enter image URL"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-transparent focus:border-brand-500 rounded-xl text-sm outline-none dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                <select 
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-transparent focus:border-brand-500 rounded-xl text-sm outline-none dark:text-white transition-all appearance-none cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-transparent focus:border-brand-500 rounded-xl text-sm outline-none dark:text-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-surface-800 border border-transparent focus:border-brand-500 rounded-xl text-sm outline-none dark:text-white transition-all"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full py-3 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25 mt-2"
              >
                {selectedBanner ? 'Update Banner' : 'Create Banner'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-surface-900 w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in duration-200 border border-gray-100 dark:border-gray-800 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Banner?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Are you sure you want to delete this promotional banner?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-surface-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-surface-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-500/25"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
