
import React, { useState, useEffect } from 'react';
import { LifeBuoy, Search, Filter, ShieldCheck, Clock, CheckCircle2, AlertCircle, X, ChevronRight, Hash, MessageSquare, Terminal, User, Building } from 'lucide-react';
import { db } from '../../api/db.ts';

export const GlobalSupport: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setTickets(db.supportTickets.getAll());
  }, []);

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tight">Support Command</h2>
           <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Cross-Tenant Protocol Audit & Response Node</p>
        </div>
        <div className="bg-rose-600/10 border border-rose-500/20 px-6 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-md">
           <AlertCircle size={18} className="text-rose-500" />
           <span className="text-[10px] font-black uppercase tracking-widest text-rose-300">{tickets.filter(t => t.status === 'pending').length} Critical Unresolved Nodes</span>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl border-b-8 border-b-indigo-600">
         <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <div className="relative w-80">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
               <input type="text" placeholder="Trace Ticket ID..." className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-xs font-bold text-white focus:border-indigo-500" />
            </div>
            <div className="flex items-center gap-4">
               <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase text-indigo-400 outline-none cursor-pointer">
                  <option value="all" className="bg-slate-900">All Logs</option>
                  <option value="pending" className="bg-slate-900">Pending</option>
                  <option value="resolved" className="bg-slate-900">Resolved</option>
               </select>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-white/5">
                  <tr>
                     <th className="px-10 py-6">Origin Shop</th>
                     <th className="px-10 py-6">Protocol Case</th>
                     <th className="px-10 py-6 text-center">Status</th>
                     <th className="px-10 py-6 text-right">Audit Date</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {filteredTickets.map(t => (
                    <tr key={t.id} className="hover:bg-white/5 transition-all group cursor-pointer">
                       <td className="px-10 py-7">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <Building size={18} />
                             </div>
                             <div>
                                <p className="font-black text-white text-sm uppercase tracking-tight">{t.userName}</p>
                                <p className="text-[10px] text-slate-500 font-bold mt-1 lowercase italic">Node: {t.userId}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-7">
                          <div className="space-y-1">
                             <p className="text-white font-black text-sm">{t.subject}</p>
                             <p className="text-[9px] text-slate-400 uppercase font-black">{t.category} Module</p>
                          </div>
                       </td>
                       <td className="px-10 py-7 text-center">
                          <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border inline-flex items-center gap-2 ${
                            t.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'resolved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                             {t.status}
                          </span>
                       </td>
                       <td className="px-10 py-7 text-right">
                          <div className="flex items-center justify-end gap-6">
                             <p className="text-[10px] font-black text-slate-500 uppercase">{new Date(t.createdAt).toLocaleDateString()}</p>
                             <ChevronRight size={18} className="text-slate-700 group-hover:text-indigo-400 transition-all" />
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
