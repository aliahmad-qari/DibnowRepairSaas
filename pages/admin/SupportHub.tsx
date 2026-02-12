
import React, { useState, useEffect } from 'react';
/* Added ShieldCheck to imports */
import { 
  Shield, MessageSquare, Search, Filter, Clock, CheckCircle2, 
  AlertCircle, X, Check, ArrowRight, Hash, Building,
  Star, MoreVertical, Terminal, Loader2, ShieldCheck
} from 'lucide-react';
import { db } from '../../api/db';
import { SupportTicket } from '../../types';
import { SupportStatusMetrics } from '../../components/support/SupportStatusMetrics.tsx';
import { SupportCategoryAnalysis } from '../../components/support/SupportCategoryAnalysis.tsx';
import { SupportActivityFeed } from '../../components/support/SupportActivityFeed.tsx';
import { TicketDetailPanel } from '../../components/support/TicketDetailPanel.tsx';

export const SupportHub: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [viewTicket, setViewTicket] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const loadData = () => {
      setTickets(db.supportTickets.getAll());
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    setIsUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    db.supportTickets.updateStatus(id, status);
    setIsUpdating(false);
    setSelectedTicket(null);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'investigating': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getPriorityColor = (p: string) => {
    switch(p) {
      case 'urgent': return 'bg-rose-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Support Command</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Cross-Tenant Protocol Audit & Response Node</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="bg-rose-50 text-rose-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-2">
             <AlertCircle size={16} /> {tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length} Critical Nodes
           </div>
        </div>
      </div>

      {/* ONLY ADD: Global Support Status Overview */}
      <SupportStatusMetrics />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
         <div className="xl:col-span-8">
            <SupportCategoryAnalysis />

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input type="text" placeholder="Trace Protocol Logs..." className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm" />
                  </div>
                  <div className="flex gap-4">
                     <select 
                       value={filter} 
                       onChange={(e) => setFilter(e.target.value)}
                       className="bg-white border border-slate-200 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none"
                     >
                       <option value="all">Global Logs</option>
                       <option value="pending">Pending</option>
                       <option value="investigating">In Audit</option>
                       <option value="resolved">Resolved</option>
                     </select>
                  </div>
               </div>

               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
                     <tr>
                       <th className="px-10 py-6">Origin Shop</th>
                       <th className="px-10 py-6">Case Summary</th>
                       <th className="px-10 py-6 text-center">Priority</th>
                       <th className="px-10 py-6 text-center">Protocol Status</th>
                       <th className="px-10 py-6 text-right">Audit Date</th>
                       <th className="px-10 py-6"></th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {filteredTickets.map(t => (
                       <tr key={t.id} onClick={() => setViewTicket(t)} className="hover:bg-indigo-50/30 transition-all group cursor-pointer">
                         <td className="px-10 py-7">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                 <Building size={20} />
                              </div>
                              <div>
                                 <p className="font-black text-slate-800 text-sm tracking-tight">{t.userName}</p>
                                 <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">ID: {t.userId}</p>
                              </div>
                           </div>
                         </td>
                         <td className="px-10 py-7">
                           <div className="flex flex-col">
                              <p className="font-black text-slate-800 text-sm leading-tight">{t.subject}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tighter">{t.category} Module</p>
                           </div>
                         </td>
                         <td className="px-10 py-7 text-center">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getPriorityColor(t.priority)}`}>
                              {t.priority}
                           </span>
                         </td>
                         <td className="px-10 py-7 text-center">
                           <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase inline-flex items-center gap-2 border ${getStatusColor(t.status)}`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'resolved' ? 'bg-emerald-500' : t.status === 'pending' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                             {t.status}
                           </span>
                         </td>
                         <td className="px-10 py-7 text-right">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(t.createdAt).toLocaleDateString()}</p>
                         </td>
                         <td className="px-10 py-7 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setViewTicket(t); }}
                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                              >
                                <ShieldCheck size={18} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }}
                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                              >
                                <Terminal size={18} />
                              </button>
                            </div>
                         </td>
                       </tr>
                     ))}
                     {filteredTickets.length === 0 && (
                       <tr>
                          <td colSpan={6} className="py-32 text-center">
                             <div className="flex flex-col items-center justify-center gap-4 opacity-20">
                                <Shield size={64} />
                                <p className="text-sm font-black uppercase tracking-widest">No Protocol Cases Identified</p>
                             </div>
                          </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
         </div>

         <div className="xl:col-span-4 h-full">
            <SupportActivityFeed />
         </div>
      </div>

      {/* TICKET DETAIL PANEL (EXPANDABLE) */}
      {viewTicket && (
        <TicketDetailPanel 
          ticket={viewTicket} 
          onClose={() => setViewTicket(null)} 
          isAdmin={true}
        />
      )}

      {/* ADMIN RESPONSE MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 backdrop-blur-xl bg-slate-950/70">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-indigo-100 flex flex-col max-h-[90vh]">
              <div className="bg-slate-900 p-8 text-white flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                       <Terminal size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-widest">Protocol Audit: {selectedTicket.id}</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-widest opacity-80">Origin: {selectedTicket.userName}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
              </div>

              <div className="p-10 overflow-y-auto custom-scrollbar flex-1 space-y-10">
                 <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                       <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Original Report</h4>
                       <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${getPriorityColor(selectedTicket.priority)} shadow-lg shadow-indigo-100/20`}>
                         {selectedTicket.priority} Priority
                       </span>
                    </div>
                    <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 italic text-slate-600 text-sm leading-relaxed">
                       "{selectedTicket.message}"
                    </div>
                 </div>

                 <div className="space-y-8">
                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Administrative Actions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <button 
                         disabled={isUpdating}
                         onClick={() => handleUpdateStatus(selectedTicket.id, 'investigating')}
                         className="bg-blue-50 text-blue-700 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-100 transition-all border border-blue-100 flex items-center justify-center gap-3"
                       >
                         {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                         Initialize Investigation
                       </button>
                       <button 
                         disabled={isUpdating}
                         onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                         className="bg-emerald-50 text-emerald-700 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100 flex items-center justify-center gap-3"
                       >
                         {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                         Authorize Resolution
                       </button>
                    </div>
                 </div>

                 <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-start gap-4">
                    <ShieldCheck size={20} className="text-indigo-600 mt-0.5" />
                    <div className="space-y-1">
                       <p className="text-[10px] font-black text-indigo-800 uppercase tracking-widest">Auditor Verification</p>
                       <p className="text-[9px] font-bold text-indigo-600/70 leading-relaxed uppercase">Status changes propagate to the user portal immediately. Maintain professional infrastructure standards.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
