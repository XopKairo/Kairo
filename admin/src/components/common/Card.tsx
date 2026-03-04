import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, action }) => {
  return (
    <div className={cn("bg-white border border-slate-100 shadow-soft rounded-[24px] p-6 transition-all duration-300 hover:shadow-lg hover:shadow-brand-500/5", className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-6">
          {title && <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
};
