import { Flag, MessageCircle } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Reports & Support</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Handle user reports, flagged content, and tickets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-500" /> User Reports
            </h3>
            <p className="text-gray-500 text-sm">No new reports at this time.</p>
         </div>
         <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-brand-500" /> Support Tickets
            </h3>
            <p className="text-gray-500 text-sm">All tickets resolved.</p>
         </div>
      </div>
    </div>
  );
}
