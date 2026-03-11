import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import apiClient from "../../api/apiClient";

interface VerificationRequest {
  _id: string;
  userId: {
    _id: string;
    name: string;
    phone: string;
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
      console.log("Verification Data:", res.data);
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
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
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Host Verification Requests</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 font-bold">
          ⚠️ {error}
        </div>
      )}

      <div className="bg-white dark:bg-surface-900 rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-surface-800/50 text-gray-500 text-xs font-bold uppercase tracking-widest border-b border-gray-100 dark:border-gray-800">
            <tr>
              <th className="p-6">User</th>
              <th className="p-6">Photos</th>
              <th className="p-6">Status</th>
              <th className="p-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading ? (<tr><td colSpan={4} className="p-10 text-center text-gray-400">Loading requests...</td></tr>) : 
             requests.length === 0 ? (<tr><td colSpan={4} className="p-10 text-center text-gray-500">No requests found in database.</td></tr>) :
             requests.map(r => (
              <tr key={r._id} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/30 transition-colors">
                <td className="p-6">
                  <p className="font-bold text-gray-900 dark:text-white">{r.userId?.name || "Deleted User"}</p>
                  <p className="text-xs text-gray-400">{r.userId?.phone || "N/A"}</p>
                </td>
                <td className="p-6 flex gap-3">
                  <button onClick={() => window.open(r.photoUrl, "_blank")} className="flex items-center gap-1 text-brand-600 text-xs font-bold bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100"><Eye size={14}/> Selfie</button>
                  <button onClick={() => window.open(r.idUrl, "_blank")} className="flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100"><Eye size={14}/> ID Proof</button>
                </td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${r.status === "pending" ? "bg-orange-100 text-orange-600" : r.status === "approved" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>{r.status}</span>
                </td>
                <td className="p-6 text-right space-x-2">
                  {r.status === "pending" && (<>
                    <button onClick={() => handleStatus(r._id, "approved")} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><CheckCircle size={20}/></button>
                    <button onClick={() => handleStatus(r._id, "rejected")} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><XCircle size={20}/></button>
                  </>)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
