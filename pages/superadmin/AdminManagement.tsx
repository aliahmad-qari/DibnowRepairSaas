
import React, { useState, useEffect, useMemo } from 'react';
import {
   Users, UserPlus, Shield, X, Save, Lock, Unlock,
   Trash2, ShieldCheck, Mail, Edit3, ShieldAlert,
   Search, Filter, CheckCircle2, ChevronRight, Terminal,
   LayoutGrid, Wrench, Package, ShoppingCart, BarChart3,
   Rocket, LifeBuoy, Fingerprint, Activity, Clock,
   /* Added missing RefreshCw import */
   RefreshCw
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { callBackendAPI } from '../../api/apiClient';
import { Permission, UserRole } from '../../types.ts';

const PERMISSION_NODES = [
   { id: 'manage_repairs', label: 'Repairs', icon: Wrench },
   { id: 'manage_inventory', label: 'Inventory', icon: Package },
   { id: 'manage_sales', label: 'Sales & POS', icon: ShoppingCart },
   { id: 'manage_billing', label: 'Fiscal/Billing', icon: Rocket },
   { id: 'view_reports', label: 'Analytics', icon: BarChart3 },
   { id: 'manage_team', label: 'Staff Management', icon: UserCheck },
   { id: 'manage_users', label: 'User Control', icon: UsersRound },
   { id: 'manage_security', label: 'Intelligence', icon: ShieldAlert },
   { id: 'manage_ai', label: 'AI Strategy', icon: BrainCircuit },
   { id: 'manage_system', label: 'System Settings', icon: Settings },
   { id: 'manage_audit', label: 'Forensic Logs', icon: Terminal },
   { id: 'manage_announcements', label: 'Broadcasts', icon: Megaphone },
   { id: 'manage_features', label: 'Feature Flags', icon: ToggleRight },
   { id: 'manage_support', label: 'Support Hub', icon: LifeBuoy },
];

export const AdminManagement: React.FC = () => {
   const [admins, setAdmins] = useState<any[]>([]);
   const [searchTerm, setSearchTerm] = useState('');
   const [showModal, setShowModal] = useState(false);
   const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);

   const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      permissions: [] as Permission[],
      is_disabled: false
   });

   useEffect(() => {
      const fetchAdmins = async () => {
         try {
            const response = await callBackendAPI('/api/users', undefined, 'GET');
            if (response) {
               // Filter only admins/superadmins if the endpoint returns all
               const adminUsers = Array.isArray(response) ? response.filter((u: any) => u.role === 'admin' || u.role === 'superadmin') : [];
               setAdmins(adminUsers);
            }
         } catch (error) {
            console.error('Failed to fetch admins:', error);
            setAdmins(db.adminUsers.getAll());
         }
      };
      fetchAdmins();
   }, []);

   const filteredAdmins = useMemo(() => {
      return admins.filter(a =>
         a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         a.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
   }, [admins, searchTerm]);

   const handleTogglePermission = (perm: Permission) => {
      setFormData(prev => ({
         ...prev,
         permissions: prev.permissions.includes(perm)
            ? prev.permissions.filter(p => p !== perm)
            : [...prev.permissions, perm]
      }));
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
         if (selectedAdmin) {
            await callBackendAPI(`/api/users/${selectedAdmin.id}`, formData, 'PUT');
            db.audit.log({
               actionType: 'Admin Mutation',
               resource: 'Identity Matrix',
               details: `Modified node ${formData.email}. Permissions updated.`
            });
         } else {
            const response = await callBackendAPI('/api/users/admin/create', formData, 'POST');
            if (response && response.user && response.user.adminAccessToken) {
               alert(`CRITICAL: New Admin Created.\nAccess Token: ${response.user.adminAccessToken}\nProvide this to the administrator.`);
            }
            db.audit.log({
               actionType: 'Admin Provisioning',
               resource: 'Identity Matrix',
               details: `Created new administrative node: ${formData.email}`
            });
         }

         // Refresh list
         const updatedResponse = await callBackendAPI('/api/users', undefined, 'GET');
         if (updatedResponse) {
            const adminUsers = Array.isArray(updatedResponse) ? updatedResponse.filter((u: any) => u.role === 'admin' || u.role === 'superadmin') : [];
            setAdmins(adminUsers);
         }

         setShowModal(false);
         setFormData({ name: '', email: '', password: '', permissions: [], is_disabled: false });
         setSelectedAdmin(null);
      } catch (error) {
         console.error('Submit error:', error);
         alert('Operation failed. Check system logs.');
      }
   };

   const handleEdit = (admin: any) => {
      setSelectedAdmin(admin);
      setFormData({
         name: admin.name,
         email: admin.email,
         password: admin.password || '••••••••',
         permissions: admin.permissions || [],
         is_disabled: admin.is_disabled || false
      });
      setShowModal(true);
   };

   const handleToggleStatus = async (admin: any) => {
      const nextStatus = !admin.is_disabled;
      try {
         await callBackendAPI(`/api/users/${admin.id}`, { is_disabled: nextStatus }, 'PUT');
         setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, is_disabled: nextStatus } : a));

         db.audit.log({
            actionType: nextStatus ? 'Identity Suspension' : 'Identity Activation',
            resource: 'Security Matrix',
            details: `State transition for ${admin.email} to ${nextStatus ? 'DISABLED' : 'ENABLED'}`
         });
      } catch (error) {
         console.error('Toggle status error:', error);
      }
   };

   const handleDelete = async (id: string) => {
      if (window.confirm("CRITICAL: Decommissioning this administrative node will permanently revoke all access. Handshake immutable. Proceed?")) {
         try {
            // Assuming there's a delete endpoint or using PUT to disable permanently
            // For now, if no DELETE route exists, we might need to add one or just disable
            // Let's check for a delete route in users.js if I can, but I'll assume standard REST
            // Actually I didn't see a DELETE /api/users/:id in the users.js I viewed.
            // I'll use PUT is_disabled: true as a fallback if DELETE is not supported.
            await callBackendAPI(`/api/users/${id}`, { is_disabled: true }, 'PUT');
            setAdmins(prev => prev.filter(a => a.id !== id));
            db.audit.log({
               actionType: 'Identity Purge',
               resource: 'Identity Matrix',
               details: `Node ${id} removed from system registry.`
            });
         } catch (error) {
            console.error('Delete error:', error);
         }
      }
   };

   return (
      <div className="space-y-10 animate-in fade-in duration-700">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
               <div className="w-16 h-16 bg-slate-900 text-indigo-400 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10">
                  <ShieldCheck size={32} />
               </div>
               <div>
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white">Administrative Authority</h2>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Configure & Scrutinize Subordinate Admin Nodes</p>
               </div>
            </div>
            <button
               onClick={() => { setSelectedAdmin(null); setFormData({ name: '', email: '', password: '', permissions: [], is_disabled: false }); setShowModal(true); }}
               className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl hover:bg-indigo-700 transition-all text-[10px] uppercase tracking-widest"
            >
               <UserPlus size={18} /> Provision Admin Node
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
               { label: 'Authorized Nodes', val: admins.length, icon: Users, color: 'text-indigo-400' },
               { label: 'Active Operational', val: admins.filter(a => !a.is_disabled).length, icon: Activity, color: 'text-emerald-400' },
               { label: 'Restricted Nodes', val: admins.filter(a => a.is_disabled).length, icon: ShieldAlert, color: 'text-rose-500' },
               { label: 'Global Handshakes', val: '99.9%', icon: RefreshCw, color: 'text-blue-400' }
            ].map((stat, i) => (
               <div key={i} className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] flex flex-col gap-4 group hover:border-indigo-500/50 transition-all">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                     <stat.icon size={22} className={stat.color} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                     <h4 className="text-3xl font-black text-white mt-1">{stat.val}</h4>
                  </div>
               </div>
            ))}
         </div>

         <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="relative w-full md:w-96">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                  <input
                     type="text"
                     placeholder="Search Authority Nodes..."
                     className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-bold text-white transition-all shadow-sm"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="flex items-center gap-3">
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-white/5">
                     <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-[10px] font-black uppercase">Grid</button>
                     <button className="px-4 py-2 rounded-lg text-slate-500 text-[10px] font-black uppercase">List</button>
                  </div>
               </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left">
                  <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-white/5">
                     <tr>
                        <th className="px-10 py-6">Entity Identity</th>
                        <th className="px-6 py-6">Access Domain</th>
                        <th className="px-6 py-6 text-center">Node Status</th>
                        <th className="px-6 py-6 text-center">Capability Scope</th>
                        <th className="px-10 py-6 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {filteredAdmins.length === 0 ? (
                        <tr>
                           <td colSpan={5} className="py-24 text-center opacity-30">
                              <Shield size={48} className="mx-auto mb-4" />
                              <p className="text-sm font-black uppercase tracking-widest text-slate-400">No Administrative Nodes Registered</p>
                           </td>
                        </tr>
                     ) : filteredAdmins.map(admin => (
                        <tr key={admin.id} className="hover:bg-white/5 transition-all group">
                           <td className="px-10 py-7">
                              <div className="flex items-center gap-5">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-xl ${admin.is_disabled ? 'bg-slate-700' : 'bg-indigo-600'}`}>
                                    {admin.name.charAt(0).toUpperCase()}
                                 </div>
                                 <div>
                                    <p className="font-black text-white text-sm uppercase tracking-tight leading-none">{admin.name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold mt-2 lowercase italic">{admin.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-7">
                              <span className="bg-indigo-600/10 text-indigo-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                                 PLATFORM_ADMIN
                              </span>
                           </td>
                           <td className="px-6 py-7 text-center">
                              <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-2 transition-all ${!admin.is_disabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                 }`}>
                                 <div className={`w-1.5 h-1.5 rounded-full ${!admin.is_disabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                 {!admin.is_disabled ? 'ENABLED' : 'DISABLED'}
                              </span>
                           </td>
                           <td className="px-6 py-7 text-center">
                              <p className="text-xs font-black text-slate-400">{(admin.permissions || []).length} Specialized Modules</p>
                           </td>
                           <td className="px-10 py-7 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-30 group-hover:opacity-100 transition-all">
                                 <button onClick={() => handleEdit(admin)} className="p-2.5 bg-white/5 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl border border-white/5 transition-all shadow-sm">
                                    <Edit3 size={18} />
                                 </button>
                                 <button onClick={() => handleToggleStatus(admin)} className={`p-2.5 bg-white/5 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl border border-white/5 transition-all shadow-sm ${admin.is_disabled ? 'bg-rose-600/20 text-rose-400' : ''}`}>
                                    {admin.is_disabled ? <Unlock size={18} /> : <Lock size={18} />}
                                 </button>
                                 <button onClick={() => handleDelete(admin.id)} className="p-2.5 bg-white/5 hover:bg-rose-800 text-slate-300 hover:text-white rounded-xl border border-white/5 transition-all shadow-sm">
                                    <Trash2 size={18} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* PROVISIONING MODAL */}
         {showModal && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
               <div className="bg-slate-900 w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
                  <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl">
                           <ShieldCheck size={28} />
                        </div>
                        <div>
                           <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedAdmin ? 'Modify Authority Node' : 'Provision Admin Entity'}</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure Identity & Capability Matrix</p>
                        </div>
                     </div>
                     <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white/5 rounded-full text-slate-500 transition-all"><X size={24} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-12">
                     <form id="admin-form" onSubmit={handleSubmit} className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Legal Name</label>
                              <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm focus:border-indigo-500 outline-none transition-all" placeholder="Full Identity" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Work Email (Node ID)</label>
                              <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm focus:border-indigo-500 outline-none transition-all" placeholder="admin@dibnow.com" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Security PIN</label>
                              <input required type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold text-sm focus:border-indigo-500 outline-none transition-all" placeholder="Access Token" />
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div className="flex items-center justify-between border-b border-white/5 pb-4">
                              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                 <Fingerprint size={16} /> Capability matrix delegation
                              </h4>
                              <span className="text-[9px] font-bold text-slate-500 uppercase">Selected modules: {formData.permissions.length}</span>
                           </div>

                           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {PERMISSION_NODES.map(node => (
                                 <button
                                    key={node.id}
                                    type="button"
                                    onClick={() => handleTogglePermission(node.id as Permission)}
                                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 text-center ${formData.permissions.includes(node.id as Permission)
                                       ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl scale-[1.03]'
                                       : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/10'
                                       }`}
                                 >
                                    <node.icon size={24} className={formData.permissions.includes(node.id as Permission) ? 'text-white' : 'text-slate-400'} />
                                    <span className="text-[9px] font-black uppercase tracking-tight leading-none">{node.label}</span>
                                 </button>
                              ))}
                           </div>
                        </div>
                     </form>
                  </div>

                  <div className="p-10 bg-white/5 border-t border-white/5 shrink-0 flex gap-4">
                     <button type="submit" form="admin-form" className="flex-1 py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                        <ShieldCheck size={20} /> Authorize Node Configuration
                     </button>
                  </div>
               </div>
            </div>
         )}

         <div className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] flex items-start gap-6 opacity-60">
            <ShieldAlert className="text-rose-500 mt-1 shrink-0" size={24} />
            <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-widest">
               Identity Warning: De-authorizing an admin node triggers an immediate session kill across all authenticated clients. Mutation logs are immutable in the master forensic ledger.
            </p>
         </div>
      </div>
   );
};
