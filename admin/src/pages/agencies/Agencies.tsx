import { useState, useEffect } from 'react';
import { Building2, Plus } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface Agency {
  _id: string;
  name: string;
  ownerName: string;
  phone: string;
  commissionPercentage: number;
  totalHosts: number;
  balance: number;
  isActive: boolean;
}

export default function Agencies() {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', ownerName: '', phone: '', password: '', commissionPercentage: 10 });

  const fetchAgencies = async () => {
    try {
      const res = await apiClient.get('/api/admin/agencies');
      setAgencies(res.data);
    } catch {
      console.error(e);
    }
  };

  useEffect(() => { fetchAgencies(); }, []);

  const handleAddAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/admin/agencies', formData);
      setIsAddModalOpen(false);
      fetchAgencies();
    } catch { alert('Failed'); }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agency Management</h1>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
        >
          <Plus size={20}/> New Agency
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agencies.map(a => (
          <div key={a._id} className="bg-white dark:bg-surface-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-2xl">
                <Building2 className="text-brand-600" />
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${a.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {a.isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{a.name}</h3>
            <p className="text-sm text-gray-500 mb-6">Owner: {a.ownerName}</p>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 dark:border-gray-800">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Hosts</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{a.totalHosts}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Commission</p>
                <p className="text-lg font-bold text-brand-600">{a.commissionPercentage}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[32px] p-8 border border-white/10">
            <h2 className="text-2xl font-bold mb-6">Register Agency</h2>
            <form onSubmit={handleAddAgency} className="space-y-4">
              <input required placeholder="Agency Name" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required placeholder="Owner Name" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} />
              <input required placeholder="Phone Number" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input required type="password" placeholder="Password" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <button className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold mt-4">Create Agency</button>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
