
import React, { useMemo, useState, useEffect } from 'react';
import { 
  Terminal, Search, Filter, ShieldCheck, Clock, 
  ChevronDown, ArrowUpRight, Hash, User, Activity,
  Globe, Server, HardDrive, Cpu, AlertCircle, RefreshCw,
  Download, Eye
} from 'lucide-react';
import { db } from '../../api/db.ts';

export const AdminAuditLogs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const syncLogs = () => setLogs(db.audit.getAll());
    syncLogs();
    window.addEventListener('storage', syncLogs);
    return () => window.removeEventListener('storage', syncLogs);
  }, []);

  const filteredLogs = logs.filter(log => 
    log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.adminRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-slate-900 text-indigo-400 rounded-[1.8rem] flex items-center justify-center shadow-2xl border border-white/10">
              <Terminal size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Forensic Ledger</h2>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <ShieldCheck size={14} className="text-indigo-600" /> Immutable Administrative Event Registry
              </p>
           </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Trace Protocol ID or Actor..." 
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm font-bold shadow-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl hover:bg-black transition-all">
              <Download size={18} /> Master Export
           </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: 'Active Node Status', val: 'Operational', icon: Server, color: 'text-emerald-500' },
           { label: 'Ledger Integrity', val: '99.9% Verified', icon: ShieldCheck, color: 'text-blue-500' },
           { label: 'Event Throughput', val: '1.4k / Day', icon: Activity, color: 'text-indigo-500' },
           { label: 'Cold Storage Sync', val: '4m ago', icon: RefreshCw, color: 'text-amber-500' }
         ].map((node, i) => (
           <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-indigo-200 transition-all">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                 <node.icon size={22} className={node.color} />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{node.label}</p>
                 <h4 className="text-base font-black text-slate-800 uppercase">{node.val}</h4>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-10 py-6">Audit Reference</th>
                <th className="px-6 py-6">Administrative Entity</th>
                <th className="px-10 py-6">Mutation Details</th>
                <th className="px-6 py-6">Protocol Domain</th>
                <th className="px-10 py-6 text-right">Timestamp (Node)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold text-[11px] uppercase tracking-tighter">
              {filteredLogs.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-24 text-center opacity-30">
                      <Terminal size={48} className="mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Registry Node Empty</p>
                   </td>
                </tr>
              ) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-10 py-6">
                    <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">#{log.id.slice(-8)}</span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-[9px]">{log.adminRole.charAt(0)}</div>
                       <span className="text-slate-800">{log.adminRole}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="space-y-1">
                       <p className="text-slate-700 font-black">{log.actionType}</p>
                       <p className="text-[10px] text-slate-400 italic lowercase tracking-tight">"{log.details}"</p>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-100">{log.resource}</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <p className="text-slate-400 font-black flex items-center justify-end gap-2">
                       <Clock size={12} /> {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-rose-50 border-2 border-dashed border-rose-200 p-8 rounded-[3rem] flex items-center justify-center gap-4 opacity-50">
         <AlertCircle size={20} className="text-rose-600" />
         <p className="text-[10px] font-black text-rose-800 uppercase tracking-widest">This ledger is cryptographically sealed. Mutations can only be added, never redacted or erased.</p>
      </div>
    </div>
  );
};
