
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, Mail, Phone, MoreHorizontal, ShieldCheck, 
  AlertCircle, X, Shield, Trash2, Lock, Unlock, Eye, 
  Settings2, Briefcase, CheckSquare, Square,
  Package, Wrench, ShoppingCart, Landmark, LayoutDashboard, Rocket, Boxes, History, Layers, Tag, Globe, LifeBuoy, MessageSquare, ShieldHalf
} from 'lucide-react';
import { db } from '../../api/db';
import { useAuth } from '../../context/AuthContext';

// Define the comprehensive list of user panel modules/files for access control
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
  { id: 'advanced-team', label: 'Advanced Team Control', icon: ShieldHalf },
  { id: 'team', label: 'Standard Team Roster', icon: Users },
  { id: 'wallet', label: 'Financial Wallet', icon: Landmark },
  { id: 'utilities', label: 'Utility Console', icon: Globe },
  { id: 'tickets', label: 'Support Desk', icon: LifeBuoy },
  { id: 'complaints', label: 'Complaints Center', icon: MessageSquare },
];

export const TeamMembers: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState<any>(null);
  const [isAtLimit, setIsAtLimit] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'Technician',
    department: 'General',
    status: 'active'
  });

  useEffect(() => {
    const loadData = () => {
      if (user) {
        const v2Members = db.userTeamV2.getByOwner(user.id);
        setMembers(v2Members);
        const plan = db.plans.getById(user.planId || 'starter');
        setActivePlan(plan);
        setIsAtLimit(v2Members.length >= plan.limits.teamMembers);
      }
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [user]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isAtLimit) return;

    // Initialize with default permissions for all modules
    const initialPermissions: any = {};
    USER_PANEL_MODULES.forEach(mod => {
      initialPermissions[mod.id] = { read: true, create: false };
    });

    db.userTeamV2.add({
      ...formData,
      ownerId: user.id,
      permissions: initialPermissions
    });

    setShowAddModal(false);
    setFormData({ name: '', email: '', phone: '', password: '', role: 'Technician', department: 'General', status: 'active' });
  };

  const toggleMemberStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'disabled' : 'active';
    db.userTeamV2.update(id, { status: nextStatus });
  };

  const updatePermissions = (memberId: string, moduleId: string, action: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    
    const currentPerms = member.permissions || {};
    const modulePerms = currentPerms[moduleId] || { read: false, create: false };
    
    const newPerms = {
      ...currentPerms,
      [moduleId]: {
        ...modulePerms,
        [action]: !modulePerms[action]
      }
    };
    
    db.userTeamV2.update(memberId, { permissions: newPerms });
    setShowPermissionModal({ ...member, permissions: newPerms });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">Advanced Team Matrix</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Authorized Personnel Registry & RBAC Node</p>
        </div>
        <button 
          onClick={() => isAtLimit ? navigate('/user/pricing') : setShowAddModal(true)}
          className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all text-[11px] uppercase tracking-widest ${isAtLimit ? "bg-slate-800 text-slate-400" : "bg-indigo-600 text-white hover:scale-105"}`}
        >
          <UserPlus size={18} /> Provision V2 Associate
        </button>
      </div>

      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-6 md:px-10 py-6">Name</th>
                <th className="px-6 md:px-10 py-6">Email</th>
                <th className="px-6 md:px-10 py-6">Phone</th>
                <th className="px-6 md:px-10 py-6">Role</th>
                <th className="px-6 md:px-10 py-6">Department</th>
                <th className="px-6 md:px-10 py-6 text-center">Status</th>
                <th className="px-6 md:px-10 py-6 text-center">Permissions</th>
                <th className="px-6 md:px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-6 md:px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                        {member.name.charAt(0)}
                      </div>
                      <span className="font-black text-slate-800 text-sm whitespace-nowrap">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-6 md:px-10 py-7 text-xs font-bold text-slate-500 uppercase">{member.email}</td>
                  <td className="px-6 md:px-10 py-7 text-xs font-bold text-slate-400 whitespace-nowrap">{member.phone || 'N/A'}</td>
                  <td className="px-6 md:px-10 py-7">
                    <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100 whitespace-nowrap">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 md:px-10 py-7 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{member.department}</td>
                  <td className="px-6 md:px-10 py-7 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-2 border whitespace-nowrap ${member.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {member.status === 'active' ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 md:px-10 py-7 text-center">
                    <button onClick={() => setShowPermissionModal(member)} className="bg-cyan-50 text-cyan-600 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-cyan-100 hover:bg-cyan-600 hover:text-white transition-all whitespace-nowrap">
                      Grant Access
                    </button>
                  </td>
                  <td className="px-6 md:px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => toggleMemberStatus(member.id, member.status)}
                        className={`p-2.5 rounded-xl transition-all shadow-sm ${member.status === 'active' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}
                      >
                        {member.status === 'active' ? <Lock size={16}/> : <Unlock size={16}/>}
                      </button>
                      <button onClick={() => setShowPermissionModal(member)} className="bg-rose-600 text-white p-2.5 rounded-xl shadow-lg shadow-rose-100 hover:bg-rose-700 transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-4 whitespace-nowrap">
                        Permissions
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-indigo-600 p-6 md:p-8 text-white flex items-center justify-between shrink-0">
               <div className="flex items-center gap-4">
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/20">
                   <UserPlus size={20} />
                 </div>
                 <div>
                   <h3 className="text-lg md:text-xl font-black uppercase tracking-widest leading-none">Add Team Member</h3>
                   <p className="text-[9px] md:text-[10px] font-bold text-indigo-100 uppercase mt-1.5 tracking-tighter opacity-80">Create a new team member account with role-based access</p>
                 </div>
               </div>
               <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-all"><X size={20} /></button>
            </div>
            
            <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleAddSubmit} className="space-y-6 md:space-y-8">
                <div className="bg-slate-50 p-5 rounded-2xl md:rounded-3xl border border-slate-100">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Plan Entitlement</label>
                  <p className="text-xs md:text-sm font-bold text-slate-700">{activePlan?.name} – You can add up to {activePlan?.limits.teamMembers} team members</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name *</label>
                    <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Legal Name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address *</label>
                    <input required type="email" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Login Identifier" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Access PIN (Password) *</label>
                    <input required type="password" placeholder="••••••••" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Number</label>
                    <input type="tel" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+44 ..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Team Role *</label>
                    <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl outline-none font-bold text-sm appearance-none cursor-pointer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                      <option>Technician</option>
                      <option>Sales Associate</option>
                      <option>Manager</option>
                      <option>Inventory Control</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Department</label>
                    <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl md:rounded-2xl outline-none font-bold text-sm appearance-none cursor-pointer" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                      <option>General</option>
                      <option>Technical</option>
                      <option>Sales</option>
                      <option>Management</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 pb-2">
                  <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-[1.2rem] md:rounded-[1.5rem] shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-[0.2em] text-[10px] md:text-[11px] active:scale-95">Deploy Associate Node</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Permission Modal - DYNAMICALLY SHOWING ALL PANEL FILES/MODULES */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in zoom-in-95 duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-slate-900 p-6 md:p-8 text-white flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                       <Settings2 size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg md:text-xl font-black uppercase tracking-widest leading-none truncate">User Panel Access Matrix</h3>
                      <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mt-1.5 tracking-tighter opacity-80 truncate">Configuring Authority for {showPermissionModal.name}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowPermissionModal(null)} className="p-2 hover:bg-rose-500 rounded-full transition-all shrink-0"><X size={20}/></button>
              </div>

              <div className="p-5 md:p-8 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                 <div className="grid grid-cols-1 gap-3">
                    {USER_PANEL_MODULES.map(mod => {
                      const modPerms = showPermissionModal.permissions?.[mod.id] || { read: false, create: false };
                      return (
                        <div key={mod.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all gap-4">
                          <div className="flex items-center gap-3 md:gap-4">
                              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                <mod.icon size={18} className="text-indigo-600" />
                              </div>
                              <div className="min-w-0">
                                <span className="text-[10px] md:text-[11px] font-black uppercase text-slate-700 tracking-widest block">{mod.label}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Module ID: {mod.id}</span>
                              </div>
                          </div>
                          <div className="flex gap-2 sm:gap-4">
                              <button 
                                onClick={() => updatePermissions(showPermissionModal.id, mod.id, 'read')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${modPerms.read ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                              >
                                {modPerms.read ? <CheckSquare size={14}/> : <Square size={14}/>}
                                Read
                              </button>
                              <button 
                                onClick={() => updatePermissions(showPermissionModal.id, mod.id, 'create')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${modPerms.create ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                              >
                                {modPerms.create ? <CheckSquare size={14}/> : <Square size={14}/>}
                                Create
                              </button>
                          </div>
                        </div>
                      );
                    })}
                 </div>
              </div>
              
              <div className="pt-6 md:pt-8 bg-slate-50 border-t border-slate-100 p-5 md:p-8 shrink-0">
                  <button onClick={() => setShowPermissionModal(null)} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl md:rounded-2xl uppercase tracking-widest text-[10px] md:text-[11px] shadow-xl hover:bg-slate-800 transition-all active:scale-[0.98]">Commit Access Changes</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
