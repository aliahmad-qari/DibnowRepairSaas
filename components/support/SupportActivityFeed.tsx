import React, { useMemo } from 'react';
import { 
  History, 
  MessageSquare, 
  RefreshCcw, 
  CheckCircle2, 
  User, 
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';

export const SupportActivityFeed: React.FC = () => {
  const { user } = useAuth();

  const activityFeed = useMemo(() => {
    const allActivity = db.activity.getAll();
    const supportLogs = allActivity.filter(a => 
      a.moduleName === 'Support' || 
      a.actionType.toLowerCase().includes('ticket') || 
      a.actionType.toLowerCase().includes('complaint')
    );

    // Filter for current user if not admin
    const visibleLogs = user?.role === UserRole.ADMIN 
      ? supportLogs 
      : supportLogs.filter(log => log.userId === user?.id || log.refId.startsWith('TKT-'));

    return visibleLogs.slice(0, 10).map(log => {
      let icon = MessageSquare;
      let color = 'text-blue-500 bg-blue-50';
      let actionVerb = 'processed';

      if (log.actionType.includes('Created')) {
        icon = Zap;
        color = 'text-indigo-500 bg-indigo-50';
        actionVerb = 'initialized';
      } else if (log.actionType.includes('Updated')) {
        icon = RefreshCcw;
        color = 'text-amber-500 bg-amber-50';
        actionVerb = 'modified';
      } else if (log.actionType.includes('Resolved')) {
        icon = CheckCircle2;
        color = 'text-emerald-500 bg-emerald-50';
        actionVerb = 'finalized';
      }

      const timeAgo = (timestamp: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return new Date(timestamp).toLocaleDateString();
      };

      return {
        id: log.id,
        title: `Ticket #${log.refId.split('-')[1] || log.refId} ${actionVerb}`,
        description: `${log.actionType} by ${log.userName || 'System Auditor'}`,
        time: timeAgo(log.timestamp),
        icon,
        color
      };
    });
  }, [user]);

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-right-6 duration-1000">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <History size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 leading-none">Support Lifecycle Feed</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Real-time Protocol Audit Stream</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {activityFeed.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-30 gap-4">
            <ShieldCheck size={48} strokeWidth={1} />
            <p className="text-xs font-black uppercase tracking-[0.2em]">No recent support flux detected</p>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-50">
            {activityFeed.map((item, idx) => (
              <div key={item.id} className="relative flex gap-6 group animate-in slide-in-from-left-4" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center shrink-0 z-10 shadow-sm border-4 border-white group-hover:scale-110 transition-transform duration-500`}>
                  <item.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{item.title}</h4>
                    <span className="text-[9px] font-black text-slate-400 uppercase whitespace-nowrap bg-slate-50 px-2 py-1 rounded-lg">{item.time}</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Verify node trace</span>
                    <ArrowRight size={10} className="text-indigo-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-50/50 border-t border-slate-100">
        <div className="flex items-center justify-center gap-2 opacity-40 grayscale group-hover:grayscale-0 transition-all">
          <Clock size={12} className="text-slate-400" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporal sync active • Node v9.4-S</span>
        </div>
      </div>
    </div>
  );
};
