import { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, ShieldCheck } from 'lucide-react';
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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [formData, setFormData] = useState({ name: '', ownerName: '', phone: '', password: '', commissionPercentage: 10 });

  const fetchAgencies = async () => {
    try {
      const res = await apiClient.get('/admin/agencies');
      setAgencies(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      console.error('Fetch agencies failed:', e);
    }
  };

  useEffect(() => { fetchAgencies(); }, []);

  const handleAddAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/admin/agencies', formData);
      setIsAddModalOpen(false);
      setFormData({ name: '', ownerName: '', phone: '', password: '', commissionPercentage: 10 });
      fetchAgencies();
    } catch { alert('Failed to create agency'); }
  };

  const handleUpdateAgency = async () => {
    if (!selectedAgency) return;
    try {
      await apiClient.put(`/admin/agencies/${selectedAgency._id}`, selectedAgency);
      setIsEditModalOpen(false);
      fetchAgencies();
    } catch { alert('Failed to update'); }
  };

  const handleDeleteAgency = async (id: string) => {
    if (!window.confirm('Delete this agency? All hosts will be unassigned.')) return;
    try {
      await apiClient.delete(`/admin/agencies/${id}`);
      fetchAgencies();
    } catch { alert('Failed to delete'); }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Agency Control</h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Manage network partners and commissions</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-4 rounded-[24px] font-black flex items-center gap-2 shadow-lg shadow-brand-500/30 transition-all"
        >
          <Plus size={20} strokeWidth={3}/> REGISTER AGENCY
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {agencies.map(a => (
          <div key={a._id} className="bg-white dark:bg-surface-900 p-8 rounded-[40px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-brand-50 dark:bg-brand-900/20 rounded-3xl group-hover:scale-110 transition-transform">
                <Building2 className="text-brand-600 w-6 h-6" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedAgency(a); setIsEditModalOpen(true); }} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"><Edit size={18}/></button>
                <button onClick={() => handleDeleteAgency(a._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
              </div>
            </div>
            
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-1 uppercase tracking-tight">{a.name}</h3>
            <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <ShieldCheck size={12} className="text-brand-500" /> OWNER: {a.ownerName}
            </p>
            
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-50 dark:border-gray-800">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Network Size</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{a.totalHosts} <span className="text-xs font-bold text-gray-400">HOSTS</span></p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Commission</p>
                <p className="text-xl font-black text-brand-600">{a.commissionPercentage}%</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${a.isActive ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {a.isActive ? 'OPERATIONAL' : 'DEACTIVATED'}
               </span>
               <p className="text-xs font-bold text-gray-400">{a.phone}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[40px] p-10 border border-white/10 shadow-2xl">
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Register Network Partner</h2>
            <form onSubmit={handleAddAgency} className="space-y-5">
              <input required placeholder="AGENCY NAME" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required placeholder="OWNER NAME" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} />
              <input required placeholder="PHONE" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input required type="password" placeholder="SECURE PASSWORD" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <div className="pt-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Initial Commission %</label>
                <input type="number" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm mt-2" value={formData.commissionPercentage} onChange={e => setFormData({...formData, commissionPercentage: parseInt(e.target.value)})} />
              </div>
              <button className="w-full py-5 bg-brand-600 text-white rounded-[24px] font-black mt-6 shadow-xl shadow-brand-500/20">AUTHORIZE AGENCY</button>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="w-full py-2 text-gray-500 font-bold uppercase text-xs tracking-widest mt-2">CANCEL</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedAgency && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[40px] p-10 border border-white/10">
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter">Update Agency</h2>
            <div className="space-y-5">
              <input placeholder="AGENCY NAME" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm" value={selectedAgency.name} onChange={e => setSelectedAgency({...selectedAgency, name: e.target.value})} />
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Commission Percentage</label>
                <input type="number" className="w-full p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl font-bold text-sm mt-2" value={selectedAgency.commissionPercentage} onChange={e => setSelectedAgency({...selectedAgency, commissionPercentage: parseInt(e.target.value)})} />
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-surface-800 rounded-2xl">
                 <input type="checkbox" checked={selectedAgency.isActive} onChange={e => setSelectedAgency({...selectedAgency, isActive: e.target.checked})} className="w-5 h-5 accent-brand-600" />
                 <span className="text-sm font-bold uppercase tracking-widest">Active Partner</span>
              </div>
              <button onClick={handleUpdateAgency} className="w-full py-5 bg-brand-600 text-white rounded-[24px] font-black mt-6 shadow-xl">SAVE UPDATES</button>
              <button onClick={() => setIsEditModalOpen(false)} className="w-full py-2 text-gray-500 font-bold uppercase text-xs">CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
