import React from 'react';
import { ShieldAlert, AlertCircle, Zap, CreditCard, HardDrive, UserCheck, LayoutGrid } from 'lucide-react';

interface ComplaintSeverityBadgeProps {
  priority: string;
  subject: string;
  description: string;
}

export const ComplaintSeverityBadge: React.FC<ComplaintSeverityBadgeProps> = ({ priority, subject, description }) => {
  const isFinancial = subject.toLowerCase().includes('payment') || 
                      subject.toLowerCase().includes('billing') || 
                      description.toLowerCase().includes('charge') ||
                      description.toLowerCase().includes('wallet');

  const isSystem = description.toLowerCase().includes('error') || 
                   description.toLowerCase().includes('bug') || 
                   description.toLowerCase().includes('slow');

  const isAccount = subject.toLowerCase().includes('access') || 
                    subject.toLowerCase().includes('login') || 
                    subject.toLowerCase().includes('password');

  const getPriorityStyle = (p: string) => {
    const normP = p.toLowerCase();
    if (normP === 'critical' || normP === 'high' || isFinancial) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (normP === 'medium') return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {/* Priority Tag */}
      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${getPriorityStyle(priority)}`}>
        <ShieldAlert size={10} />
        Priority: {isFinancial ? 'CRITICAL' : priority.toUpperCase()}
      </span>

      {/* Impact Tags */}
      {isFinancial && (
        <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1.5">
          <CreditCard size={10} /> Impact: Financial
        </span>
      )}
      {isSystem && (
        <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5">
          <HardDrive size={10} /> Impact: System
        </span>
      )}
      {isAccount && (
        <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1.5">
          <UserCheck size={10} /> Impact: Account Access
        </span>
      )}
      {!isFinancial && !isSystem && !isAccount && (
        <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100 flex items-center gap-1.5">
          <LayoutGrid size={10} /> Impact: Service
        </span>
      )}
    </div>
  );
};