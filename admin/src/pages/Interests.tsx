import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from "lucide-react";
import apiClient from "../api/apiClient";

interface InterestTag {
  _id: string;
  name: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
}

export default function Interests() {
  const [interests, setInterests] = useState<InterestTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", icon: "", isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchInterests = async () => {
    try {
      setError(null);
      const res = await apiClient.get("/admin/interests");
      setInterests(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch interests:", e);
      setError((e as any).response?.data?.message || "Failed to load interest tags.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInterests(); }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", icon: "", isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (tag: InterestTag) => {
    setEditingId(tag._id);
    setFormData({ name: tag.name, icon: tag.icon || "", isActive: tag.isActive });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await apiClient.put(`/admin/interests/${editingId}`, formData);
      } else {
        await apiClient.post("/admin/interests", formData);
      }
      setIsModalOpen(false);
      fetchInterests();
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to save interest tag");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this interest tag?")) return;
    try {
      await apiClient.delete(`/admin/interests/${id}`);
      fetchInterests();
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to delete tag");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interest Tags</h1>
        <button 
          onClick={openAddModal}
          className="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> Add New
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 font-bold">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-surface-800/50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="p-6">Name</th>
              <th className="p-6">Icon</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (<tr><td colSpan={4} className="p-10 text-center text-gray-400 font-medium">Loading interests...</td></tr>) : 
             interests.length === 0 ? (<tr><td colSpan={4} className="p-10 text-center text-gray-500 font-medium">No interest tags found.</td></tr>) :
             interests.map(tag => (
              <tr key={tag._id} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/30 transition-colors">
                <td className="p-6">
                  <p className="font-bold text-gray-900 dark:text-white leading-none">{tag.name}</p>
                </td>
                <td className="p-6">
                  <span className="text-2xl">{tag.icon || "—"}</span>
                </td>
                <td className="p-6">
                  {tag.isActive ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg w-max border border-green-200">
                      <CheckCircle size={14}/> Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg w-max border border-gray-200">
                      <XCircle size={14}/> Inactive
                    </span>
                  )}
                </td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-1">
                    <button 
                      onClick={() => openEditModal(tag)} 
                      className="p-2.5 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                      title="Edit"
                    >
                      <Edit2 size={18}/>
                    </button>
                    <button 
                      onClick={() => handleDelete(tag._id)} 
                      className="p-2.5 text-red-600 hover:bg-red-100 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? "Edit Interest Tag" : "Add Interest Tag"}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  placeholder="e.g. Music, Gaming"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Icon (Emoji or URL)</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-surface-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  placeholder="e.g. 🎵, 🎮"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                  Active (Visible to users)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
