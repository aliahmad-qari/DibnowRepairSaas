
import React, { useMemo, useState } from 'react';
import { 
  History, Search, Filter, Clock, CheckCircle2,
  AlertCircle, ChevronRight, User, Terminal,
  Database, ShieldCheck, Zap, Activity, Info,
  Package, Wrench, ShoppingCart, Lock
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const UserActivity: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const logs = useMemo(() => {
    const all = db.activity.getAll();
    return all.filter(a => a.userId === user?.id || a.ownerId === user?.id);
  }, [user]);

  const filteredLogs = logs.filter(l => 
    l.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.moduleName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLogIcon = (action: string) => {
    if (action.includes('Stock')) return <Package className="text-indigo-600" size={18} />;
    if (action.includes('Repair')) return <Wrench className="text-blue-600" size={18} />;
    if (action.includes('Sold')) return <ShoppingCart className="text-emerald-600" size={18} />;
    if (action.includes('Login')) return <Lock className="text-amber-600" size={18} />;
    return <Activity className="text-slate-400" size={18} />;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Activity Trail</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Terminal size={14} className="text-indigo-600" /> Forensic Event Synchronization Ledger
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Trace Action Node..." 
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm font-bold shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden p-8 md:p-12 relative border-b-8 border-b-indigo-600">
         <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none rotate-12"><History size={200} /></div>
         
         <div className="relative z-10 space-y-0 before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {filteredLogs.length === 0 ? (
               <div className="py-24 text-center opacity-30">
                  <Database size={48} className="mx-auto mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No Node Events Logged</p>
               </div>
            ) : filteredLogs.map((log, idx) => (
              <div key={log.id} className="relative flex gap-10 pb-12 last:pb-0 animate-in slide-in-from-left-4" style={{ animationDelay: `${idx * 100}ms` }}>
                 <div className="flex flex-col items-center shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-white border-4 border-slate-50 shadow-xl flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                       {getLogIcon(log.actionType)}
                    </div>
                 </div>
                 <div className="flex-1 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-xl transition-all group">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[9px] font-black text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-50 uppercase tracking-widest">{log.moduleName} Node</span>
                       <span className="text-[9px] font-bold text-slate-300 uppercase flex items-center gap-2">
                          <Clock size={10}/> {new Date(log.timestamp).toLocaleString()}
                       </span>
                    </div>
                    <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">{log.actionType}</h4>
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200/50">
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-[9px] font-black text-slate-500">{log.userName?.charAt(0)}</div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Actor: {log.userName}</span>
                       </div>
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${log.status === 'Success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          Status: {log.status}
                       </span>
                    </div>
                 </div>
              </div>
            ))}
         </div>
      </div>
      
      <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex items-start gap-4">
         <ShieldCheck size={24} className="text-indigo-600 mt-1 shrink-0" />
         <div>
            <p className="text-[10px] font-black text-indigo-900 uppercase leading-none">Immutability Protocol Verified</p>
            <p className="text-[9px] font-bold text-indigo-600/70 uppercase tracking-tighter mt-2 leading-relaxed">
               Every operational handshake is cryptographically logged to the platform's forensic ledger. These records are permanent and used for security audits and compliance verification.
            </p>
         </div>
      </div>
    </div>
  );
};
