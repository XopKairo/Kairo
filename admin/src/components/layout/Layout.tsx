import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';


interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 font-sans text-gray-900 dark:text-gray-100 transition-colors duration-200 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto p-6 md:p-8 relative scroll-smooth">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
