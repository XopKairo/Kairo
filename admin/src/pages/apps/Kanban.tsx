
import { MoreHorizontal, Plus } from 'lucide-react';

const tasks = {
  todo: [
    { id: 1, title: 'Redesign landing page website for company profile', tags: ['Design', 'UI/UX'], date: 'Oct 12', assignees: ['A', 'B'] },
    { id: 2, title: 'Update server configuration', tags: ['DevOps'], date: 'Oct 15', assignees: ['C'] },
  ],
  progress: [
    { id: 3, title: 'API integration for payment gateway', tags: ['Backend', 'API'], date: 'Oct 10', assignees: ['D', 'E'] },
  ],
  done: [
    { id: 4, title: 'Client meeting for requirement gathering', tags: ['Meeting'], date: 'Oct 05', assignees: ['A', 'D'] },
  ]
};

const TaskCard = ({ task }: { task: { id: number; title: string; tags: string[]; date: string; assignees: string[] } }) => (
  <div className="bg-white dark:bg-surface-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-4 cursor-grab active:cursor-grabbing hover:border-brand-500 transition-colors">
    <div className="flex gap-2 mb-3">
      {task.tags.map((tag: string) => (
        <span key={tag} className="px-2.5 py-1 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs font-semibold rounded-md">
          {tag}
        </span>
      ))}
    </div>
    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 line-clamp-2">
      {task.title}
    </h4>
    <div className="flex justify-between items-center">
      <div className="flex -space-x-2">
        {task.assignees.map((assignee: string, idx: number) => (
          <div key={idx} className="w-6 h-6 rounded-full bg-gradient-to-r from-brand-400 to-brand-600 border-2 border-white dark:border-surface-800 flex items-center justify-center text-[10px] font-bold text-white">
            {assignee}
          </div>
        ))}
      </div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{task.date}</span>
    </div>
  </div>
);

export default function Kanban() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Kanban Board</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your projects clearly.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20">
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {/* To Do Column */}
        <div className="flex-none w-80 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              To-Do List <span className="px-2 py-0.5 bg-gray-100 dark:bg-surface-800 text-gray-600 dark:text-gray-300 rounded-full text-xs">{tasks.todo.length}</span>
            </h3>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 bg-gray-50/50 dark:bg-surface-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
            {tasks.todo.map(task => <TaskCard key={task.id} task={task} />)}
            <button className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-600 hover:bg-white dark:hover:bg-surface-800 rounded-xl transition-colors border border-transparent hover:border-brand-200 dark:hover:border-brand-800">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>

        {/* In Progress Column */}
        <div className="flex-none w-80 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              On Progress <span className="px-2 py-0.5 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full text-xs">{tasks.progress.length}</span>
            </h3>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 bg-gray-50/50 dark:bg-surface-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
             {tasks.progress.map(task => <TaskCard key={task.id} task={task} />)}
             <button className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-600 hover:bg-white dark:hover:bg-surface-800 rounded-xl transition-colors border border-transparent hover:border-brand-200 dark:hover:border-brand-800">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>

        {/* Done Column */}
        <div className="flex-none w-80 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Done <span className="px-2 py-0.5 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-xs">{tasks.done.length}</span>
            </h3>
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 bg-gray-50/50 dark:bg-surface-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
             {tasks.done.map(task => <TaskCard key={task.id} task={task} />)}
             <button className="w-full py-3 flex items-center justify-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-600 hover:bg-white dark:hover:bg-surface-800 rounded-xl transition-colors border border-transparent hover:border-brand-200 dark:hover:border-brand-800">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
