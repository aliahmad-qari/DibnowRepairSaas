import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Mail, Phone, MoreHorizontal, ShieldCheck,
  AlertCircle, X, Shield, Trash2, Lock, Unlock, Eye,
  Settings2, Briefcase, CheckSquare, Square,
  Package, Wrench, ShoppingCart, Landmark, LayoutDashboard, Rocket, Boxes, History, Layers, Tag, Globe, LifeBuoy, MessageSquare, ShieldHalf
} from 'lucide-react';
import Swal from 'sweetalert2';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useAuth } from '../../context/AuthContext';
import { useQuotas } from '../../hooks/useQuotas';
import { BackButton } from '../../components/common/BackButton';

const USER_PANEL_MODULES = [
  { id: 'dashboard', label: 'Dashboard Page', icon: LayoutDashboard },
  { id: 'pricing', label: 'Subscription & Plans', icon: Rocket },
  { id: 'repairs', label: 'Repair Management', icon: Wrench },
  { id: 'inventory', label: 'Stock Entry', icon: Package },
  { id: 'all-stock', label: 'Inventory Ledger', icon: Boxes },
  { id: 'pos', label: 'Point of Sale (Sell)', icon: ShoppingCart },
  { id: 'sold-items', label: 'Sales History', icon: History },
  { id: 'categories', label: 'Product Categories', icon: Layers },
  { id: 'brands', label: 'Manufacturer Brands', icon: Tag },
  { id: 'clients', label: 'Customer Database', icon: ShieldCheck },
  { id: 'team', label: 'Team Management', icon: Users },
  { id: 'wallet', label: 'Financial Wallet', icon: Landmark },
  { id: 'utilities', label: 'Utility Console', icon: Globe },
  { id: 'tickets', label: 'Support Desk', icon: LifeBuoy },
  { id: 'complaints', label: 'Complaints Center', icon: MessageSquare },
];

