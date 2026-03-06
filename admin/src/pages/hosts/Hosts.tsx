import { useState, useEffect } from 'react';
import { MoreHorizontal, CheckCircle, Edit, Eye } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface Host {
  id?: string;
  _id?: string;
  name?: string;
  agency?: string;
  status?: string;
  isVerified?: boolean;
  profilePicture?: string;
  verificationSelfie?: string;
}

export default function Hosts() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingHost, setEditingHost] = useState<Host | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const fetchHosts = async () => {
    try {
      const response = await apiClient.get('/admin/hosts');
      setHosts(response.data);
    } catch (error) {}
  };

  useEffect(() => { fetchHosts(); }, []);

  const toggleMenu = (id: string) => {
    setActiveMenu(activeMenu === id ? null : id);
  };

  const handleUpdateHost = async () => {
    if (!editingHost) return;
    try {
      await apiClient.put('/admin/hosts/' + (editingHost._id || editingHost.id), editForm);
      fetchHosts();
      setIsEditModalOpen(false);
    } catch (e) { alert('Failed'); }
  };

  const handleVerify = async (id: string, isVerified: boolean) => {
    try {
      await apiClient.post('/admin/hosts/' + id + '/verify', { isVerified });
      fetchHosts();
      setActiveMenu(null);
    } catch (error) {}
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Hosts & Verification</h1>

      <div className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-surface-800 text-gray-500 text-sm">
            <tr>
              <th className="p-6">Host</th>
              <th className="p-6">Agency</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            {hosts.map(host => {
              const rowId = (host._id || host.id || "").toString();
              return (
                <tr key={rowId}>
                  <td className="p-6 flex items-center gap-3">
                    <img src={host.profilePicture || "https://ui-avatars.com/api/?name="+host.name} className="w-10 h-10 rounded-full" />
                    <span className="font-bold">{host.name}</span>
                  </td>
                  <td className="p-6 text-gray-500">{host.agency || 'None'}</td>
                  <td className="p-6 text-right relative">
                    <button onClick={() => window.open(host.verificationSelfie, '_blank')} className="text-blue-500 mr-2"><Eye size={18}/></button>
                    <button onClick={() => toggleMenu(rowId)}><MoreHorizontal /></button>
                    {activeMenu === rowId && (
                      <div className="absolute right-6 top-12 w-48 bg-white dark:bg-surface-800 border rounded-2xl shadow-xl z-50 p-2">
                        <button onClick={() => { setEditingHost(host); setEditForm({...host}); setIsEditModalOpen(true); setActiveMenu(null); }} className="w-full text-left p-3 hover:bg-gray-50 rounded-xl flex gap-2 text-sm"><Edit size={16}/> Edit Host</button>
                        {!host.isVerified && <button onClick={() => handleVerify(rowId, true)} className="w-full text-left p-3 hover:bg-green-50 rounded-xl flex gap-2 text-sm text-green-600"><CheckCircle size={16}/> Approve</button>}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white dark:bg-surface-900 w-full max-w-md rounded-[32px] p-8">
            <h2 className="text-xl font-bold mb-6">Edit Host</h2>
            <div className="space-y-4">
              <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-3 border rounded-xl" />
              <button onClick={handleUpdateHost} className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold">Save</button>
              <button onClick={() => setIsEditModalOpen(false)} className="w-full py-2 text-gray-500">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}