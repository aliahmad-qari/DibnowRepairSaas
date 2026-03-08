
import React, { useState, useEffect } from 'react';
import { ToggleRight, Zap, ShieldCheck, Box, MessageSquare, Settings2, Activity, Info, RefreshCw, AlertTriangle, ShieldAlert, Database, Terminal, Search, ChevronRight, Loader2 } from 'lucide-react';
import { callBackendAPI } from '../../api/apiClient.ts';

export const GlobalFeatureFlags: React.FC = () => {
  const [flags, setFlags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = async () => {
    try {
      setIsLoading(true);
      const data = await callBackendAPI('/api/superadmin/features', null, 'GET');
      setFlags(data || []);
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await callBackendAPI(`/superadmin/features/${id}/toggle`, null, 'PUT');
      loadFlags();
    } catch (error) {
      console.error('Failed to toggle feature flag:', error);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-white/5 text-indigo-400 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10">
              <ToggleRight size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Feature Matrix</h2>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Administrative Node Control & Beta Management</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {flags.map(flag => (
           <div key={flag._id} className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between group hover:border-indigo-500/50 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Settings2 size={120} /></div>
              <div className="space-y-6 relative z-10">
                 <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${flag.active ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-500'}`}>
                       <Zap size={22} />
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{flag.group} Cluster</span>
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">{flag.label}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed">"{flag.description}"</p>
                 </div>
              </div>
              <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                 <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${flag.active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${flag.active ? 'text-emerald-400' : 'text-rose-400'}`}>
                       {flag.active ? 'Operational' : 'Node Locked'}
                    </span>
                 </div>
                 <div 
                   onClick={() => handleToggle(flag._id)}
                   className={`w-14 h-7 rounded-full relative cursor-pointer transition-all ${flag.active ? 'bg-indigo-600' : 'bg-white/10'}`}
                 >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${flag.active ? 'left-8' : 'left-1'}`} />
                 </div>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 flex items-start gap-6 opacity-60">
         <ShieldAlert className="text-indigo-400 mt-1 shrink-0" size={24} />
         <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-widest">
            Feature flag mutations are distributed across all edge nodes instantly. This control terminal is restricted to L-9 Root Operators. Every transition is logged with a forensic timestamp.
         </p>
      </div>
    </div>
  );
};
