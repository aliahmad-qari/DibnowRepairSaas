
import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Plus, Search, Filter, Clock, CheckCircle2, 
  AlertCircle, X, Send, Tag, ChevronRight, Hash, Bot,
  Info, Loader2
} from 'lucide-react';
import { callBackendAPI, getBackendUserId } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { TicketStatus, TicketPriority } from '../../types';
import { SupportStatusMetrics } from '../../components/support/SupportStatusMetrics.tsx';
import { SupportCategoryAnalysis } from '../../components/support/SupportCategoryAnalysis.tsx';
import { SupportActivityFeed } from '../../components/support/SupportActivityFeed.tsx';
import { TicketDetailPanel } from '../../components/support/TicketDetailPanel.tsx';
import { SelfHelpSuggestions } from '../../components/support/SelfHelpSuggestions.tsx';
import { PlanPriorityBadge } from '../../components/support/PlanPriorityBadge.tsx';
import { BackButton } from '../../components/common/BackButton';

export const SupportTickets: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  
  const [formData, setFormData] = useState({
    subject: '',
    category: 'Technical',
    priority: 'medium' as TicketPriority,
    message: ''
  });

  useEffect(() => {
    const loadTickets = async () => {
      if (!user) return;
      try {
        const data = await callBackendAPI('/api/support-tickets', null, 'GET');
        setTickets(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load tickets:', err);
        setTickets([]);
      }
    };
    loadTickets();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await callBackendAPI('/api/support-tickets', {
        ...formData,
        userId: user.id || user._id,
        userName: user.name,
        userEmail: user.email
      }, 'POST');
      // Reload tickets from backend
      const data = await callBackendAPI('/api/support-tickets', null, 'GET');
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to submit ticket:', err);
    } finally {
      setIsSubmitting(false);
      setShowModal(false);
      setFormData({ subject: '', category: 'Technical', priority: 'medium', message: '' });
    }
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
      case 'urgent': return 'text-rose-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      default: return 'text-slate-400';
    }
  };

  const filteredTickets = filter === 'all' ? tickets : tickets.filter(t => t.status === filter);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20 px-4">
      <div className="pt-4">
        <BackButton />
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
          <div className="shrink-0">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">Support Node</h2>
            <p className="text-slate-500 font-bold text-[10px] sm:text-xs uppercase tracking-widest mt-2">Authorized Infrastructure Assistance</p>
          </div>
          <PlanPriorityBadge />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full lg:w-auto bg-indigo-600 text-white px-8 py-4 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 hover:scale-105 transition-all text-[10px] uppercase tracking-widest"
        >
          <Plus size={18} /> Lodge Ticket Request
        </button>
      </div>

      {/* ONLY ADD: Support Status Overview */}
      <SupportStatusMetrics />

      {/* ONLY ADD: Self-Help Suggestions Hub */}
      <SelfHelpSuggestions />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
         <div className="xl:col-span-8 space-y-8">
            <SupportCategoryAnalysis />
            
            {/* Ticket List */}
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-6 sm:p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/20">
                  <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} sm:size={20} />
                    <input 
                      type="text" 
                      placeholder="Query Ticket Logs..." 
                      className="w-full pl-12 sm:pl-14 pr-6 py-3 sm:py-4 bg-white border-2 border-slate-100 rounded-xl sm:rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div className="flex w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
                     <select 
                       value={filter} 
                       onChange={(e) => setFilter(e.target.value)}
                       className="w-full md:w-auto bg-white border border-slate-200 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest outline-none"
                     >
                       <option value="all">All Status</option>
                       <option value="pending">Pending</option>
                       <option value="investigating">In Progress</option>
                       <option value="resolved">Resolved</option>
                     </select>
                  </div>
               </div>

               <div className="divide-y divide-slate-50">
                 {filteredTickets.length === 0 ? (
                   <div className="py-24 text-center">
                     <MessageSquare size={64} className="mx-auto mb-4 opacity-10" />
                     <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Support Logs Identified</p>
                   </div>
                 ) : (
                   filteredTickets.map(t => (
                      <div 
                         key={t.id} 
                         onClick={() => setSelectedTicket(t)}
                         className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-slate-50 transition-all cursor-pointer group"
                       >
                        <div className="flex items-center gap-4 sm:gap-6">
                          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center ${getStatusColor(t.status)} border shadow-sm shrink-0`}>
                            <Hash size={20} sm:size={24} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <h4 className="font-black text-slate-800 tracking-tight text-base sm:text-lg truncate">{t.subject}</h4>
                              <span className={`text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getStatusColor(t.status)}`}>
                                {t.status}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {t.id}</p>
                              <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-200" />
                              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Category: {t.category}</p>
                              <span className="hidden sm:block w-1 h-1 rounded-full bg-slate-200" />
                              <p className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${getPriorityColor(t.priority)}`}>
                                 {t.priority} Priority
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-8 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                          <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(t.createdAt).toLocaleDateString()}</p>
                          <ChevronRight className="text-slate-300 group-hover:text-indigo-600 transition-all" size={20} />
                        </div>
                      </div>
                   ))
                 )}
               </div>
            </div>
         </div>

         <div className="xl:col-span-4 h-full">
            {/* ONLY ADD: Support Activity Feed */}
            <SupportActivityFeed />
         </div>
      </div>

      {/* TICKET DETAIL PANEL (EXPANDABLE) */}
      {selectedTicket && (
        <TicketDetailPanel 
          ticket={selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
          isAdmin={false}
        />
      )}

      {/* CREATE MODAL */}
      {showModal && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <div className="bg-white w-full max-w-2xl rounded-[2rem] sm:rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
               <div className="bg-indigo-600 p-6 sm:p-8 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3 sm:gap-4">
                     <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center backdrop-blur-md shrink-0">
                        <Plus size={20} sm:size={24} />
                     </div>
                     <div>
                       <h3 className="text-lg sm:text-xl font-black uppercase tracking-widest leading-tight">Submit Protocol Case</h3>
                       <p className="text-[8px] sm:text-[9px] font-bold text-indigo-100 uppercase mt-1 tracking-widest opacity-80">Infrastructure Support Request</p>
                     </div>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors shrink-0"><X size={20} sm:size={24}/></button>
               </div>

              <div className="p-10 overflow-y-auto max-h-[70vh] custom-scrollbar">
                 <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Case Subject</label>
                       <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold" placeholder="Brief Summary of Issue" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                          <select className="w-full px-5 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none text-sm font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                             <option>Technical</option>
                             <option>Billing</option>
                             <option>Account Access</option>
                             <option>Feature Request</option>
                             <option>Urgent Bug</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocol Priority</label>
                          <select className="w-full px-5 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none text-sm font-bold appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as any})}>
                             <option value="low">Low</option>
                             <option value="medium">Medium</option>
                             <option value="high">High</option>
                             <option value="urgent">Urgent</option>
                          </select>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Technical Report</label>
                       <textarea required rows={5} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold resize-none" placeholder="Provide as much detail as possible for faster resolution..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                    </div>

                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 flex items-start gap-4">
                       <Info size={20} className="text-blue-600 mt-0.5" />
                       <div className="space-y-1">
                          <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Protocol Notice</p>
                          <p className="text-[9px] font-bold text-blue-600/70 leading-relaxed uppercase">Submission logs your system state and current plan tier to help auditors assist you faster.</p>
                       </div>
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-4 sm:py-6 rounded-2xl sm:rounded-3xl shadow-2xl hover:bg-indigo-700 transition-all uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-[11px] flex items-center justify-center gap-3 active:scale-95">
                       {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={20} /> Authorize Case Filing</>}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
