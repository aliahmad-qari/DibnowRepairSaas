import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
// Add missing icons: Users, Zap, Wallet, Receipt
import { 
  User, ShieldCheck, Mail, Globe, BadgeCheck, 
  MapPin, Phone, Settings, LogOut, Camera,
  Shield, Key, Bell, CreditCard, ChevronRight,
  Fingerprint, Smartphone, Activity, Info, Users, Zap, Wallet, Receipt, Wrench
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { db } from '../../api/db.ts';

export const ProfilePage: React.FC = () => {
  // Add navigate initialization
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { currency } = useCurrency();
  const [activeTab, setActiveTab] = useState('identity');

  const accountStats = useMemo(() => {
    const repairs = db.repairs.getAll().length;
    const team = db.userTeamV2.getByOwner(user?.id || '').length;
    return { repairs, team };
  }, [user]);

  const handleLogout = () => {
    if (window.confirm("Authorize Identity Revocation? Protocol will terminate all active session nodes.")) {
      logout();
    }
  };

  const menuItems = [
    { id: 'identity', label: 'Identity Node', icon: User },
    { id: 'security', label: 'Protocol Security', icon: Shield },
    { id: 'billing', label: 'Settlement Hub', icon: CreditCard },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Header Profile Card */}
      <div className="bg-slate-900 rounded-[4rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12 scale-150"><Globe size={300} /></div>
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="relative group cursor-pointer">
               <div className="w-40 h-40 rounded-[3.5rem] bg-white/10 border-4 border-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden transition-all group-hover:scale-105 duration-500">
                  {user?.avatar ? (
                    <img src={user.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <User size={80} className="text-white/20" />
                  )}
               </div>
               <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center border-4 border-slate-900 shadow-xl">
                  <Camera size={20} />
               </div>
            </div>
            <div className="text-center md:text-left space-y-4 flex-1">
               <div>
                  <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                     <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{user?.name}</h2>
                     <BadgeCheck size={32} className="text-blue-400" />
                  </div>
                  <p className="text-indigo-300 font-bold uppercase tracking-[0.4em] text-[11px]">{user?.subRole || user?.role} Node Protocol</p>
               </div>
               <div className="flex flex-wrap justify-center md:justify-start gap-6 pt-4">
                  <div className="flex items-center gap-2 px-5 py-2 bg-white/5 rounded-2xl border border-white/10">
                     <Wrench size={14} className="text-indigo-400" />
                     <span className="text-[11px] font-black uppercase">{accountStats.repairs} Repairs Logged</span>
                  </div>
                  <div className="flex items-center gap-2 px-5 py-2 bg-white/5 rounded-2xl border border-white/10">
                     <Users size={14} className="text-indigo-400" />
                     <span className="text-[11px] font-black uppercase">{accountStats.team} Associates</span>
                  </div>
               </div>
            </div>
            <button onClick={handleLogout} className="px-10 py-5 bg-rose-600 hover:bg-rose-700 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] shadow-2xl transition-all active:scale-95 flex items-center gap-2 shrink-0">
               <LogOut size={18} /> Revoke Identity
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Navigation Column */}
        <div className="lg:col-span-4 space-y-4">
           {menuItems.map(item => (
             <button 
               key={item.id} 
               onClick={() => setActiveTab(item.id)}
               className={`w-full p-8 rounded-[2.5rem] border transition-all flex items-center justify-between group ${activeTab === item.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-indigo-100'}`}
             >
                <div className="flex items-center gap-5">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner ${activeTab === item.id ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                      <item.icon size={22} />
                   </div>
                   <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                </div>
                <ChevronRight size={18} className={activeTab === item.id ? 'text-white' : 'text-slate-300'} />
             </button>
           ))}

           <div className="bg-indigo-50 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-3">
                 <ShieldCheck size={20} className="text-indigo-600" />
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-900">Security Snapshot</h4>
              </div>
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-[10px] font-bold text-indigo-400 uppercase">
                    <span>Account Tier</span>
                    <span className="text-indigo-900">Enterprise</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] font-bold text-indigo-400 uppercase">
                    <span>2FA Node</span>
                    <span className="text-emerald-600">Active</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Content Column */}
        <div className="lg:col-span-8 bg-white rounded-[4rem] border border-slate-100 shadow-sm p-10 md:p-12">
           {activeTab === 'identity' && (
             <div className="space-y-12 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-8">
                   <h3 className="text-xl font-black uppercase tracking-widest text-slate-800 flex items-center gap-3">
                      <BadgeCheck size={24} className="text-indigo-600" /> Identity Registration
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Entity Name</label>
                         <input type="text" defaultValue={user?.name} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Authorized communication Node</label>
                         <input type="email" defaultValue={user?.email} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Geographic Node</label>
                         <div className="relative">
                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input type="text" defaultValue="Multan, Pakistan" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Communication Channel</label>
                         <div className="relative">
                            <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input type="tel" defaultValue="+92 300 0000000" className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500" />
                         </div>
                      </div>
                   </div>
                </div>
                
                <div className="pt-8 border-t border-slate-100 flex justify-end">
                   <button className="px-10 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Synchronize Nodes</button>
                </div>
             </div>
           )}

           {activeTab === 'security' && (
             <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-600">
                         <Fingerprint size={24} />
                      </div>
                      <div>
                         <h4 className="text-sm font-black uppercase tracking-widest">Two-Factor Authentication</h4>
                         <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">Multi-Node Identity Verification</p>
                      </div>
                   </div>
                   <div className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-600 uppercase">Protection Active</span>
                      <button className="w-14 h-7 bg-indigo-600 rounded-full relative">
                         <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full shadow-lg" />
                      </button>
                   </div>
                </div>

                <div className="p-8 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center"><Key size={32} /></div>
                   <h4 className="text-sm font-black uppercase tracking-widest">System PIN Update</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter max-w-sm">Rotation of authentication credentials ensures node integrity. Last updated 14 days ago.</p>
                   <button className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Rotate Protocol PIN</button>
                </div>
             </div>
           )}

           {activeTab === 'billing' && (
             <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                <div className="bg-indigo-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                   <div className="absolute top-0 right-0 p-8 opacity-10"><CreditCard size={150} /></div>
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Primary Settlement Node</p>
                   <h4 className="text-2xl font-black tracking-tight font-mono mb-8">•••• •••• •••• 4992</h4>
                   <div className="flex items-center justify-between pt-6 border-t border-white/10">
                      <div>
                         <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Expiration</p>
                         <p className="text-xs font-black">12/28</p>
                      </div>
                      <div className="w-12 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/20 backdrop-blur-md">
                         <Zap size={16} className="text-indigo-400" />
                      </div>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button onClick={() => navigate('/user/wallet')} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between hover:bg-indigo-50 transition-all group">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform"><Wallet size={18}/></div>
                         <span className="text-[10px] font-black uppercase tracking-widest">Refill Treasury</span>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                   </button>
                   <button onClick={() => navigate('/user/invoices')} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-between hover:bg-indigo-50 transition-all group">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform"><Receipt size={18}/></div>
                         <span className="text-[10px] font-black uppercase tracking-widest">View Archives</span>
                      </div>
                      <ChevronRight size={16} className="text-slate-300" />
                   </button>
                </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

const Wrench = ({size, className}:any) => <Activity size={size} className={className} />;