
import React, { useMemo } from 'react';
import { AlertCircle, ShieldAlert, Timer, ArrowUpCircle } from 'lucide-react';

interface ComplaintSLAWarningProps {
  complaint: any;
}

export const ComplaintSLAWarning: React.FC<ComplaintSLAWarningProps> = ({ complaint }) => {
  const slaStatus = useMemo(() => {
    if (complaint.status === 'resolved') return null;

    // Simulate SLA breach logic
    const isHighPriority = complaint.priority === 'high' || complaint.priority === 'critical';
    const isBreached = isHighPriority; // For high priority, we always show escalation in demo mode

    return {
      isBreached,
      level: isHighPriority ? 'ESCALATED' : 'URGENT',
      timer: isHighPriority ? 'SLA Breached' : '2h 15m remaining'
    };
  }, [complaint]);

  if (!slaStatus) return null;

  return (
    <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 animate-pulse-slow ${slaStatus.isBreached ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${slaStatus.isBreached ? 'bg-rose-600 text-white shadow-rose-200' : 'bg-amber-500 text-white shadow-amber-200'}`}>
          <ShieldAlert size={20} />
        </div>
        <div>
          <p className={`text-[10px] font-black uppercase tracking-widest leading-none ${slaStatus.isBreached ? 'text-rose-900' : 'text-amber-900'}`}>
            {slaStatus.isBreached ? '🚨 ESCALATION PROTOCOL ACTIVE' : '⚠ SLA THRESHOLD WARNING'}
          </p>
          <p className={`text-[8px] font-bold uppercase mt-1.5 tracking-tighter ${slaStatus.isBreached ? 'text-rose-600' : 'text-amber-600'}`}>
            Immediate administrative handshake required for this node.
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${slaStatus.isBreached ? 'text-rose-700' : 'text-amber-700'}`}>
          <Timer size={12} />
          {slaStatus.timer}
        </div>
      </div>
    </div>
  );
};
