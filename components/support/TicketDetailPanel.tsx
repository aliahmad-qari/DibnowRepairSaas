
import React from 'react';
import { 
  X, MessageSquare, Clock, Paperclip, CheckCircle2, 
  Terminal, User, Bot, ArrowRight, ShieldCheck,
  History, Calendar, Hash, Tag, AlertCircle, FileText
} from 'lucide-react';
import { TicketFeedbackModule } from './TicketFeedbackModule.tsx';

interface TicketDetailPanelProps {
  ticket: any;
  onClose: () => void;
  isAdmin?: boolean;
}

export const TicketDetailPanel: React.FC<TicketDetailPanelProps> = ({ ticket, onClose, isAdmin }) => {
  if (!ticket) return null;

  const getStatusStyle = (status: string) => {
    switch(status.toLowerCase()) {
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'investigating': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col relative z-10 overflow-hidden rounded-l-[3rem] border-l border-slate-100">
        
        {/* Header Block */}
        <div className="p-8 md:p-10 bg-slate-900 text-white flex flex-col gap-6 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Hash size={200} />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border backdrop-blur-md ${getStatusStyle(ticket.status)}`}>
               Protocol: {ticket.status}
            </div>
            <button onClick={onClose} className="p-3 bg-white/10 hover:bg-rose-500 rounded-full transition-all group">
              <X size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>
          <div className="relative z-10 space-y-2">
            <h3 className="text-3xl font-black tracking-tight uppercase leading-tight">{ticket.subject}</h3>
            <div className="flex flex-wrap items-center gap-4 pt-2">
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Tag size={12} className="text-indigo-400" /> {ticket.category}
               </div>
               <div className="w-1 h-1 rounded-full bg-slate-700" />
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Calendar size={12} className="text-indigo-400" /> {new Date(ticket.createdAt).toLocaleDateString()}
               </div>
               <div className="w-1 h-1 rounded-full bg-slate-700" />
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Hash size={12} className="text-indigo-400" /> {ticket.id}
               </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 custom-scrollbar bg-slate-50/30">
          
          {/* Feedback & Rating (ONLY FOR USER VIEW ON RESOLVED TICKETS) */}
          {!isAdmin && ticket.status === 'resolved' && (
            <TicketFeedbackModule ticketId={ticket.id} />
          )}

          {/* Original Description */}
          <section className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
              <FileText size={14} className="text-indigo-600" /> Problem Registry
            </h4>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative group hover:border-indigo-200 transition-all">
               <p className="text-sm font-bold text-slate-600 leading-relaxed uppercase tracking-tighter">
                  "{ticket.message}"
               </p>
               
               {/* Attached Files Mockup */}
               <div className="mt-8 pt-6 border-t border-slate-50">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Linked Evidence Nodes</p>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-white transition-all cursor-pointer">
                        <Paperclip size={14} className="text-indigo-500" />
                        <span className="text-[9px] font-black text-slate-500 uppercase truncate">log_dump_8821.txt</span>
                     </div>
                     <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-white transition-all cursor-pointer">
                        <Paperclip size={14} className="text-indigo-500" />
                        <span className="text-[9px] font-black text-slate-500 uppercase truncate">screen_capture_v1.png</span>
                     </div>
                  </div>
               </div>
            </div>
          </section>

          {/* Conversation Thread */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
              <MessageSquare size={14} className="text-indigo-600" /> Communication Stream
            </h4>
            <div className="space-y-6">
               {/* Model Reply Simulation */}
               <div className="flex gap-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg text-white">
                     <Bot size={18} />
                  </div>
                  <div className="bg-indigo-600 p-6 rounded-[2rem] rounded-tl-none shadow-xl text-white flex-1">
                     <p className="text-xs font-bold leading-relaxed uppercase tracking-tighter">
                        Node received. We have initiated a technical audit on your request. Our system architects are verifying the ledger discrepancy.
                     </p>
                     <p className="text-[8px] font-black uppercase opacity-60 mt-3 text-right">System Auditor • 2h ago</p>
                  </div>
               </div>

               {/* Resolved State Summary */}
               {ticket.status === 'resolved' && (
                 <div className="flex gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0 text-emerald-600 border border-emerald-200">
                       <CheckCircle2 size={18} />
                    </div>
                    <div className="bg-emerald-50 p-6 rounded-[2rem] rounded-tl-none border border-emerald-100 text-emerald-900 flex-1">
                       <h5 className="text-[10px] font-black uppercase tracking-widest mb-2">Resolution Finalized</h5>
                       <p className="text-xs font-bold leading-relaxed uppercase tracking-tighter italic">
                          "Protocol error corrected. License nodes have been resynchronized across all shop terminals. Future blocks prevented."
                       </p>
                       <p className="text-[8px] font-black uppercase text-emerald-600/60 mt-3 text-right">Closed by Infrastructure Lead</p>
                    </div>
                 </div>
               )}
            </div>
          </section>

          {/* Status Timeline */}
          <section className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2 px-2">
              <History size={14} className="text-indigo-600" /> Lifecycle Audit
            </h4>
            <div className="relative space-y-0 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
               {[
                 { type: 'Handshake', status: 'Initialized', date: '2h ago', icon: Clock, color: 'text-blue-500' },
                 { type: 'Audit', status: 'In Technical Review', date: '1h ago', icon: FileText, color: 'text-indigo-500' },
                 { type: 'Lifecycle', status: ticket.status.toUpperCase(), date: 'Just Now', icon: ShieldCheck, color: 'text-slate-800' }
               ].map((step, idx) => (
                 <div key={idx} className="relative flex items-center gap-6 pb-8 last:pb-0">
                    <div className={`w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center z-10 ${step.color}`}>
                       <step.icon size={16} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-none">{step.status}</p>
                       <p className="text-[8px] font-bold text-slate-400 uppercase mt-1.5">{step.type} node update • {step.date}</p>
                    </div>
                 </div>
               ))}
            </div>
          </section>

        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-white border-t border-slate-100 flex flex-col gap-4 shrink-0">
           <div className="flex items-center gap-4 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <ShieldCheck size={24} className="text-indigo-600 shrink-0" />
              <div>
                 <p className="text-[10px] font-black text-indigo-900 uppercase leading-none">Immutability Protocol Verified</p>
                 <p className="text-[9px] font-bold text-indigo-600/70 uppercase tracking-tighter mt-1">This communication is cryptographically signed and stored in the platform vault.</p>
              </div>
           </div>
           
           <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Close Audit Entry
              </button>
              {isAdmin && ticket.status !== 'resolved' && (
                <button className="px-8 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
                  Update State
                </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
