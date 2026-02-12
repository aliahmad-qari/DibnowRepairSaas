
import React, { useMemo } from 'react';
import { 
  Inbox, 
  Clock, 
  CheckCircle2, 
  Timer, 
  Activity, 
  BarChart3,
  Zap
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';

export const SupportStatusMetrics: React.FC = () => {
  const { user } = useAuth();
  
  const metrics = useMemo(() => {
    const allTickets = user?.role === UserRole.ADMIN 
      ? db.supportTickets.getAll() 
      : db.supportTickets.getByUser(user?.id || '');

    const open = allTickets.filter(t => t.status === 'pending').length;
    const progress = allTickets.filter(t => t.status === 'investigating').length;
    const resolved = allTickets.filter(t => t.status === 'resolved').length;

    // Simulated Time Metrics for High Fidelity
    return {
      open,
      progress,
      resolved,
      avgResponse: "2.4h",
      avgResolution: "14.8h",
      healthScore: allTickets.length > 0 ? Math.round((resolved / allTickets.length) * 100) : 100
    };
  }, [user]);

  const MetricCard = ({ label, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${color.bg} ${color.text} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
          <h4 className="text-2xl font-black text-slate-900 mt-2 tracking-tighter">{value}</h4>
        </div>
      </div>
      <div className="pt-4 border-t border-slate-50 flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${color.dot} animate-pulse`} />
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{subtext}</span>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <MetricCard 
        label="Open Tickets" 
        value={metrics.open} 
        icon={Inbox} 
        color={{ bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' }} 
        subtext="Awaiting Initial Node"
      />
      <MetricCard 
        label="In Progress" 
        value={metrics.progress} 
        icon={Activity} 
        color={{ bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' }} 
        subtext="Under Technical Audit"
      />
      <MetricCard 
        label="Resolved" 
        value={metrics.resolved} 
        icon={CheckCircle2} 
        color={{ bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500' }} 
        subtext="Lifecycle Finalized"
      />
      <MetricCard 
        label="Avg Response" 
        value={metrics.avgResponse} 
        icon={Zap} 
        color={{ bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' }} 
        subtext="First Handshake SLA"
      />
      <MetricCard 
        label="Avg Resolution" 
        value={metrics.avgResolution} 
        icon={Timer} 
        color={{ bg: 'bg-rose-50', text: 'text-rose-600', dot: 'bg-rose-500' }} 
        subtext="Total Closure Time"
      />
    </div>
  );
};
