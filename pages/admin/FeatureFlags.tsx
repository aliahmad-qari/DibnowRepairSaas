
import React, { useState, useEffect } from 'react';
import { 
  ToggleRight, Zap, ShieldCheck, Box, MessageSquare, 
  Settings2, Activity, Info, RefreshCw, AlertTriangle,
  Code, Rocket, Smartphone, Database, Globe, Search,
  ChevronRight, Lock, Terminal
} from 'lucide-react';
import { db } from '../../api/db.ts';

export const AdminFeatureFlags: React.FC = () => {
  const [flags, setFlags] = useState([
    { id: 'ai_diagnostics', label: 'AI Diagnostic Engine', desc: 'Enable neural analysis for repair intake.', active: true, group: 'System' },
    { id: 'beta_pos_v2', label: 'Advanced POS Terminal', desc: 'Access to inventory-integrated checkout.', active: false, group: 'Beta' },
    { id: 'sms_pings', label: 'SMS Gateway Uplink', desc: 'Direct technical alerts via Twilio node.', active: true, group: 'Comms' },
    { id: 'fraud_detection', label: 'Forensic Transaction Audit', desc: 'Real-time suspicious activity monitor.', active: true, group: 'Security' },
    { id: 'bulk_ledger_export', label: 'Bulk CSV Ledger Node', desc: 'Authorize mass data extraction.', active: false, group: 'System' },
    { id: 'spiritual_hub', label: 'Islamic Spiritual Hub', desc: 'Prayer & Quran nodes globally active.', active: true, group: 'Regional' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const handleToggle = (id: string) => {
    const updated = flags.map(f => f.id === id ? { ...f, active: !f.active } : f);
    setFlags(updated);
    
    const flag = updated.find(f => f.id === id);
    db.audit.log({
      actionType: 'Feature Node Mutated',
      resource: 'Control Matrix',
      details: `Flag [${flag?.label}] status transitioned to ${flag?.active ? 'ENABLED' : 'DISABLED'}.`
    });
  };

  const filteredFlags = flags.filter(f => 
    f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1500px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Feature Matrix Control</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <ToggleRight size={14} className="text-indigo-600" /> Administrative Logic Deployment & Node Toggling
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Capability Nodes..." 
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm font-bold shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFlags.map((flag) => (
          <div key={flag.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col justify-between h-full border-b-8 hover:-translate-y-1" style={{ borderBottomColor: flag.active ? '#10b981' : '#cbd5e1' }}>
             <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${flag.active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {flag.group === 'Security' ? <ShieldCheck size={28}/> : flag.group === 'System' ? <Terminal size={28}/> : <Zap size={28}/>}
                   </div>
                   <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{flag.group} Domain</span>
                </div>
                <div>
                   <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-3 group-hover:text-indigo-600 transition-colors">{flag.label}</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter leading-relaxed">"{flag.desc}"</p>
                </div>
             </div>

             <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className={`w-1.5 h-1.5 rounded-full ${flag.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                   <span className={`text-[10px] font-black uppercase tracking-widest ${flag.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {flag.active ? 'Protocol Active' : 'Node Offline'}
                   </span>
                </div>
                <div 
                  onClick={() => handleToggle(flag.id)}
                  className={`w-14 h-7 rounded-full relative cursor-pointer transition-all ${flag.active ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                   <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg transition-all ${flag.active ? 'right-1' : 'left-1'}`} />
                </div>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
         <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Activity size={150} /></div>
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 text-indigo-400"><Database size={24}/></div>
                  <h3 className="text-xl font-black uppercase tracking-widest">Logic propagation Node</h3>
               </div>
               <p className="text-indigo-100/60 text-xs font-medium leading-relaxed uppercase tracking-tighter">Feature flags transition the system logic state across all global edge nodes without requiring a code re-compilation. Handshake latency is approximately 400ms.</p>
               <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                  <ShieldCheck size={20} className="text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Authorizer Identity Verified</span>
               </div>
            </div>
         </div>

         <div className="bg-indigo-50 rounded-[3rem] p-10 border border-indigo-100 space-y-8">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600"><AlertTriangle size={24}/></div>
               <h3 className="text-xl font-black uppercase tracking-tight text-indigo-900">Safety Policy node</h3>
            </div>
            <div className="space-y-4">
               {[
                 'Mutation of Security flags logs the Authorizers IP Node',
                 'Beta features are isolated to non-production traffic',
                 'Automatic rollback protocol active for critical blocks',
                 'Tenant access remains cached for current session'
               ].map((rule, i) => (
                 <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-tighter">{rule}</span>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};
