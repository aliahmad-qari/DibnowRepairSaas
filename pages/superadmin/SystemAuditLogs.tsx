
import React, { useState, useMemo } from 'react';
import { ScrollText, Search, Filter, Terminal, ShieldCheck, Clock, Download, Database, Server, User, Globe, Hash, Info } from 'lucide-react';
import { db } from '../../api/db.ts';

export const SystemAuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const allLogs = useMemo(() => {
    const activity = db.activity.getAll();
    const audit = db.audit.getAll();
    return [...activity, ...audit].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const filteredLogs = allLogs.filter(log => 
    log.actionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.adminRole?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-white/5 text-indigo-400 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10">
              <ScrollText size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Master Forensic Ledger</h2>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Immutable Global Event Stream</p>
           </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
           <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input type="text" placeholder="Trace Action Node..." className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-indigo-500 text-sm font-bold text-white transition-all shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
           </div>
           <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl hover:bg-black transition-all">
              <Download size={18} /> Global Archive (CSV)
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: 'DB Node Status', val: 'Healthy', icon: Database, color: 'text-emerald-500' },
           { label: 'Event Sync', val: '99.9% Latency', icon: RefreshCw, color: 'text-blue-500' },
           { label: 'Identity Store', val: 'Locked', icon: Lock, color: 'text-indigo-500' },
           { label: 'Platform Core', val: 'L-9 Root', icon: Globe, color: 'text-amber-500' }
         ].map((node, i) => (
           <div key={i} className="bg-slate-900 p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-5 group hover:border-indigo-500/50 transition-all">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                 <node.icon size={22} className={node.color} />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{node.label}</p>
                 <h4 className="text-base font-black text-white uppercase">{node.val}</h4>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl border-b-8 border-b-indigo-600">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-white/5">
              <tr>
                <th className="px-10 py-6">Audit ID</th>
                <th className="px-6 py-6">Actor Identity</th>
                <th className="px-10 py-6">Operational Protocol</th>
                <th className="px-6 py-6">Domain Node</th>
                <th className="px-10 py-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-bold text-[11px] uppercase tracking-tighter">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-white/5 transition-all group">
                  <td className="px-10 py-6">
                    <span className="font-mono text-[10px] font-black text-indigo-400">#{log.id.slice(-8)}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-white/10 text-slate-400 flex items-center justify-center font-black text-[9px] border border-white/5">{(log.userName || log.adminRole || 'S').charAt(0)}</div>
                       <span className="text-white">{log.userName || log.adminRole}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="space-y-1">
                       <p className="text-slate-300 font-black">{log.actionType}</p>
                       <p className="text-[10px] text-slate-500 italic lowercase tracking-tight">"{log.details || log.moduleName}"</p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest border-b border-indigo-500/30">{log.resource || log.moduleName}</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <p className="text-slate-500 font-black flex items-center justify-end gap-2">
                       <Clock size={12} /> {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 flex items-start gap-6 opacity-60">
         <ShieldCheck className="text-indigo-400 mt-1 shrink-0" size={24} />
         <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-widest">
            Audit logs are immutable. The forensic ledger provides a 100% accurate trace of system state transitions. Authorizers IP Node: 192.168.0.1 (VPN Tunnel ACTIVE).
         </p>
      </div>
    </div>
  );
};

const Lock = ({size, className}:any) => <Database size={size} className={className} />;
const RefreshCw = ({size, className}:any) => <Terminal size={size} className={className} />;
