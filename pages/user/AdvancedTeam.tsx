
import React, { useState, useEffect } from 'react';
import {
   Users, UserPlus, Shield, X, Save, Lock, Mail,
   CheckCircle2, AlertCircle, Key, ShieldCheck,
   User, Eye, Edit3, ShieldAlert
} from 'lucide-react';
import { db } from '../../api/db';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useAuth } from '../../context/AuthContext';
import { Activity } from 'lucide-react';

export const AdvancedTeam: React.FC = () => {
   const { user } = useAuth();
   const [members, setMembers] = useState<any[]>([]);
   const [showAddModal, setShowAddModal] = useState(false);
   const [formData, setFormData] = useState({
      name: '', email: '', password: '', role: 'Technician', status: 'enabled',
      permissions: {
         repairs: { read: true, create: true, update: true, delete: false },
         inventory: { read: true, create: true, update: false, delete: false },
         pos: { read: true, create: true, update: false, delete: false },
         billing: { read: false, create: false, update: false, delete: false }
      }
   });

   const [isLoading, setIsLoading] = useState(true);
   const [isSubmitting, setIsSubmitting] = useState(false);

   useEffect(() => {
      const loadData = async () => {
         if (!user) return;
         setIsLoading(true);
         try {
            const teamResp = await callBackendAPI('/team', null, 'GET');
            setMembers(teamResp || []);
         } catch (error) {
            console.error('Failed to load team data:', error);
         } finally {
            setIsLoading(false);
         }
      };
      loadData();
   }, [user]);

   const togglePermission = (module: string, action: string) => {
      setFormData(prev => ({
         ...prev,
         permissions: {
            ...prev.permissions,
            [module]: {
               ...(prev.permissions as any)[module],
               [action]: !(prev.permissions as any)[module][action]
            }
         }
      }));
   };

   const handleAddSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user || isSubmitting) return;
      setIsSubmitting(true);
      try {
         const response = await callBackendAPI('/team', formData, 'POST');
         if (response) {
            const teamResp = await callBackendAPI('/team', null, 'GET');
            setMembers(teamResp || []);
            setShowAddModal(false);
         }
      } catch (error) {
         console.error('Enrollment failed:', error);
         alert('Failed to enroll associate.');
      } finally {
         setIsSubmitting(false);
      }
   };

   const toggleStatus = async (id: string, current: string) => {
      const nextStatus = current === 'enabled' ? 'disabled' : 'enabled';
      try {
         await callBackendAPI(`/team/${id}`, { status: nextStatus }, 'PUT');
         const teamResp = await callBackendAPI('/team', null, 'GET');
         setMembers(teamResp || []);
      } catch (error) {
         console.error('Status toggle failed:', error);
      }
   };

   return (
      <div className="space-y-8 pb-32 animate-in fade-in duration-500">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">Advanced Team Node</h1>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                  <ShieldCheck size={12} className="text-blue-500" /> Granular Access Control System (RBAC)
               </p>
            </div>
            <button
               onClick={() => setShowAddModal(true)}
               className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:scale-105 transition-all text-[11px] uppercase tracking-widest"
            >
               <UserPlus size={18} /> Provision V2 Associate
            </button>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative min-h-[400px]">
            {isLoading && (
               <div className="absolute inset-0 z-[300] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <Activity className="w-12 h-12 text-blue-600 animate-spin" />
               </div>
            )}
            {members.map(member => (
               <div key={member._id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150 ${member.status === 'enabled' ? 'bg-blue-50' : 'bg-rose-50'}`} />

                  <div className="flex items-start justify-between relative z-10 mb-8">
                     <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black shadow-lg ${member.status === 'enabled' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                           {member.name.charAt(0)}
                        </div>
                        <div>
                           <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">{member.name}</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {member.role} • <span className={member.status === 'enabled' ? 'text-emerald-500' : 'text-rose-500'}>{member.status.toUpperCase()}</span>
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={() => toggleStatus(member._id, member.status)} className={`p-3 rounded-xl transition-all ${member.status === 'enabled' ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                           <Lock size={18} />
                        </button>
                        <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600 transition-all"><Edit3 size={18} /></button>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 relative z-10">
                     {Object.entries(member.permissions || {}).map(([module, perms]: [string, any]) => (
                        <div key={module} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-200 pb-1">{module}</p>
                           <div className="flex flex-wrap gap-2">
                              {perms.read && <span className="text-[8px] bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-black uppercase">READ</span>}
                              {perms.create && <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 font-black uppercase">CREATE</span>}
                              {perms.update && <span className="text-[8px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-100 font-black uppercase">UPDATE</span>}
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between relative z-10">
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Mail size={14} className="text-slate-300" /> {member.email}
                     </div>
                     <span className="text-[9px] font-black text-slate-300 uppercase italic">ID: {member._id}</span>
                  </div>
               </div>
            ))}
         </div>

         {showAddModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
               <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                  <div className="bg-blue-600 p-6 md:p-8 text-white flex items-center justify-between shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                           <UserPlus size={24} />
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-widest">Enroll Advanced Associate</h3>
                     </div>
                     <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
                  </div>

                  <div className="overflow-y-auto p-8 md:p-12 custom-scrollbar">
                     <form onSubmit={handleAddSubmit} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Name</label>
                              <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-bold" placeholder="Staff Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Email</label>
                              <input required type="email" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-bold" placeholder="staff@shop.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Staff Password</label>
                              <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-bold" placeholder="Initialize Password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-blue-50 pb-4">
                              <Shield size={16} /> Capability matrix delegation
                           </h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {Object.keys(formData.permissions).map((module) => (
                                 <div key={module} className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{module.toUpperCase()} MODULE</p>
                                    <div className="grid grid-cols-2 gap-3">
                                       {['read', 'create', 'update'].map(action => (
                                          <label key={action} className="flex items-center gap-3 cursor-pointer group">
                                             <div onClick={() => togglePermission(module, action)} className={`w-10 h-6 rounded-full relative transition-all ${((formData.permissions as any)[module] as any)[action] ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${((formData.permissions as any)[module] as any)[action] ? 'right-1' : 'left-1'}`} />
                                             </div>
                                             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{action}</span>
                                          </label>
                                       ))}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl shadow-2xl hover:bg-blue-700 transition-all uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                           {isSubmitting ? <Activity className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                           {isSubmitting ? 'Authorizing...' : 'Authorize Associate Node'}
                        </button>
                     </form>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
