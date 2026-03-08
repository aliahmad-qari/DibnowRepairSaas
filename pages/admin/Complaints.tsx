import React, { useState, useEffect } from 'react';
// Added missing 'Shield' icon to imports
import { MessageSquare, AlertCircle, CheckCircle, Search, MoreHorizontal, User, Filter, CheckCircle2, ChevronRight, X, LayoutGrid, Shield } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { ComplaintStatusMetrics } from '../../components/support/ComplaintStatusMetrics.tsx';
import { ComplaintLifecycleTimeline } from '../../components/support/ComplaintLifecycleTimeline.tsx';
import { ComplaintSeverityBadge } from '../../components/support/ComplaintSeverityBadge.tsx';
import { ComplaintConversationThread } from '../../components/support/ComplaintConversationThread.tsx';
import { ComplaintAdminActionLog } from '../../components/support/ComplaintAdminActionLog.tsx';
import { ComplaintSLAWarning } from '../../components/support/ComplaintSLAWarning.tsx';
import { ComplaintResolutionSummary } from '../../components/support/ComplaintResolutionSummary.tsx';
import { ComplaintCategoryAnalytics } from '../../components/support/ComplaintCategoryAnalytics.tsx';

export const Complaints: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const data = await adminApi.getAllComplaints();
        setComplaints(data);
      } catch (error) {
        console.error('Failed to fetch complaints:', error);
      }
    };
    fetchComplaints();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      // Update locally first for immediate feedback
      setComplaints(prev => prev.map(c => 
        c._id === id ? { ...c, status: 'resolved' } : c
      ));
      if (selectedComplaint?._id === id) {
        setSelectedComplaint({ ...selectedComplaint, status: 'resolved' });
      }
      // TODO: Add API call to update complaint status
    } catch (error) {
      console.error('Failed to resolve complaint:', error);
    }
  };

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Global Support Desk</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
            <LayoutGrid size={14} className="text-indigo-600" /> Monitor and resolve issues reported by SaaS subscribers.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-rose-50 text-rose-700 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-rose-100 flex items-center gap-2 shadow-sm">
            <AlertCircle size={18} />
            {complaints.filter(c => c.priority === 'high' && c.status === 'pending').length} Urgent Issues
          </div>
        </div>
      </div>

      {/* ADDITIVE: Complaint Status Metrics Overview */}
      <ComplaintStatusMetrics />

      {/* ADDITIVE: Complaint Category Analytics for System Weakness Detection */}
      <ComplaintCategoryAnalytics />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
               <div className="relative flex-1 max-w-sm">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input type="text" placeholder="Query ticket ID or identity..." className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold focus:ring-8 focus:ring-indigo-500/5 outline-none shadow-sm transition-all" />
               </div>
               <div className="flex items-center gap-3">
                 <Filter size={14} className="text-slate-400" />
                 <select 
                   value={filter} 
                   onChange={(e) => setFilter(e.target.value)}
                   className="text-[10px] bg-white border border-slate-200 rounded-xl px-5 py-3 outline-none font-black text-slate-600 uppercase tracking-widest shadow-sm cursor-pointer"
                 >
                   <option value="all">All Status</option>
                   <option value="pending">Pending</option>
                   <option value="resolved">Resolved</option>
                 </select>
               </div>
             </div>

             <div className="divide-y divide-slate-50">
               {filtered.map((c) => (
                 <div 
                  key={c._id} 
                  onClick={() => setSelectedComplaint(c)}
                  className={`p-8 flex items-center justify-between hover:bg-indigo-50/30 cursor-pointer group transition-all ${selectedComplaint?._id === c._id ? 'bg-indigo-50/50' : ''}`}
                 >
                   <div className="flex items-center gap-6">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${c.priority === 'high' ? 'bg-rose-100 text-rose-600 shadow-lg shadow-rose-100/50' : 'bg-slate-100 text-slate-400'}`}>
                        <MessageSquare size={24} />
                     </div>
                     <div className="min-w-0">
                       <h4 className="font-black text-slate-800 tracking-tight text-lg uppercase truncate max-w-[250px]">{c.subject}</h4>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] bg-white px-2 py-0.5 rounded font-black text-indigo-500 uppercase tracking-widest border border-indigo-100 shadow-sm">{c._id.slice(-8)}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">By {c.user || c.userId} • {new Date(c.date || c.createdAt).toLocaleDateString()}</span>
                       </div>
                       {/* ONLY ADD: Granular Severity and Priority Tags */}
                       <ComplaintSeverityBadge priority={c.priority} subject={c.subject} description={c.description || ''} />
                     </div>
                   </div>
                   <div className="flex items-center gap-8">
                      <div className="text-right hidden xl:block">
                         <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${c.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                           {c.status}
                         </span>
                      </div>
                      <div className="flex gap-2">
                        {c.status === 'pending' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleResolve(c._id); }}
                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                            title="Mark as Resolved"
                          >
                            <CheckCircle2 size={20} />
                          </button>
                        )}
                        <div className={`p-3 rounded-xl border transition-all ${selectedComplaint?._id === c._id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white border-slate-100 text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 shadow-sm'}`}>
                          <ChevronRight size={20} />
                        </div>
                      </div>
                   </div>
                 </div>
               ))}
               {filtered.length === 0 && (
                 <div className="py-32 text-center text-slate-300 flex flex-col items-center gap-4 animate-in zoom-in-95 duration-700">
                    <MessageSquare size={64} strokeWidth={1} className="opacity-20" />
                    <p className="font-black uppercase tracking-[0.3em] text-sm">No protocol cases identified</p>
                 </div>
               )}
             </div>
          </div>

          {/* ADDITIVE: Real Chat / Reply Thread for selected complaint */}
          {selectedComplaint && (
            <ComplaintConversationThread complaint={selectedComplaint} />
          )}
        </div>

        {/* RIGHT SIDE: Lifecycle Analysis & Admin Actions */}
        <div className="lg:col-span-4 space-y-8 sticky top-24">
           {selectedComplaint ? (
             <>
               {/* 6. SLA / Escalation Warning Badge */}
               <ComplaintSLAWarning complaint={selectedComplaint} />
               
               {/* 7. Resolution Summary (After Close) */}
               {selectedComplaint.status === 'resolved' && (
                 <ComplaintResolutionSummary complaint={selectedComplaint} />
               )}

               <ComplaintLifecycleTimeline complaint={selectedComplaint} />
               
               {/* 5. Admin Action Log (Read-only) */}
               <ComplaintAdminActionLog complaint={selectedComplaint} />
             </>
           ) : (
             <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-[1.8rem] flex items-center justify-center mb-6 border-2 border-dashed border-slate-100">
                   <AlertCircle size={40} />
                </div>
                <h4 className="text-base font-black text-slate-800 uppercase tracking-widest leading-none">Awaiting Selection</h4>
                <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-tighter max-w-[200px] leading-relaxed">
                   Select a complaint node from the ledger to view full chronological lifecycle audit.
                </p>
             </div>
           )}

           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl border border-white/5">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                 <CheckCircle size={150} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 flex items-center gap-2">
                 <Shield size={14} /> Audit Integrity Node
              </h4>
              <div className="space-y-6 relative z-10">
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                       This desk monitors global shop friction. All status changes are cryptographically logged to the system audit ledger.
                    </p>
                 </div>
                 <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Download Full Archive</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};