
import { Search, Plus, Filter, MoreHorizontal, FileText } from 'lucide-react';

const invoices = [
  { id: 'INV-2023-001', client: 'Acme Corp', amount: '$1,200.00', date: 'Oct 12, 2023', status: 'Paid' },
  { id: 'INV-2023-002', client: 'Globex Inc', amount: '$3,450.00', date: 'Oct 15, 2023', status: 'Pending' },
  { id: 'INV-2023-003', client: 'Soylent Corp', amount: '$850.00', date: 'Oct 18, 2023', status: 'Overdue' },
  { id: 'INV-2023-004', client: 'Initech', amount: '$4,200.00', date: 'Oct 20, 2023', status: 'Paid' },
];

export default function Invoices() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Invoices</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your billing and invoices.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20">
          <Plus className="w-4 h-4" />
          Create Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-surface-900 rounded-[24px] p-6 shadow-soft border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-brand-50 dark:bg-brand-500/10 text-brand-500 rounded-xl">
               <FileText className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Invoices</p>
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white">1,245</h3>
             </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-[24px] p-6 shadow-soft border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-xl">
               <FileText className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Paid Invoices</p>
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white">982</h3>
             </div>
          </div>
        </div>
        <div className="bg-white dark:bg-surface-900 rounded-[24px] p-6 shadow-soft border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-xl">
               <FileText className="w-6 h-6" />
             </div>
             <div>
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pending Invoices</p>
               <h3 className="text-2xl font-bold text-gray-900 dark:text-white">263</h3>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-surface-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow dark:text-white border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-surface-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-surface-800/50 text-gray-500 dark:text-gray-400 text-sm font-medium">
                <th className="py-4 px-6 font-medium">Invoice ID</th>
                <th className="py-4 px-6 font-medium">Client</th>
                <th className="py-4 px-6 font-medium">Amount</th>
                <th className="py-4 px-6 font-medium">Date</th>
                <th className="py-4 px-6 font-medium">Status</th>
                <th className="py-4 px-6 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-surface-800/50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{inv.id}</td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{inv.client}</td>
                  <td className="py-4 px-6 font-medium text-gray-900 dark:text-white">{inv.amount}</td>
                  <td className="py-4 px-6 text-gray-600 dark:text-gray-300">{inv.date}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium
                      ${inv.status === 'Paid' ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 
                        inv.status === 'Pending' ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400' : 
                        'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="text-gray-400 hover:text-brand-500 transition-colors">
                      <MoreHorizontal className="w-5 h-5 ml-auto" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <span>Showing 1 to 4 of 4 entries</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-surface-800 disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 rounded-lg bg-brand-600 text-white">1</button>
            <button className="px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-surface-800">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
