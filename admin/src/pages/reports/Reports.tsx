import { useState, useEffect } from 'react';
import { Flag, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../../api/apiClient';

interface Report {
  _id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsExpanded, setReportsExpanded] = useState(true);
  const [ticketsExpanded, setTicketsExpanded] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await apiClient.get('/admin/reports');
        setReports(response.data);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Reports & Support</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Handle user reports, flagged content, and tickets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden">
            <button onClick={() => setReportsExpanded(!reportsExpanded)} className="w-full p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" /> User Reports
              </h3>
              {reportsExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {reportsExpanded && (
              <div className="px-6 pb-6 pt-0 border-t border-gray-100 dark:border-gray-800">
                {loading ? (
                  <p className="text-gray-500 text-sm mt-4">Loading reports...</p>
                ) : reports.length > 0 ? (
                  <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto pr-2">
                    {reports.map((report) => (
                      <div key={report._id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-surface-800">
                        <p className="text-sm font-medium dark:text-white">{report.reason}</p>
                        <div className="flex justify-between items-center mt-3">
                          <p className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${report.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {report.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mt-4 text-center py-8">No new reports at this time.</p>
                )}
              </div>
            )}
         </div>
         <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden h-fit">
            <button onClick={() => setTicketsExpanded(!ticketsExpanded)} className="w-full p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-surface-800 transition-colors">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-brand-500" /> Support Tickets
              </h3>
              {ticketsExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>
            {ticketsExpanded && (
              <div className="px-6 pb-6 pt-0 border-t border-gray-100 dark:border-gray-800">
                <p className="text-gray-500 text-sm mt-4 text-center py-8">All tickets resolved.</p>
              </div>
            )}
         </div>
      </div>
    </div>
  );
}
