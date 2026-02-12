
import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Filter, ShieldAlert, Eye, 
  Trash2, Lock, Unlock, Zap, MoreVertical,
  ChevronDown, UserPlus, Fingerprint, RefreshCw,
  Terminal, ShieldCheck, Mail, Database, X, ArrowUpRight
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { UserRole } from '../../types.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const GlobalUserManagement: React.FC = () => {
  const { login } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>(db.users.getAll());
  const [plans] = useState<any[]>(db.plans.getAll());
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleImpersonate = (targetUser: any) => {
    if (window.confirm(`INITIALIZE PROTOCOL: Transition session to identity of ${targetUser.name}?`)) {
      // Create a clean user object for standard portal access
      const sessionUser = {
        ...targetUser,
        role: targetUser.role || UserRole.USER,
        permissions: targetUser.permissions || ['view_reports']
      };
      localStorage.setItem('fixit_user', JSON.stringify(sessionUser));
      window.location.href = '/#/user/dashboard';
      window.location.reload();
    }
  };

  const toggleStatus = (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'expired' : 'active';
    db.users.update(userId, { status: nextStatus });
    setUsers(db.users.getAll());
  };

  const updatePlan = (userId: string, planId: string) => {
    db.users.update(userId, { planId });
    setUsers(db.users.getAll());
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-white/5 text-indigo-400 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10">
              <Users size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Global User Registry</h2>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Cross-Platform Identity Scrutiny</p>
           </div>
        </div>
        <div className="relative w-full md:w-96">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
           <input 
             type="text" 
             placeholder="Search IDs, Names or Email Nodes..." 
             className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-bold text-white transition-all shadow-sm"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl border-b-8 border-b-indigo-600">
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
               <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-white/5">
                  <tr>
                     <th className="px-10 py-6">Entity Identity</th>
                     <th className="px-10 py-6">Operational Tier</th>
                     <th className="px-10 py-6 text-center">Node Status</th>
                     <th className="px-10 py-6 text-right">Ledger Balance</th>
                     <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-all group">
                       <td className="px-10 py-7">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                {u.name?.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <p className="font-black text-white text-sm uppercase tracking-tight">{u.name}</p>
                                <p className="text-[10px] text-slate-500 font-bold mt-1 lowercase italic">{u.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-7">
                          <div className="flex items-center gap-3">
                             <select 
                               value={u.planId || 'starter'}
                               onChange={e => updatePlan(u.id, e.target.value)}
                               className="bg-transparent text-[10px] font-black text-indigo-400 uppercase tracking-widest outline-none cursor-pointer hover:text-white transition-colors"
                             >
                                {plans.map(p => <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
                             </select>
                             <Zap size={14} className="text-amber-500" />
                          </div>
                       </td>
                       <td className="px-10 py-7 text-center">
                          <button 
                            onClick={() => toggleStatus(u.id, u.status)}
                            className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-2 transition-all ${
                              u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}
                          >
                             <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                             {u.status}
                          </button>
                       </td>
                       <td className="px-10 py-7 text-right">
                          <p className="text-base font-black text-white tracking-tighter">£{u.walletBalance?.toLocaleString()}</p>
                       </td>
                       <td className="px-10 py-7 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-30 group-hover:opacity-100 transition-all">
                             <button 
                               onClick={() => handleImpersonate(u)}
                               className="p-2.5 bg-white/5 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl border border-white/5 transition-all shadow-sm"
                               title="Impersonate Node"
                             >
                                <ArrowUpRight size={18} />
                             </button>
                             <button 
                               onClick={() => setSelectedUser(u)}
                               className="p-2.5 bg-white/5 hover:bg-blue-600 text-slate-300 hover:text-white rounded-xl border border-white/5 transition-all shadow-sm"
                               title="View Detailed Logs"
                             >
                                <Terminal size={18} />
                             </button>
                             <button className="p-2.5 bg-white/5 hover:bg-rose-600 text-slate-300 hover:text-white rounded-xl border border-white/5 transition-all shadow-sm">
                                <Lock size={18} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* USER DETAIL MODAL (Forensic View) */}
      {selectedUser && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
           <div className="bg-slate-900 w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/5 flex flex-col max-h-[90vh]">
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/5">
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center font-black text-2xl text-white shadow-2xl">
                       {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-white uppercase tracking-tight">{selectedUser.name}</h3>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Unique Identifier: {selectedUser.id}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedUser(null)} className="p-3 hover:bg-white/5 rounded-full text-slate-500 transition-all"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                 <div className="grid grid-cols-3 gap-6">
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                       <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Total Repairs</p>
                       <h4 className="text-3xl font-black text-white">42</h4>
                    </div>
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                       <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Team Seats</p>
                       <h4 className="text-3xl font-black text-white">8/10</h4>
                    </div>
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5">
                       <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Wallet Flux</p>
                       <h4 className="text-3xl font-black text-emerald-400">+£{selectedUser.walletBalance}</h4>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                       <Terminal size={14} /> Critical Action Registry
                    </h4>
                    <div className="bg-black/40 rounded-3xl p-6 font-mono text-[10px] text-indigo-300 space-y-3 shadow-inner h-64 overflow-y-auto custom-scrollbar">
                       <p>[2025-01-14 10:20:42] SYSTEM: Authentication handshake via Web Portal</p>
                       <p>[2025-01-14 11:45:00] NODE_AUTH: POS terminal liquidation authorized</p>
                       <p>[2025-01-13 16:30:11] FISCAL: Wallet top-up via Stripe node successful</p>
                       <p className="opacity-40 italic mt-6">// No further critical anomalies identified in current trace...</p>
                    </div>
                 </div>
              </div>

              <div className="p-10 bg-white/5 border-t border-white/5 flex gap-4">
                 <button onClick={() => handleImpersonate(selectedUser)} className="flex-1 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-[11px] shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3">
                    <ArrowUpRight size={18} /> Assume Entity Control
                 </button>
                 <button className="px-10 py-5 bg-white/5 text-slate-400 rounded-3xl font-black uppercase text-[11px] border border-white/10 hover:bg-white/10 transition-all">Reset Password</button>
              </div>
           </div>
        </div>
      )}

      <div className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] flex items-start gap-6 opacity-60">
         <ShieldCheck className="text-indigo-400 mt-1 shrink-0" size={24} />
         <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-widest">
            Cross-tenant impersonation and plan mutations are logged to the Master Cold Storage Audit Ledger. Every action here is permanent and cannot be redacted by subordinate admins.
         </p>
      </div>
    </div>
  );
};
