import React from 'react';

interface TableProps {
  headers: string[];
  data: React.ReactNode[][];
}

export const Table: React.FC<TableProps> = ({ headers, data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-50">
            {headers.map((header) => (
              <th key={header} className="pb-4 pt-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((row, i) => (
            <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-4 text-sm text-slate-600">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
