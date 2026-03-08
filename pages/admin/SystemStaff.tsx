
import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, X, Mail, Phone, Lock, Unlock, 
  ShieldCheck, ShieldAlert, Settings2, CheckSquare, Square, MoreHorizontal, Terminal,
  LayoutDashboard, Wrench, Package, ShoppingCart, Rocket, ClipboardList, Wallet, Coins, LifeBuoy, MessageSquare, Settings
} from 'lucide-react';
import { db } from '../../api/db';

// Define the comprehensive list of admin panel modules/files for access control
const ADMIN_PANEL_MODULES = [
  { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'User Registry', icon: Users },
  { id: 'staff', label: 'Infrastructure Staff', icon: ShieldCheck },
  { id: 'all-repairs', label: 'Global Repair Logs', icon: Wrench },
  { id: 'all-inventory', label: 'Global Stock Ledger', icon: Package },
  { id: 'all-sales', label: 'Platform Sales Feed', icon: ShoppingCart },
  { id: 'plans', label: 'Pricing Plan Architect', icon: Rocket },
  { id: 'plan-requests', label: 'Upgrade Audit Queue', icon: ClipboardList },
  { id: 'wallet', label: 'Platform Treasury', icon: Wallet },
  { id: 'currencies', label: 'Geo-Currency Rules', icon: Coins },
  { id: 'tickets', label: 'Global Support Desk', icon: LifeBuoy },
  { id: 'complaints', label: 'Complaints Monitoring', icon: MessageSquare },
  { id: 'settings', label: 'System Configurations', icon: Settings },
];

export const SystemStaff: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'Platform Auditor', status: 'active', department: 'Compliance'
  });

  useEffect(() => {
    const loadData = () => {
      setMembers(db.adminTeamV2.getAll());
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const initialPermissions: any = {};
    ADMIN_PANEL_MODULES.forEach(mod => {
      initialPermissions[mod.id] = { read: true, create: false };
    });

    db.adminTeamV2.add({ 
      ...formData, 
      ownerId: 'system', 
      permissions: initialPermissions
    });
    setShowAddModal(false);
    setFormData({ name: '', email: '', password: '', role: 'Platform Auditor', status: 'active', department: 'Compliance' });
  };

  const updatePermissions = (memberId: string, moduleId: string, action: string) => {
    const all = db.adminTeamV2.getAll();
    const member = all.find(m => m.id === memberId);
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

    // Updating local DB state and forcing storage sync
    const updatedAll = all.map(m => m.id === memberId ? { ...m, permissions: newPerms } : m);
    localStorage.setItem('fixit_admin_team_v2', JSON.stringify(updatedAll));
    window.dispatchEvent(new Event('storage'));
    setShowPermissionModal({ ...member, permissions: newPerms });
    setMembers(updatedAll);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Infrastructure Staff</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Platform Administrative Personnel Control</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl hover:scale-105 transition-all text-[11px] uppercase tracking-widest"
        >
          <ShieldPlus size={18} /> Provision Admin Staff
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-10 py-6">Staff Entity</th>
                <th className="px-10 py-6">Audit Email</th>
                <th className="px-10 py-6">Authority Level</th>
                <th className="px-10 py-6">Unit</th>
                <th className="px-10 py-6 text-center">Status</th>
                <th className="px-10 py-6 text-center">Protocol Matrix</th>
                <th className="px-10 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg">
                          {member.name.charAt(0)}
                       </div>
                       <span className="font-black text-slate-800 text-sm tracking-tight">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-xs font-bold text-slate-400 uppercase">{member.email}</td>
                  <td className="px-10 py-7">
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-indigo-100">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-10 py-7 text-[10px] font-black text-slate-500 uppercase tracking-widest">{member.department}</td>
                  <td className="px-10 py-7 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-2 border ${member.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${member.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {member.status}
                    </span>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <button onClick={() => setShowPermissionModal(member)} className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all">
                      Access Map
                    </button>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <button className="text-slate-300 hover:text-indigo-600 transition-colors p-2"><MoreHorizontal size={20}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-8 text-white flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                   <ShieldAlert size={24} />
                 </div>
                 <div>
                   <h3 className="text-xl font-black uppercase tracking-widest">Enroll Admin Associate</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 tracking-tighter opacity-80">Platform-level staff provisioning protocol</p>
                 </div>
               </div>
               <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-all"><X size={24} /></button>
            </div>
            
            <div className="p-10 overflow-y-auto custom-scrollbar flex-1">
              <form onSubmit={handleAddSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Staff Name *</label>
                    <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Official Name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Staff Email *</label>
                    <input required type="email" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="admin@dibnow.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Access PIN *</label>
                    <input required type="password" placeholder="••••••••" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Role Architecture *</label>
                    <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                      <option>Platform Auditor</option>
                      <option>Support Architect</option>
                      <option>Treasury Manager</option>
                      <option>Infrastructure Lead</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-black transition-all uppercase tracking-[0.2em] text-[11px]">Authorize System Associate</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Admin Permission Matrix - SHOWING ALL ADMIN FILES/SECTIONS */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in zoom-in-95 duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-indigo-600 p-6 md:p-8 text-white flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/10">
                       <Terminal size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-widest leading-none">Admin Authority Matrix</h3>
                      <p className="text-[10px] font-bold text-indigo-100 uppercase mt-1.5 tracking-tighter opacity-80">Infrastructure Permissions for {showPermissionModal.name}</p>
                    </div>
                 </div>
                 <button onClick={() => setShowPermissionModal(null)} className="p-2 hover:bg-rose-500 rounded-full transition-all"><X size={24}/></button>
              </div>

              <div className="p-5 md:p-8 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                 <div className="grid grid-cols-1 gap-3">
                   {ADMIN_PANEL_MODULES.map(mod => {
                     const modPerms = showPermissionModal.permissions?.[mod.id] || { read: false, create: false };
                     return (
                      <div key={mod.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-slate-50 rounded-2xl border border-slate-100 group gap-4">
                         <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                              <mod.icon size={20} className="text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] md:text-[11px] font-black uppercase text-slate-700 tracking-widest block">{mod.label}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter italic">{mod.id}.tsx node access</span>
                            </div>
                         </div>
                         <div className="flex gap-2 sm:gap-4">
                            <button 
                              onClick={() => updatePermissions(showPermissionModal.id, mod.id, 'read')}
                              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${modPerms.read ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
                            >
                               {modPerms.read ? <CheckSquare size={14}/> : <Square size={14}/>}
                               Read
                            </button>
                            <button 
                              onClick={() => updatePermissions(showPermissionModal.id, mod.id, 'create')}
                              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 md:px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${modPerms.create ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
                            >
                               {modPerms.create ? <CheckSquare size={14}/> : <Square size={14}/>}
                               Write
                            </button>
                         </div>
                      </div>
                     );
                   })}
                 </div>
              </div>
              <div className="pt-6 md:pt-8 bg-slate-50 border-t border-slate-100 p-5 md:p-8 shrink-0">
                  <button onClick={() => setShowPermissionModal(null)} className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl md:rounded-2xl uppercase tracking-widest text-[10px] md:text-[11px] shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98]">Authorize Protocol Map</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const ShieldPlus = ({size}:any) => <ShieldAlert size={size} />;
