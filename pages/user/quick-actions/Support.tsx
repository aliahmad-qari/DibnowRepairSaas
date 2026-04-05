
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
   LifeBuoy, MessageSquare, Plus, Search, ChevronLeft, Send, Tag, AlertCircle, Info,
   CheckCircle2, Clock, Inbox, Activity, History, Timer, Globe, ShieldCheck,
   FileText, Download, Mail, Zap, Headphones, HeadphonesIcon, ShieldAlert,
   Loader2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext.tsx';
import { callBackendAPI } from '../../../api/apiClient.ts';
import { BackButton } from '../../../components/common/BackButton';

export const SupportPage: React.FC = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const [tickets, setTickets] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   const loadTickets = async () => {
      setIsLoading(true);
      try {
         const resp = await callBackendAPI('/complaints', null, 'GET');
         setTickets(resp || []);
      } catch (error) {
         console.error('Support handshake failed:', error);
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      loadTickets();
   }, [user]);

   // --- NEW ADDITIVE LOGIC: METRICS CALCULATION ---
   const supportMetrics = useMemo(() => {
      return {
         total: tickets.length,
         open: tickets.filter(t => t.status === 'pending').length,
         inProgress: tickets.filter(t => t.status === 'investigating').length,
         resolved: tickets.filter(t => t.status === 'resolved').length,
         avgResponse: "2.4h"
      };
   }, [tickets]);

   const categoriesGuidance = [
      { label: 'Billing & Payments', icon: DollarSign },
      { label: 'System Access', icon: Lock },
      { label: 'Technical Error', icon: Wrench },
      { label: 'Performance Issue', icon: Activity },
      { label: 'Security Concern', icon: ShieldCheck },
      { label: 'Feature Request', icon: Rocket }
   ];

   return (
      <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1400px] mx-auto px-4 sm:px-0">
         <div className="flex items-center gap-4 pt-4">
            <BackButton />
            <div className="min-w-0">
               <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none truncate">Support Infrastructure</h2>
               <p className="text-slate-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mt-2 truncate">Direct Administrative Uplink Node</p>
            </div>
         </div>

         {/* --- TASK 1: SUPPORT OVERVIEW DASHBOARD --- */}
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 animate-in slide-in-from-top-4 duration-700">
            {[
               { label: 'Total Logs', val: supportMetrics.total, icon: History, color: 'text-slate-600', bg: 'bg-slate-50' },
               { label: 'Open Node', val: supportMetrics.open, icon: Inbox, color: 'text-amber-600', bg: 'bg-amber-50' },
               { label: 'Audit Progress', val: supportMetrics.inProgress, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
               { label: 'Resolved', val: supportMetrics.resolved, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { label: 'Avg Handshake', val: supportMetrics.avgResponse, icon: Timer, color: 'text-indigo-600', bg: 'bg-indigo-50', fullWidth: true }
            ].map((stat, i) => (
               <div key={i} className={`bg-white p-4 sm:p-5 rounded-[1.5rem] sm:rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 group hover:border-indigo-200 transition-all ${stat.fullWidth ? 'col-span-2 md:col-span-1' : ''}`}>
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform shrink-0`}>
                     <stat.icon size={18} />
                  </div>
                  <div className="min-w-0">
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{stat.label}</p>
                     <h4 className="text-base sm:text-lg font-black text-slate-800 truncate">{stat.val}</h4>
                  </div>
               </div>
            ))}
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">

               {/* --- TASK 3: QUICK SUPPORT ACTIONS PANEL --- */}
               <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-8 border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <button onClick={() => navigate('/user/tickets')} className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl group hover:bg-indigo-600 transition-all text-left">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm group-hover:rotate-12 transition-all shrink-0"><Plus size={18} /></div>
                     <span className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-900 group-hover:text-white tracking-widest leading-none">Launch Ticket</span>
                  </button>
                  <button onClick={() => navigate('/user/tickets')} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-slate-900 transition-all text-left">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 shadow-sm group-hover:scale-110 transition-all shrink-0"><History size={18} /></div>
                     <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-700 group-hover:text-white tracking-widest leading-none">Ticket History</span>
                  </button>
                  <button className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-emerald-600 transition-all text-left sm:col-span-2 lg:col-span-1">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 shadow-sm group-hover:scale-110 transition-all shrink-0"><Download size={18} /></div>
                     <span className="text-[9px] sm:text-[10px] font-black uppercase text-slate-700 group-hover:text-white tracking-widest leading-none">Audit Report</span>
                  </button>
               </div>

               <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 sm:p-8 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                     <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-800">Active Case Files</h3>
                     <button onClick={() => navigate('/user/tickets')} className="text-[9px] sm:text-[10px] font-black text-indigo-600 uppercase hover:underline">Manage All</button>
                  </div>
                  <div className="divide-y divide-slate-50 relative min-h-[150px]">
                     {isLoading && (
                        <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                           <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                        </div>
                     )}
                     {tickets.length === 0 ? (
                        <div className="p-12 sm:p-20 text-center text-slate-300">
                           <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
                           <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest leading-none">No Active Support Nodes</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase mt-3 tracking-widest">Last Audit: {new Date().toLocaleTimeString()}</p>
                        </div>
                     ) : (
                        tickets.slice(0, 5).map(t => (
                           <div key={t._id} className="p-5 sm:p-6 hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer">
                              <div className="flex items-center gap-4 min-w-0">
                                 <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-[9px] shrink-0">#{t._id.slice(-4).toUpperCase()}</div>
                                 <div className="min-w-0">
                                    <h4 className="text-[13px] sm:text-sm font-black text-slate-800 truncate">{t.subject}</h4>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-1 truncate">{t.category} • {t.status}</p>
                                 </div>
                              </div>
                              <ChevronLeft size={16} className="text-slate-200 group-hover:text-indigo-600 rotate-180 transition-all shrink-0 ml-4" />
                           </div>
                        ))
                     )}
                  </div>
               </div>

               {/* --- TASK 4: TICKET CATEGORIES GUIDANCE --- */}
               <div className="bg-white rounded-[2.2rem] sm:rounded-[3rem] p-6 sm:p-8 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                     <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shrink-0"><Tag size={20} /></div>
                     <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-800">Uplink Protocols</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                     {categoriesGuidance.map((cat, i) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3 group hover:border-indigo-300 hover:bg-white transition-all">
                           <cat.icon size={14} className="text-slate-400 group-hover:text-indigo-600 shrink-0" />
                           <span className="text-[9px] font-black uppercase text-slate-600 tracking-tight truncate">{cat.label}</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* --- TASK 6: SUPPORT ACTIVITY TIMELINE --- */}
               <div className="bg-white rounded-[2.2rem] sm:rounded-[3rem] p-6 sm:p-8 border border-slate-100 shadow-sm">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 sm:mb-8 px-2">Sequential Activity Ledger</h3>
                  <div className="space-y-6 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                     {[
                        { label: 'System Audit', msg: 'Cloud Node Handshake Successful', icon: ShieldCheck, color: 'text-indigo-500' },
                        { label: 'Last Ticket Resolved', msg: 'Reference #TKT-8821 Closed', icon: CheckCircle2, color: 'text-emerald-500' },
                        { label: 'Last Interaction', msg: 'System Auditor Response Logged', icon: Mail, color: 'text-blue-500' }
                     ].map((item, i) => (
                        <div key={i} className="flex gap-4 sm:gap-6 relative z-10">
                           <div className={`w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0 ${item.color}`}><item.icon size={16} /></div>
                           <div className="min-w-0">
                              <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{item.label}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest leading-relaxed">{item.msg}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            <div className="space-y-4 sm:space-y-6 lg:col-span-4">
               <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.2rem] sm:rounded-[3rem] p-8 sm:p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 p-10 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700 hidden sm:block"><LifeBuoy size={150} /></div>
                  <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-2">Technical Assistance</h4>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">Need Support?</h2>
                  <p className="text-indigo-100/70 text-[11px] font-medium mt-4 sm:mt-6 leading-relaxed uppercase tracking-tighter">Our system auditors are available 24/7 to assist with operational queries.</p>
                  <button onClick={() => navigate('/user/tickets')} className="w-full mt-8 sm:mt-10 py-5 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:-translate-y-1 transition-all active:scale-95">Launch New Ticket</button>
               </div>

               {/* --- TASK 5: ENHANCED SLA VISUALIZATION --- */}
               <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm shrink-0"><Zap size={18} /></div>
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">SLA Protocol Index</h4>
                  </div>
                  <div className="space-y-3 sm:space-y-4">
                     <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100 group">
                        <div className="flex items-center gap-3 min-w-0">
                           <Clock size={14} className="text-slate-400 group-hover:text-indigo-600 shrink-0" />
                           <span className="text-[9px] font-black uppercase text-slate-500 truncate">Standard Seq</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-900 shrink-0">4 Hours</span>
                     </div>
                     <div className="p-4 bg-rose-50 rounded-2xl flex items-center justify-between border border-rose-100 group">
                        <div className="flex items-center gap-3 min-w-0">
                           <ShieldAlert size={14} className="text-rose-600 group-hover:scale-110 transition-transform shrink-0" />
                           <span className="text-[9px] font-black uppercase text-rose-700 truncate">Critical Node</span>
                        </div>
                        <span className="text-[10px] font-black text-rose-900 uppercase shrink-0">Priority</span>
                     </div>
                  </div>
               </div>

               {/* --- TASK 7: TRUST & AVAILABILITY INDICATORS --- */}
               <div className="bg-slate-900 rounded-[2.2rem] sm:rounded-[2.5rem] p-6 sm:p-8 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><Globe size={100} /></div>
                  <div className="space-y-6 relative z-10">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-400">Auditors Online</span>
                        </div>
                        <span className="text-[8px] font-black uppercase text-slate-500">24/7 Active</span>
                     </div>
                     <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <ShieldCheck size={20} className="text-indigo-400 shrink-0" />
                        <div className="min-w-0">
                           <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest truncate">Compliance Node</p>
                           <p className="text-[8px] font-bold text-slate-500 uppercase mt-1 leading-tight">Verified Protocol Sequence</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-5 sm:p-6 bg-white rounded-2xl sm:rounded-[2.2rem] border border-slate-100 flex items-start gap-4">
                  <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">
                     Uplink Terminal v4.0. Operational status synchronized with central administrative mainframe.
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
};

const DollarSign = (props: any) => <FileText {...props} />;
const Lock = (props: any) => <ShieldCheck {...props} />;
const Wrench = (props: any) => <Activity {...props} />;
const Rocket = (props: any) => <Zap {...props} />;
