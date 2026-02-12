
import React, { useState } from 'react';
import { ToggleRight, Zap, ShieldCheck, Box, MessageSquare, Settings2, Activity, Info, RefreshCw, AlertTriangle, ShieldAlert, Database, Terminal, Search, ChevronRight } from 'lucide-react';
import { db } from '../../api/db.ts';

export const GlobalFeatureFlags: React.FC = () => {
  const [flags, setFlags] = useState([
    { id: 'ai_diagnostics', label: 'AI Diagnostic Engine', desc: 'Enable neural analysis for repair intake globally.', active: true, group: 'Core' },
    { id: 'pos_terminal', label: 'Direct POS Terminal', desc: 'Liquidated asset management interface.', active: true, group: 'Module' },
    { id: 'geo_pricing', label: 'Geo-Localised Pricing', desc: 'Dynamic price mapping based on IP node.', active: true, group: 'Protocol' },
    { id: 'beta_reports', label: 'Deep Forensic Reports', desc: 'Advanced MoM performance audit nodes.', active: false, group: 'Beta' },
    { id: 'tenant_branding', label: 'White-Label Branding', desc: 'Authorize custom CSS overrides for tenants.', active: false, group: 'Enterprise' },
  ]);

  const handleToggle = (id: string) => {
    setFlags(flags.map(f => f.id === id ? { ...f, active: !f.active } : f));
    db.audit.log({
      actionType: 'FEATURE_FLAG_MUTATION',
      resource: 'Control Matrix',
      details: `Transitioned ${id} protocol.`
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
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
           <div key={flag.id} className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 flex flex-col justify-between group hover:border-indigo-500/50 transition-all relative overflow-hidden">
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
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2 leading-relaxed">"{flag.desc}"</p>
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
                   onClick={() => handleToggle(flag.id)}
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
