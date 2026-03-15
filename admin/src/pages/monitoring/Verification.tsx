import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import apiClient from "../../api/apiClient";

interface VerificationRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    phone: string;
    gender?: string;
    profilePicture?: string;
  } | null;
  photoUrl: string;
  idUrl: string;
  status: string;
  createdAt: string;
}

export default function Verification() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setError(null);
      const res = await apiClient.get("/admin/verification");
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error("Failed to fetch verification requests:", e);
      setError(e.response?.data?.message || "Failed to load requests. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleStatus = async (id: string, status: string) => {
    if (!window.confirm(`Are you sure you want to ${status} this request?`)) return;
    try {
      await apiClient.post(`/admin/verification/${id}/status`, { status });
      fetchRequests();
    } catch (e) {
      alert((e as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Host Verification Requests</h1>
        <button 
          onClick={fetchRequests}
          className="px-4 py-2 bg-brand-50 text-brand-600 text-sm font-bold rounded-xl hover:bg-brand-100 transition-colors"
        >
          Refresh
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
              <th className="p-6">User Details</th>
              <th className="p-6">Gender</th>
              <th className="p-6">Verification Files</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (<tr><td colSpan={5} className="p-10 text-center text-gray-400 font-medium">Loading requests...</td></tr>) : 
             requests.length === 0 ? (<tr><td colSpan={5} className="p-10 text-center text-gray-500 font-medium">No pending requests found.</td></tr>) :
             requests.map(r => (
              <tr key={r._id} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/30 transition-colors">
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    <img 
                      src={r.userId?.profilePicture || `https://ui-avatars.com/api/?name=${r.userId?.name || "Deleted"}&background=random`} 
                      className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-700"
                    />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white leading-none">{r.userId?.name || "Deleted User"}</p>
                      <p className="text-xs text-gray-400 mt-1">{r.userId?.phone || "N/A"}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    r.userId?.gender === "Female" ? "bg-pink-50 text-pink-600" : 
                    r.userId?.gender === "Male" ? "bg-blue-50 text-blue-600" : 
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {r.userId?.gender || "Not Set"}
                  </span>
                </td>
                <td className="p-6">
                  <div className="flex gap-2">
                    <button onClick={() => window.open(r.photoUrl, "_blank")} className="flex items-center gap-1.5 text-brand-600 text-[11px] font-black bg-brand-50 px-3 py-2 rounded-xl hover:bg-brand-100 transition-all border border-brand-100/50">
                      <Eye size={14}/> SELFIE
                    </button>
                    <button onClick={() => window.open(r.idUrl, "_blank")} className="flex items-center gap-1.5 text-blue-600 text-[11px] font-black bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition-all border border-blue-100/50">
                      <Eye size={14}/> ID PROOF
                    </button>
                  </div>
                </td>
                <td className="p-6">
                  <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                    r.status === "pending" ? "bg-orange-100 text-orange-600" : 
                    r.status === "approved" ? "bg-green-100 text-green-600 border border-green-200" : 
                    "bg-red-100 text-red-600 border border-red-200"
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-6 text-right">
                  <div className="flex justify-end gap-1">
                    {r.status === "pending" ? (
                      <>
                        <button 
                          onClick={() => handleStatus(r._id, "approved")} 
                          className="p-2.5 text-green-600 hover:bg-green-100 rounded-xl transition-all hover:scale-110"
                          title="Approve Host"
                        >
                          <CheckCircle size={22}/>
                        </button>
                        <button 
                          onClick={() => handleStatus(r._id, "rejected")} 
                          className="p-2.5 text-red-600 hover:bg-red-100 rounded-xl transition-all hover:scale-110"
                          title="Reject Request"
                        >
                          <XCircle size={22}/>
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 font-medium italic">Processed</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
