import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, AlertCircle, Clock, CheckCircle2, X, ChevronRight, Hash, ShieldCheck, History, Info } from 'lucide-react';
import { db } from '../../api/db';
import { useAuth } from '../../context/AuthContext';
import { ComplaintLifecycleTimeline } from '../../components/support/ComplaintLifecycleTimeline.tsx';
import { ComplaintSeverityBadge } from '../../components/support/ComplaintSeverityBadge.tsx';
import { ComplaintConversationThread } from '../../components/support/ComplaintConversationThread.tsx';
import { ComplaintResolutionSummary } from '../../components/support/ComplaintResolutionSummary.tsx';
import { ComplaintFeedbackModule } from '../../components/support/ComplaintFeedbackModule.tsx';

export const UserComplaints: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    const all = db.complaints.getAll();
    setComplaints(all.filter((c: any) => c.user === user?.name || c.userId === user?.id));
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.complaints.add({
      ...formData,
      user: user?.name,
      userId: user?.id
    });
    setComplaints(db.complaints.getAll().filter((c: any) => c.user === user?.name || c.userId === user?.id));
    setShowForm(false);
    setFormData({ subject: '', description: '', priority: 'medium' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Compliance & Support</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-indigo-600" /> Direct Infrastructure Uplink Node
          </p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all text-[11px] uppercase tracking-widest w-full md:w-auto"
        >
          <MessageSquare size={18} /> Lodge Case Registry
        </button>
      </div>

      {/* QUICK STATUS METRICS (MINI) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { label: 'Total Logs', val: complaints.length, icon: MessageSquare, color: 'text-indigo-600', bg: 'bg-indigo-50' },
           { label: 'Resolved', val: complaints.filter(c => c.status === 'resolved').length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
           { label: 'Pending Audit', val: complaints.filter(c => c.status === 'pending').length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
           { label: 'Avg Time', val: '4.2h', icon: History, color: 'text-blue-600', bg: 'bg-blue-50' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-5 rounded-[1.8rem] border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-indigo-100 transition-all">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                 <stat.icon size={18} />
              </div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                 <h4 className="text-lg font-black text-slate-800 leading-none">{stat.val}</h4>
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 space-y-8">
           {showForm && (
            <div className="bg-white p-10 rounded-[3rem] border border-indigo-100 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none rotate-12">
                <MessageSquare size={200} />
              </div>
              <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                <div className="flex items-center justify-between mb-2">
                   <div>
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Technical Case Entry</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Infrastructure Incident Report Node</p>
                   </div>
                   <button type="button" onClick={() => setShowForm(false)} className="p-3 bg-slate-50 text-slate-400 rounded-full hover:bg-rose-50 hover:text-rose-600 transition-all"><X size={20}/></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Incident Subject</label>
                      <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm font-black transition-all" placeholder="Brief issue summary..." value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Protocol Priority</label>
                     <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-sm appearance-none cursor-pointer" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                       <option value="low">Standard / Feedback</option>
                       <option value="medium">Operational Friction</option>
                       <option value="high">Critical System Block</option>
                     </select>
                   </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Forensic Description</label>
                  <textarea required rows={4} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm font-bold resize-none transition-all uppercase tracking-tighter" placeholder="Supply technical data or sequence of events..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>

                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-start gap-4">
                   <Info size={18} className="text-indigo-600 mt-0.5" />
                   <p className="text-[9px] font-bold text-indigo-600/70 uppercase leading-relaxed tracking-widest">Case submission automatically logs your system state and plan tier for administrative audit.</p>
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 group active:scale-95">
                  <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Authorize Case Filing
                </button>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center gap-6 shadow-sm">
                 <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-slate-100">
                    <MessageSquare size={40} />
                 </div>
                 <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Complaints Registry Empty</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All system nodes are operating within optimal parameters.</p>
                 </div>
              </div>
            ) : (
              complaints.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedComplaint(c)}
                  className={`bg-white p-6 rounded-[2.5rem] border transition-all group flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer ${selectedComplaint?.id === c.id ? 'border-indigo-600 shadow-xl shadow-indigo-100/50 scale-[1.02]' : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}
                >
                   <div className="flex items-center gap-6 flex-1 min-w-0">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-transform duration-500 group-hover:rotate-6 ${c.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-lg shadow-rose-100/30' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        <AlertCircle size={28} />
                     </div>
                     <div className="min-w-0">
                        <div className="flex items-center gap-3">
                           <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight truncate leading-tight">{c.subject}</h4>
                           <span className={`px-3 py-0.5 rounded-lg text-[9px] font-black uppercase border whitespace-nowrap ${c.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                             {c.status}
                           </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                           <Hash size={12} className="text-indigo-600" /> {c.id} • Submitted on {c.date}
                        </p>
                        {/* ONLY ADD: Granular Severity and Priority Tags */}
                        <ComplaintSeverityBadge priority={c.priority} subject={c.subject} description={c.description || ''} />
                     </div>
                   </div>
                   <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                         <p className="text-[11px] font-bold text-slate-600 max-w-[200px] truncate uppercase tracking-tighter">"{c.description}"</p>
                      </div>
                      <div className={`p-3 rounded-xl border transition-all ${selectedComplaint?.id === c.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white border-slate-100 text-slate-300'}`}>
                        <ChevronRight size={20} />
                      </div>
                   </div>
                </div>
              ))
            )}
          </div>

          {/* ADDITIVE: Real Chat / Reply Thread for users to see auditor responses */}
          {selectedComplaint && (
            <ComplaintConversationThread complaint={selectedComplaint} />
          )}
        </div>

        <div className="lg:col-span-4 space-y-8 sticky top-24">
           {selectedComplaint ? (
             <>
               {/* 8. User Feedback (After Resolution ⭐) */}
               {selectedComplaint.status === 'resolved' && (
                 <ComplaintFeedbackModule complaintId={selectedComplaint.id} />
               )}

               {/* 7. Resolution Summary (After Close) */}
               {selectedComplaint.status === 'resolved' && (
                 <ComplaintResolutionSummary complaint={selectedComplaint} />
               )}

               <ComplaintLifecycleTimeline complaint={selectedComplaint} />
             </>
           ) : (
             <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
                <div className="absolute top-0 right-0 p-8 opacity-5"><History size={150} /></div>
                <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center mb-6 border border-white/10 backdrop-blur-md">
                   <ShieldCheck size={32} className="text-indigo-400" />
                </div>
                <h4 className="text-lg font-black uppercase tracking-widest leading-tight">Timeline Hub</h4>
                <p className="text-slate-400 text-xs font-medium mt-4 leading-relaxed uppercase tracking-tighter">
                   Select a submitted case from the ledger to view real-time resolution progress and system audit notes.
                </p>
             </div>
           )}

           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                 <Info size={16} className="text-indigo-600" /> Service SLA node
              </h4>
              <div className="space-y-4">
                 {[
                   { label: 'Priority High', time: '1-2 Hours', color: 'text-rose-600' },
                   { label: 'Priority Medium', time: '4-8 Hours', color: 'text-amber-600' },
                   { label: 'Standard Feedback', time: '24-48 Hours', color: 'text-slate-400' }
                 ].map((sla, i) => (
                   <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                      <span className="text-[9px] font-black uppercase text-slate-400">{sla.label}</span>
                      <span className={`text-[10px] font-black uppercase ${sla.color}`}>{sla.time}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};