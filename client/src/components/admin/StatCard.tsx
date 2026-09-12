import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: string;
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = '#6C63FF',
  trend,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{title}</span>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 font-medium">{subtitle}</p>}
        {trend && (
          <span className="inline-block text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>

      <div
        className="w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-md"
        style={{ backgroundColor: color }}
      >
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
};

export default StatCard;
