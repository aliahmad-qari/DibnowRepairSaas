import React, { useMemo } from 'react';
import { 
  Inbox, 
  Clock, 
  CheckCircle2, 
  Timer, 
  AlertCircle,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { db } from '../../api/db.ts';

export const ComplaintStatusMetrics: React.FC = () => {
  const metrics = useMemo(() => {
    const all = db.complaints.getAll();
    const pending = all.filter(c => c.status === 'pending').length;
    const resolved = all.filter(c => c.status === 'resolved').length;
    // Simulation of 'In Progress' logic based on priority if status is pending
    const inProgress = all.filter(c => c.status === 'pending' && c.priority === 'high').length;

    return {
      total: all.length,
      pending: pending - inProgress,
      inProgress,
      resolved,
      avgResolution: "18.4h"
    };
  }, []);

  const MetricPill = ({ label, value, icon: Icon, theme }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-2xl ${theme.bg} ${theme.text} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
          <h4 className="text-2xl font-black text-slate-900 mt-2 tracking-tighter">{value}</h4>
        </div>
      </div>
      <div className="pt-4 border-t border-slate-50 flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${theme.dot} animate-pulse`} />
        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Real-time Node Pulse</span>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10 animate-in fade-in slide-in-from-top-4 duration-1000">
      <MetricPill 
        label="Total Influx" 
        value={metrics.total} 
        icon={MessageSquare} 
        theme={{ bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-500' }} 
      />
      <MetricPill 
        label="Pending Sync" 
        value={metrics.pending} 
        icon={Inbox} 
        theme={{ bg: 'bg-amber-50', text: 'text-amber-600', dot: 'bg-amber-500' }} 
      />
      <MetricPill 
        label="In Progress" 
        value={metrics.inProgress} 
        icon={Clock} 
        theme={{ bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500' }} 
      />
      <MetricPill 
        label="Finalized" 
        value={metrics.resolved} 
        icon={CheckCircle2} 
        theme={{ bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' }} 
      />
      <MetricPill 
        label="Avg Resolution" 
        value={metrics.avgResolution} 
        icon={Timer} 
        theme={{ bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-500' }} 
      />
    </div>
  );
};