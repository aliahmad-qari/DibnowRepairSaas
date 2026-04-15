import React, { useState, useEffect, useMemo } from 'react';
import {
  LifeBuoy, Plus, Search, Filter, MessageSquare, Clock, AlertCircle,
  CheckCircle2, MoreHorizontal, User, Send, X, ShieldCheck, Zap,
  Activity, ArrowUpRight, ChevronDown, RefreshCcw, Loader2, MessageCircle, AlertTriangle, Paperclip
} from 'lucide-react';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { BackButton } from '../../components/common/BackButton';
import Swal from 'sweetalert2';

export const Tickets: React.FC = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [formData, setFormData] = useState({
    subject: '',
    category: 'Technical',
    priority: 'Medium',
    description: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const resp = await callBackendAPI('/api/tickets', null, 'GET');
        setTickets(Array.isArray(resp) ? resp : (resp?.data || []));
      } catch (error) {
        console.error('Failed to load tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (t.trackingId && t.trackingId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length
  }), [tickets]);

  const handleAddTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const resp = await callBackendAPI('/api/tickets', formData, 'POST');
      if (resp) {
        setShowAddModal(false);
        setFormData({ subject: '', category: 'Technical', priority: 'Medium', description: '' });
        const update = await callBackendAPI('/api/tickets', null, 'GET');
        setTickets(Array.isArray(update) ? update : (update?.data || []));
        Swal.fire({ icon: 'success', title: 'Ticket Logged', text: 'Our support nodes have received your request.', timer: 2000, showConfirmButton: false });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket || isSending) return;
    setIsSending(true);
    try {
      const resp = await callBackendAPI(`/api/tickets/${activeTicket._id}/messages`, { message: replyText }, 'POST');
      if (resp) {
        setReplyText('');
        const update = await callBackendAPI('/api/tickets', null, 'GET');
        const updateArray = Array.isArray(update) ? update : (update?.data || []);
        setTickets(updateArray);
        const updatedActive = updateArray.find((t: any) => t._id === activeTicket._id);
        if (updatedActive) setActiveTicket(updatedActive);
      }
    } catch (e) {
        console.error(e);
    } finally {
        setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative max-w-[1600px] mx-auto px-4 md:px-6">
      <BackButton />
      
      {isLoading && (
        <div className="absolute inset-0 z-[300] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
          <LifeBuoy className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-none uppercase">Encryption Support Hub</h2>
          <p className="text-slate-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2"><LifeBuoy size={14} className="text-indigo-600" /> Authorized Helpdesk & Resolution Node</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
        >
          <Plus size={20} /> Open New Interface
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Protocols</p>
          <h4 className="text-4xl font-black text-slate-800 tracking-tighter">{stats.open} Threads</h4>
          <p className="text-[10px] font-bold text-amber-500 uppercase mt-4 flex items-center gap-2"><Clock size={14} /> Attention Required</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Finalized Nodes</p>
          <h4 className="text-4xl font-black text-slate-800 tracking-tighter">{stats.resolved} Resolved</h4>
          <p className="text-[10px] font-bold text-emerald-500 uppercase mt-4 flex items-center gap-2"><CheckCircle2 size={14} /> Efficiency Stable</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm sm:col-span-2 lg:col-span-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Lifecycle</p>
          <h4 className="text-4xl font-black text-slate-800 tracking-tighter">{stats.total} Total</h4>
          <p className="text-[10px] font-bold text-indigo-500 uppercase mt-4 flex items-center gap-2"><Activity size={14} /> Network Healthy</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-4 sm:p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/20">
           <div className="relative flex-1 w-full">
              <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                 type="text"
                 placeholder="Search Audit ID or Subject Node..."
                 className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3.5 sm:py-4 bg-white border-2 border-slate-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none shadow-sm transition-all"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0">
             {['all', 'open', 'resolved'].map(f => (
               <button key={f} onClick={() => setStatusFilter(f)} className={`px-4 sm:px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{f}</button>
             ))}
           </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50/50 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">Incident Node</th>
                <th className="px-8 py-6">Subject Protocol</th>
                <th className="px-8 py-6">Category</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-right">Updated</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTickets.map((ticket) => (
                <tr key={ticket._id} onClick={() => setActiveTicket(ticket)} className="hover:bg-indigo-50/20 transition-all cursor-pointer group">
                  <td className="px-8 py-7 font-mono text-[10px] font-black text-indigo-600 uppercase tracking-tighter">#{ticket.trackingId || ticket._id.toString().slice(-6)}</td>
                  <td className="px-8 py-7">
                    <p className="font-black text-slate-800 text-sm tracking-tight uppercase leading-none">{ticket.subject}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Urgency: {ticket.priority}</p>
                  </td>
                  <td className="px-8 py-7">
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">{ticket.category}</span>
                  </td>
                  <td className="px-8 py-7 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border inline-flex items-center gap-2 ${ticket.status === 'open' ? 'bg-amber-50 text-amber-700 border-amber-100' : ticket.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'open' ? 'bg-amber-500' : ticket.status === 'resolved' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-8 py-7 text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">~{new Date(ticket.updatedAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-7 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><ArrowUpRight size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket View Modal */}
      {activeTicket && (
        <div className="fixed inset-0 z-[600] flex justify-end">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setActiveTicket(null)} />
          <div className="relative w-full max-w-[550px] bg-white h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col border-l border-slate-100">
            <div className="bg-slate-900 p-6 sm:p-10 text-white shrink-0">
               <div className="flex items-center justify-between mb-8 sm:mb-12">
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/10"><MessageCircle size={24} sm:size={32} /></div>
                    <div>
                       <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest leading-none truncate max-w-[200px] sm:max-w-none">Node Response</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 sm:mt-2 tracking-widest opacity-80">Reference ID: #{activeTicket.trackingId || activeTicket._id}</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTicket(null)} className="p-3 hover:bg-rose-500 rounded-full transition-all shrink-0"><X size={20} sm:size={24} /></button>
               </div>
               <div className="space-y-4">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border inline-flex items-center gap-2 ${activeTicket.status === 'open' ? 'bg-amber-500/20 text-amber-200 border-amber-500/20' : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/20'}`}>
                    {activeTicket.status} Protocol
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight uppercase">{activeTicket.subject}</h2>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar space-y-8 bg-slate-50/30">
               {/* Messages Feed */}
               <div className="space-y-6">
                 <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertTriangle size={14} /> Originating Query</p>
                    <p className="text-slate-700 text-sm font-bold leading-relaxed">{activeTicket.description}</p>
                 </div>
                 {(activeTicket.messages || []).map((m: any, i: number) => (
                   <div key={i} className={`p-6 rounded-[2rem] border shadow-sm ${m.role === 'support' ? 'bg-indigo-50 border-indigo-100 ml-4' : 'bg-white border-slate-100 mr-4'}`}>
                      <p className="text-[9px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${m.role === 'support' ? 'text-indigo-600' : 'text-slate-400'}">
                        {m.role === 'support' ? <ShieldCheck size={12} /> : <User size={12} />} {m.role === 'support' ? 'Support Intelligence' : 'You (Authorized)'}
                      </p>
                      <p className="text-slate-800 text-sm font-black leading-relaxed">{m.message}</p>
                   </div>
                 ))}
               </div>
            </div>

            <div className="p-6 sm:p-10 bg-white border-t border-slate-100 shrink-0 mb-safe">
               <form onSubmit={handleSendReply} className="flex flex-col gap-4">
                  <div className="relative">
                    <textarea 
                      className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 font-bold text-sm min-h-[120px] resize-none"
                      placeholder="Input encrypted response protocol..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button type="submit" disabled={isSending} className="absolute bottom-6 right-6 bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all">
                      {isSending ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                    </button>
                  </div>
               </form>
            </div>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-3xl sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-6 sm:p-10 text-white flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/10 shrink-0"><Plus size={24} sm:size={32} /></div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest leading-none">New Support Node</h3>
                    <p className="text-[10px] font-bold text-indigo-100 uppercase mt-1.5 sm:mt-2 tracking-widest opacity-80">Transmitting Query Protocol</p>
                  </div>
               </div>
               <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-rose-500 rounded-full transition-all shrink-0"><X size={20} sm:size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 md:p-12 custom-scrollbar">
              <form onSubmit={handleAddTicket} className="space-y-6 sm:space-y-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Subject Descriptor</label>
                   <input type="text" required placeholder="Nature of protocol failure..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Domain Module</label>
                      <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                         <option>Technical</option>
                         <option>Billing</option>
                         <option>Account</option>
                         <option>Protocol Error</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Priority Metric</label>
                      <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-[10px] uppercase tracking-widest text-rose-600" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                         <option>Low</option>
                         <option>Medium</option>
                         <option>Critical</option>
                         <option>System Failure</option>
                      </select>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Context Payload (Description)</label>
                   <textarea required rows={4} placeholder="Detailed forensics of the incident..." className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="pt-6">
                   <button type="submit" disabled={isSending} className="w-full bg-slate-900 text-white font-black py-4 sm:py-5 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                      {isSending ? <Loader2 className="animate-spin" /> : <Send size={18} />} Initialize Transmission
                   </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