export const TeamMembers: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState<any>(null);
  const { quotas, refetch: refetchQuotas } = useQuotas();

  const isAtLimit = useMemo(() => {
    if (!quotas) return false;
    return quotas.limits.team.used >= quotas.limits.team.limit;
  }, [quotas]);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', role: 'Technician', department: 'General', status: 'active', permissions: [] as string[]
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const teamResp = await callBackendAPI('/api/team', null, 'GET');
        setMembers(Array.isArray(teamResp) ? teamResp : (teamResp?.data || []));
      } catch (error) {
        console.error('Failed to load team data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isAtLimit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const resp = await callBackendAPI('/api/team', formData, 'POST');
      if (resp) {
        setShowAddModal(false);
        setFormData({ name: '', email: '', phone: '', password: '', role: 'Technician', department: 'General', status: 'active', permissions: [] });
        const teamResp = await callBackendAPI('/api/team', null, 'GET');
        setMembers(Array.isArray(teamResp) ? teamResp : (teamResp?.data || []));
        refetchQuotas();
        Swal.fire({ icon: 'success', title: 'Associate Provisioned', text: 'New team member added to workspace.', timer: 2000, showConfirmButton: false });
      }
    } catch (error: any) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMemberStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await callBackendAPI(`/api/team/${id}`, { status: nextStatus }, 'PUT');
      const teamResp = await callBackendAPI('/api/team', null, 'GET');
      setMembers(Array.isArray(teamResp) ? teamResp : (teamResp?.data || []));
    } catch (error) {
      console.error(error);
    }
  };

  const updatePermissions = async (memberId: string, permissions: string[]) => {
    try {
      await callBackendAPI(`/api/team/${memberId}`, { permissions }, 'PUT');
      const teamResp = await callBackendAPI('/api/team', null, 'GET');
      const teamArray = Array.isArray(teamResp) ? teamResp : (teamResp?.data || []);
      setMembers(teamArray);
      const updatedMember = teamArray.find((m: any) => m._id === memberId);
      if (updatedMember) setShowPermissionModal(updatedMember);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative max-w-[1600px] mx-auto px-4 md:px-6">
      <BackButton />
      
      {isLoading && (
        <div className="absolute inset-0 z-[300] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
          <Users className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-none uppercase">Advanced Team Matrix</h2>
          <p className="text-slate-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2"><ShieldCheck size={14} className="text-indigo-600" /> Authorized Personnel Registry & RBAC Node</p>
        </div>
        <button
          onClick={() => isAtLimit ? navigate('/user/pricing') : setShowAddModal(true)}
          className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
        >
          <UserPlus size={18} /> Provision Associate
        </button>
      </div>

      <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50/50 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 whitespace-nowrap">
              <tr>
                <th className="px-8 py-6">Associate Node</th>
                <th className="px-8 py-6">Connectivity Profile</th>
                <th className="px-8 py-6">Operation Role</th>
                <th className="px-8 py-6 text-center">Protocol Status</th>
                <th className="px-8 py-6 text-center">Authority Matrix</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.map((member) => (
                <tr key={member._id} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="px-8 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-[1.2rem] flex items-center justify-center font-black text-sm shadow-sm shrink-0 uppercase group-hover:bg-indigo-600 group-hover:text-white transition-all">{member.name.charAt(0)}</div>
                      <span className="font-black text-slate-800 text-base tracking-tight uppercase leading-none">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-600 uppercase tracking-tighter">{member.email}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.phone || 'NO-COMMS'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <span className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">{member.role}</span>
                  </td>
                  <td className="px-8 py-7 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-2 border ${member.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {member.status === 'active' ? 'Uplink Active' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-8 py-7 text-center">
                    <button onClick={() => setShowPermissionModal(member)} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all whitespace-nowrap shadow-sm">Config Access: {(member.permissions || []).length} Nodes</button>
                  </td>
                  <td className="px-8 py-7 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => toggleMemberStatus(member._id, member.status)} className={`p-2.5 rounded-xl transition-all shadow-sm ${member.status === 'active' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>{member.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}</button>
                       <button onClick={() => setShowPermissionModal(member)} className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><Shield size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals are updated to be responsive with fixed heights and vertical scrolling */}
      {showAddModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="bg-indigo-600 p-6 sm:p-10 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/10 shrink-0"><UserPlus size={24} sm:size={32} /></div>
                <div>
                   <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest leading-none">Associate Intake</h3>
                   <p className="text-[10px] font-bold text-indigo-100 uppercase mt-1.5 sm:mt-2 tracking-widest opacity-80">Provisioning Authorized Node</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-rose-500 rounded-full transition-all shrink-0"><X size={20} sm:size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-10 md:p-12 custom-scrollbar">
              <form onSubmit={handleAddSubmit} className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assigned Name</label>
                      <input type="text" required placeholder="Personnel Name" className="w-full px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none font-bold text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Identity Uplink (Email)</label>
                      <input type="email" required placeholder="Official Email" className="w-full px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none font-bold text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Login PIN (Password)</label>
                      <input type="password" required placeholder="••••••••" className="w-full px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none font-bold text-sm" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Comms Uplink (Mobile)</label>
                      <input type="tel" placeholder="+44" className="w-full px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none font-bold text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                   </div>
                </div>
                <div className="pt-6">
                   <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white font-black py-4 sm:py-5 rounded-2xl uppercase tracking-widest text-[11px] shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                      {isSubmitting ? <Rocket className="animate-spin" size={18} /> : <Rocket size={18} />} Provision Node
                   </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showPermissionModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-6 sm:p-10 text-white flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/10 shrink-0"><Shield size={24} sm:size={32} /></div>
                  <div>
                     <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest leading-none">Authority Matrix</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 sm:mt-2 tracking-widest opacity-80 truncate max-w-[200px] sm:max-w-none">Modifying Access for {showPermissionModal.name}</p>
                  </div>
               </div>
               <button onClick={() => setShowPermissionModal(null)} className="p-3 hover:bg-rose-500 rounded-full transition-all shrink-0"><X size={20} sm:size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 md:p-10 space-y-4 custom-scrollbar">
               {USER_PANEL_MODULES.map(mod => {
                 const isSelected = (showPermissionModal.permissions || []).includes(mod.id);
                 return (
                   <div key={mod.id} className="flex items-center justify-between p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-200 transition-all transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}><mod.icon size={18} /></div>
                        <span className="text-[10px] sm:text-xs font-black uppercase text-slate-700 tracking-widest">{mod.label}</span>
                      </div>
                      <button onClick={() => {
                        const nextPerms = isSelected ? showPermissionModal.permissions.filter((p: string) => p !== mod.id) : [...(showPermissionModal.permissions || []), mod.id];
                        updatePermissions(showPermissionModal._id, nextPerms);
                      }} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all ${isSelected ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-300'}`}>{isSelected ? <CheckSquare size={16} /> : <Square size={16} />}</button>
                   </div>
                 );
               })}
            </div>
            <div className="p-6 sm:p-10 bg-slate-50 border-t border-slate-100 shrink-0">
               <button onClick={() => setShowPermissionModal(null)} className="w-full bg-slate-900 text-white font-black py-4 sm:py-5 rounded-2xl uppercase tracking-widest text-[11px] shadow-xl hover:bg-indigo-600 transition-all">Synchronize Authorization</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
