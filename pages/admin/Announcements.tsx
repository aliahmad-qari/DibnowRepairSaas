
import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Search, Filter, Trash2, 
  Edit2, Globe, Clock, User, CheckCircle2,
  X, Send, Info, ShieldCheck, Zap,
  LayoutGrid, Calendar, Hash, Mail, Loader2
} from 'lucide-react';
import { db } from '../../api/db.ts';

export const AdminAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    target: 'all'
  });

  useEffect(() => {
    // Initial static mock as we don't have a specific db node for this yet in the provided db structure
    const initial = [
      { id: '1', title: 'System Maintenance: Node Q3', message: 'The primary commerce node will be offline for 10 minutes on Sunday.', type: 'warning', date: '14 Jan 2025', target: 'all' },
      { id: '2', title: 'New Plan: Gold Tier Active', message: 'We have deployed the high-capacity Gold Tier for multi-shop nodes.', type: 'success', date: '10 Jan 2025', target: 'all' }
    ];
    setAnnouncements(initial);
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);
    
    // Simulations
    await new Promise(r => setTimeout(r, 1500));
    
    // Broadcast notification to all users globally using existing db API
    db.notifications.add({
      userId: 'global',
      title: formData.title,
      message: formData.message,
      type: formData.type as any
    });

    const newEntry = {
      ...formData,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    setAnnouncements([newEntry, ...announcements]);
    setIsPublishing(false);
    setShowModal(false);
    setFormData({ title: '', message: '', type: 'info', target: 'all' });
    
    db.audit.log({
      actionType: 'Broadcast Published',
      resource: 'Communications',
      details: `Published Global Announcement: ${formData.title}`
    });
  };

  const getStatusColor = (type: string) => {
    switch(type) {
      case 'success': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Broadcast Control</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Megaphone size={14} className="text-indigo-600" /> Administrative Communication Node
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all text-[11px] uppercase tracking-widest"
        >
          <Plus size={18} /> Deploy New Announcement
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
         <div className="lg:col-span-8">
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
               <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Operational Log</h3>
                  <div className="flex items-center gap-2">
                     <Filter size={14} className="text-slate-300" />
                     <span className="text-[10px] font-black text-slate-400 uppercase">Recent 30 Cycles</span>
                  </div>
               </div>
               <div className="divide-y divide-slate-50">
                  {announcements.map((ann) => (
                    <div key={ann.id} className="p-8 flex items-start gap-6 hover:bg-slate-50 transition-all group">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${getStatusColor(ann.type)}`}>
                          <Megaphone size={24} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                             <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">{ann.title}</h4>
                             <span className="text-[9px] font-bold text-slate-300 uppercase">{ann.date}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-500 leading-relaxed uppercase tracking-tighter">"{ann.message}"</p>
                          <div className="mt-6 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-widest">Target: {ann.target}</span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getStatusColor(ann.type)}`}>{ann.type}</span>
                             </div>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 shadow-sm"><Edit2 size={16}/></button>
                                <button className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-600 shadow-sm"><Trash2 size={16}/></button>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Zap size={150}/></div>
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Globe size={24}/></div>
                     <h3 className="text-xl font-black uppercase tracking-tight leading-none">Global Sync</h3>
                  </div>
                  <p className="text-blue-100/60 text-xs font-medium leading-relaxed uppercase tracking-tighter">Announcements propagate to every shop dashboard instantly upon authorization. Use sparingly for critical infrastructure updates.</p>
                  <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                     <div>
                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Last Broadcast</p>
                        <p className="text-sm font-black text-white">{announcements[0]?.date}</p>
                     </div>
                     <ShieldCheck size={24} className="text-emerald-500" />
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2 px-2"><Info size={14}/> Communication Standards</h4>
               <div className="space-y-4">
                  {[
                    'Include specific technical node references',
                    'Specify impact duration for outages',
                    'Use high-visibility tags for downtime',
                    'Avoid non-critical noise in the stream'
                  ].map((rule, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                       <span className="text-[9px] font-black text-slate-600 uppercase tracking-tight">{rule}</span>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-indigo-100 animate-in zoom-in-95 duration-200">
              <div className="p-8 md:p-10 bg-indigo-600 text-white flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md shadow-2xl"><Megaphone size={28}/></div>
                    <div>
                       <h2 className="text-2xl font-black uppercase tracking-widest leading-none">New Broadcast</h2>
                       <p className="text-[9px] font-bold text-indigo-100 uppercase mt-2 tracking-widest opacity-80">Global Notification Protocol</p>
                    </div>
                 </div>
                 <button onClick={() => setShowModal(false)} className="p-3 bg-white/10 hover:bg-rose-500 rounded-full transition-all"><X size={24}/></button>
              </div>

              <div className="p-10 md:p-12 overflow-y-auto custom-scrollbar flex-1">
                 <form onSubmit={handlePublish} className="space-y-8">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Announcement Subject</label>
                       <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm font-black transition-all" placeholder="E.g. System Protocol Upgrade v9.4" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Message Severity</label>
                          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none text-xs font-black uppercase cursor-pointer">
                             <option value="info">Info (Standard)</option>
                             <option value="success">Success (Release)</option>
                             <option value="warning">Warning (Service)</option>
                          </select>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Audience Node</label>
                          <select value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none text-xs font-black uppercase cursor-pointer">
                             <option value="all">Global (All Tenants)</option>
                             <option value="gold">Gold Tier Only</option>
                             <option value="trial">Trial Users Only</option>
                          </select>
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Announcement Node (Technical Description)</label>
                       <textarea required rows={5} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm font-bold resize-none transition-all uppercase tracking-tighter" placeholder="Supply detailed narrative..." />
                    </div>

                    <div className="pt-6 flex gap-4">
                       <button type="submit" disabled={isPublishing} className="flex-1 py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                          {isPublishing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                          {isPublishing ? "TRANSMITTING PROTOCOL..." : "Authorize Global Dispatch"}
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
