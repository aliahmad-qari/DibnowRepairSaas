
import React, { useState } from 'react';
import { Megaphone, Plus, Mail, ShieldAlert, Globe, X, Send, History, Trash2, Zap, Info, ShieldCheck, Loader2 } from 'lucide-react';
import { db } from '../../api/db.ts';

export const GlobalAnnouncements: React.FC = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', type: 'info' });

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    await new Promise(r => setTimeout(r, 1500));
    
    db.notifications.add({
      userId: 'global',
      title: formData.title,
      message: formData.message,
      type: formData.type as any
    });

    db.audit.log({
      actionType: 'GLOBAL_BROADCAST',
      resource: 'Communications',
      details: `Published: ${formData.title}`
    });

    setIsPublishing(false);
    setShowModal(false);
    setFormData({ title: '', message: '', type: 'info' });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tight">Broadcast Control</h2>
           <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Administrative Communication Infrastructure</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-700 transition-all text-[10px] uppercase tracking-widest">
          <Plus size={18} /> New Global Dispatch
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-8 space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl border-b-8 border-b-indigo-600">
               <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Broadcast Archive</h3>
                  <History size={18} className="text-slate-500" />
               </div>
               <div className="divide-y divide-white/5">
                  <div className="p-8 flex items-start gap-6 hover:bg-white/5 transition-all group">
                     <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-lg">
                        <Megaphone size={24} />
                     </div>
                     <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                           <h4 className="text-lg font-black text-white uppercase tracking-tight">System Upgrade v9.4</h4>
                           <span className="text-[9px] font-bold text-slate-500 uppercase">14 Jan 2025</span>
                        </div>
                        <p className="text-sm font-medium text-slate-400 leading-relaxed uppercase tracking-tighter">"Node synchronisation complete across all regional shards. Latency reduced by 40%."</p>
                        <div className="pt-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <span className="px-3 py-1 bg-white/5 rounded-lg text-[8px] font-black text-indigo-400 uppercase border border-white/5">Target: All Tenants</span>
                           <button className="text-slate-500 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 relative overflow-hidden group shadow-2xl">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000 rotate-12"><Zap size={150} className="text-indigo-400" /></div>
               <h3 className="text-xl font-black uppercase tracking-widest text-white mb-6">Channel Authority</h3>
               <div className="space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400 border border-white/10"><Globe size={20}/></div>
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Dashboard Stream</span>
                  </div>
                  <div className="flex items-center gap-4 opacity-50">
                     <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 border border-white/10"><Mail size={20}/></div>
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mass Email SMTP</span>
                  </div>
               </div>
               <div className="mt-12 p-5 bg-white/5 rounded-2xl border border-white/10">
                  <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">
                     Broadcasting a global message triggers an instant socket update to every authenticated client node.
                  </p>
               </div>
            </div>
         </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-slate-900 w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-95 duration-200">
              <div className="p-8 md:p-10 bg-indigo-600 text-white flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-5">
                    <Megaphone size={28} />
                    <h2 className="text-2xl font-black uppercase tracking-widest">Authorize Broadcast</h2>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-all"><X size={24}/></button>
              </div>
              <div className="p-10 md:p-12 overflow-y-auto">
                 <form onSubmit={handlePublish} className="space-y-8">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Dispatch Title</label>
                       <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-sm outline-none focus:border-indigo-500 transition-all" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Severity Protocol</label>
                       <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-xs font-black uppercase outline-none">
                          <option value="info" className="bg-slate-900">Standard Info</option>
                          <option value="success" className="bg-slate-900">Release Node</option>
                          <option value="warning" className="bg-slate-900">Maintenance Warning</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Payload Node (Message)</label>
                       <textarea required rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-3xl text-white font-bold text-sm resize-none outline-none focus:border-indigo-500 uppercase tracking-tighter" />
                    </div>
                    <button type="submit" disabled={isPublishing} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                       {isPublishing ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
                       {isPublishing ? 'TRANSMITTING...' : 'AUTHORIZE DISPATCH'}
                    </button>
                 </form>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
