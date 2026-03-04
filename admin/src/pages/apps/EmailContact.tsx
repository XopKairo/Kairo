import { useState } from 'react';
import { Mail, Search, Send, File, Archive, Trash2, Edit3, Phone, Video } from 'lucide-react';

const contacts = [
  { id: 1, name: 'Angela Moss', email: 'angela@example.com', role: 'Project Manager', online: true, image: 'https://ui-avatars.com/api/?name=Angela+Moss&background=7C3AED&color=fff' },
  { id: 2, name: 'Ahmad Zayn', email: 'ahmad@example.com', role: 'Developer', online: false, image: 'https://ui-avatars.com/api/?name=Ahmad+Zayn&background=F472B6&color=fff' },
  { id: 3, name: 'Brian Connor', email: 'brian@example.com', role: 'Designer', online: true, image: 'https://ui-avatars.com/api/?name=Brian+Connor&background=3B82F6&color=fff' },
];

export default function EmailContact() {
  const [activeTab, setActiveTab] = useState('contacts');

  return (
    <div className="h-[calc(100vh-120px)] flex gap-6">
      <div className="w-64 bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 p-6 flex flex-col">
        <button className="w-full flex items-center justify-center gap-2 py-3 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm shadow-brand-500/20 mb-6">
          <Edit3 className="w-4 h-4" />
          Compose
        </button>

        <div className="space-y-1 mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Folders</p>
          {[
            { icon: Mail, label: 'Inbox', count: 12, active: activeTab === 'inbox' },
            { icon: Send, label: 'Sent', count: 0, active: activeTab === 'sent' },
            { icon: File, label: 'Draft', count: 3, active: activeTab === 'draft' },
            { icon: Archive, label: 'Archive', count: 0, active: activeTab === 'archive' },
            { icon: Trash2, label: 'Trash', count: 0, active: activeTab === 'trash' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label.toLowerCase())}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                item.active 
                  ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 font-medium' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-800 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
              {item.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${item.active ? 'bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300' : 'bg-gray-100 dark:bg-surface-800'}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2 flex justify-between">
            Contacts 
            <button onClick={() => setActiveTab('contacts')} className="text-brand-500 hover:text-brand-600">View All</button>
          </p>
          {contacts.slice(0, 3).map(contact => (
             <div key={contact.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-surface-800 cursor-pointer transition-colors">
               <div className="relative">
                 <img src={contact.image} alt={contact.name} className="w-8 h-8 rounded-full" />
                 {contact.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-surface-900 rounded-full"></div>}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{contact.name}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{contact.role}</p>
               </div>
             </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-surface-900 rounded-[24px] shadow-soft border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden">
        {activeTab === 'contacts' ? (
          <>
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Contacts</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your team and clients</p>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-surface-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow dark:text-white border-transparent"
                />
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
               {contacts.map(contact => (
                 <div key={contact.id} className="border border-gray-100 dark:border-gray-800 rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow dark:bg-surface-800/50">
                   <div className="relative mb-4">
                     <img src={contact.image} alt={contact.name} className="w-20 h-20 rounded-full" />
                     {contact.online && <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-surface-800 rounded-full"></div>}
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">{contact.name}</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{contact.role}</p>
                   <div className="flex gap-2 w-full mt-auto">
                     <button className="flex-1 py-2 bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl flex justify-center hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors">
                       <Mail className="w-4 h-4" />
                     </button>
                     <button className="flex-1 py-2 bg-gray-50 dark:bg-surface-800 text-gray-600 dark:text-gray-300 rounded-xl flex justify-center hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors">
                       <Phone className="w-4 h-4" />
                     </button>
                     <button className="flex-1 py-2 bg-gray-50 dark:bg-surface-800 text-gray-600 dark:text-gray-300 rounded-xl flex justify-center hover:bg-gray-100 dark:hover:bg-surface-700 transition-colors">
                       <Video className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
               ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6">
             <Mail className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-700" />
             <p className="text-lg font-medium text-gray-900 dark:text-white">Inbox Empty</p>
             <p className="text-sm text-center max-w-md mt-2">You don't have any messages in this folder yet. Check back later or start a new conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
