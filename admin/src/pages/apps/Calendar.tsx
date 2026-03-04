
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function Calendar() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dates = Array.from({ length: 35 }, (_, i) => i - 2);

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your schedule and events.</p>
        </div>
        <div className="flex gap-3">
           <div className="flex bg-gray-50 dark:bg-surface-800 p-1 rounded-xl">
             <button className="px-4 py-1.5 text-sm font-medium rounded-lg bg-white dark:bg-surface-900 shadow-sm text-gray-900 dark:text-white">Month</button>
             <button className="px-4 py-1.5 text-sm font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Week</button>
             <button className="px-4 py-1.5 text-sm font-medium rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Day</button>
           </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20">
            <Plus className="w-4 h-4" />
            New Event
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col">
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
           <h2 className="text-xl font-bold text-gray-900 dark:text-white">October 2023</h2>
           <div className="flex gap-2">
             <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-surface-800 text-gray-600 dark:text-gray-300">
               <ChevronLeft className="w-5 h-5" />
             </button>
             <button className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-surface-800 text-gray-600 dark:text-gray-300">
               <ChevronRight className="w-5 h-5" />
             </button>
           </div>
        </div>

        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-surface-800/50">
          {days.map((day) => (
            <div key={day} className="py-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-gray-100 dark:bg-gray-800 gap-[1px]">
          {dates.map((date, i) => {
             const isCurrentMonth = date > 0 && date <= 31;
             const isToday = date === 12;
             const hasEvent = date === 15 || date === 22;

             return (
               <div key={i} className={`bg-white dark:bg-surface-900 p-2 min-h-[100px] transition-colors hover:bg-gray-50 dark:hover:bg-surface-800 ${!isCurrentMonth ? 'opacity-40' : ''}`}>
                 <div className="flex justify-between items-start">
                   <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-brand-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                     {date > 0 ? (date > 31 ? date - 31 : date) : 30 + date}
                   </span>
                 </div>
                 {hasEvent && (
                   <div className="mt-2">
                     <div className="text-xs px-2 py-1 rounded bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400 font-medium truncate mb-1">
                       Weekly Meeting
                     </div>
                   </div>
                 )}
                 {date === 18 && (
                   <div className="mt-2">
                     <div className="text-xs px-2 py-1 rounded bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400 font-medium truncate">
                       Server Maintenance
                     </div>
                   </div>
                 )}
               </div>
             )
          })}
        </div>
      </div>
    </div>
  );
}
