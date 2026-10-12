import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  color?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  onClick,
}) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-blue-700 border-blue-100',
      iconBg: 'bg-blue-600 text-white',
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      iconBg: 'bg-indigo-600 text-white',
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      iconBg: 'bg-emerald-600 text-white',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-800 border-amber-100',
      iconBg: 'bg-amber-600 text-white',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-700 border-rose-100',
      iconBg: 'bg-rose-600 text-white',
    },
    slate: {
      bg: 'bg-slate-50 text-slate-700 border-slate-200',
      iconBg: 'bg-slate-700 text-white',
    },
  };

  const scheme = colorMap[color];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && <p className="text-xs text-emerald-600 font-medium mt-1">{trend}</p>}
        </div>
        <div className={`p-2.5 rounded-xl shadow-xs shrink-0 ${scheme.iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
