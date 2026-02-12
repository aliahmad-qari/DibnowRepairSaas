import React, { useState } from 'react';
import { 
  Send, 
  User, 
  ShieldCheck, 
  Paperclip, 
  Image as ImageIcon,
  Bot,
  MoreVertical,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';

interface Message {
  id: string;
  sender: string;
  role: 'user' | 'admin' | 'system';
  text: string;
  timestamp: string;
  attachments?: string[];
}

interface ComplaintConversationThreadProps {
  complaint: any;
}

export const ComplaintConversationThread: React.FC<ComplaintConversationThreadProps> = ({ complaint }) => {
  const { user } = useAuth();
  const [reply, setReply] = useState('');
  
  // Mocked thread data specifically for the selected complaint node
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: complaint.user || 'User',
      role: 'user',
      text: complaint.description || "Initial incident registry: " + complaint.subject,
      timestamp: complaint.date + ' 10:00 AM',
      attachments: ['invoice_node_882.pdf']
    },
    {
      id: 'm2',
      sender: 'System Auditor',
      role: 'admin',
      text: "Handshake successful. We have received your report and initiated a technical audit. An infrastructure lead will review the ledger discrepancy shortly.",
      timestamp: complaint.date + ' 11:30 AM'
    }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      sender: user?.name || 'Authorized Actor',
      role: user?.role === UserRole.ADMIN ? 'admin' : 'user',
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, newMessage]);
    setReply('');
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden flex flex-col h-[600px] animate-in slide-in-from-bottom-6 duration-700">
      {/* Thread Header */}
      <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <ShieldCheck size={20} />
           </div>
           <div>
              <h3 className="text-sm font-black uppercase tracking-widest leading-none">Protocol Thread</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-tighter">Case Reference: {complaint.id}</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[8px] font-black uppercase bg-white/10 px-2 py-1 rounded border border-white/10 text-emerald-400">Encrypted</span>
           <button className="p-2 text-slate-400 hover:text-white transition-colors"><MoreVertical size={16}/></button>
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/30">
        {messages.map((msg) => {
          const isMe = msg.sender === user?.name;
          const isAdmin = msg.role === 'admin';
          
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
              <div className={`flex gap-4 max-w-[85%] ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${
                  isAdmin ? 'bg-slate-900 text-indigo-400 border-slate-800' : 'bg-white text-indigo-600 border-slate-100'
                }`}>
                  {isAdmin ? <Bot size={20} /> : <User size={20} />}
                </div>
                
                <div className="space-y-2">
                  <div className={`p-6 rounded-[2rem] text-xs font-bold leading-relaxed shadow-sm uppercase tracking-tighter ${
                    isMe 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                  }`}>
                    {msg.text}
                    
                    {msg.attachments && (
                      <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                        <p className="text-[8px] font-black opacity-60 tracking-widest">Linked Evidence Nodes</p>
                        {msg.attachments.map((file, idx) => (
                          <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg text-[9px] ${isMe ? 'bg-black/20' : 'bg-slate-50 border border-slate-100'}`}>
                            <Paperclip size={10} />
                            <span className="truncate">{file}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className={`text-[8px] font-black text-slate-400 uppercase tracking-widest ${isMe ? 'text-right' : 'text-left'}`}>
                    {msg.sender} • {msg.timestamp}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Module */}
      <div className="p-6 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={handleSend} className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
             <button type="button" className="p-2 text-slate-300 hover:text-indigo-600 transition-all hover:bg-indigo-50 rounded-lg">
                <Paperclip size={18} />
             </button>
          </div>
          <input 
            type="text" 
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Transmit reply to protocol thread..." 
            className="w-full pl-14 pr-16 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm font-black transition-all"
          />
          <button 
            type="submit"
            disabled={!reply.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            <Send size={18} />
          </button>
        </form>
        <div className="mt-4 flex items-center justify-center gap-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
           <span className="flex items-center gap-1"><Lock size={10} className="text-emerald-500" /> End-to-End Handshake Active</span>
           <span className="flex items-center gap-1"><CheckCircle2 size={10} className="text-emerald-500" /> Authorized Actor Only</span>
        </div>
      </div>
    </div>
  );
};