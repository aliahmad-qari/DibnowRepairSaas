
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../api/db';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldCheck, Mail, Lock, Users, AlertTriangle, ChevronRight, CheckCircle2, Bot, ArrowLeft, Loader2 } from 'lucide-react';

export const TeamPortal: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [portalType, setPortalType] = useState<'USER' | 'ADMIN'>('USER');
  const [error, setError] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsBlocked(false);
    setIsLoading(true);

    // Artificial handshake delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Database Lookup - Strictly separate collections
    const collection = portalType === 'USER' ? db.userTeamV2.getAll() : db.adminTeamV2.getAll();
    const member = collection.find(m => m.email.toLowerCase() === email.toLowerCase() && m.password === password);

    if (!member) {
      setError("Authorization Failed: Staff credentials invalid.");
      setIsLoading(false);
      return;
    }

    // STRICT ENABLE / DISABLE ENFORCEMENT
    if (member.status === 'disabled' || member.status === 'inactive') {
      setIsBlocked(true);
      setIsLoading(false);
      return;
    }

    // Identity Resolution
    const ownerName = portalType === 'USER' 
      ? (db.users.getById(member.ownerId)?.name || "Primary Shop Owner")
      : "DibNow Global Administration";

    setSuccessMsg(`Identity verified. You are authorized as staff of ${ownerName}.`);
    
    // RESET POPUP FLAG for this login session
    sessionStorage.removeItem('dibnow_staff_welcomed');
    sessionStorage.removeItem('dibnow_admin_staff_welcomed');

    setTimeout(() => {
      login(email, UserRole.TEAM_MEMBER, member.role);
      navigate(portalType === 'USER' ? '/user/dashboard' : '/admin/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Visual Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <button 
          onClick={() => navigate('/login')}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
        >
          <ArrowLeft size={16} /> Return to Master Portal
        </button>

        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl overflow-hidden">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/10">
               <Bot size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Staff Access Node</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Separate Authentication Protocol</p>
          </div>

          <div className="flex bg-white/5 p-1.5 rounded-2xl mb-8 border border-white/5">
            <button 
              onClick={() => setPortalType('USER')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${portalType === 'USER' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Shop Team
            </button>
            <button 
              onClick={() => setPortalType('ADMIN')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${portalType === 'ADMIN' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Admin Staff
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Work Identity (Email)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input required type="email" placeholder="staff@dibnow.com" className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 text-white font-bold text-sm transition-all" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest ml-1">Security PIN (Password)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input required type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-blue-500 text-white font-bold text-sm transition-all" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2">
               {isLoading ? <Loader2 size={18} className="animate-spin" /> : <>Authorize Connection <ChevronRight size={14} /></>}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-400 animate-in shake duration-300">
               <AlertTriangle size={18} />
               <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">{error}</p>
            </div>
          )}

          {successMsg && (
            <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400 animate-in zoom-in duration-300">
               <CheckCircle2 size={18} />
               <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">{successMsg}</p>
            </div>
          )}
        </div>
      </div>

      {isBlocked && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-950/95 backdrop-blur-2xl p-6 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 text-center shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-rose-100 flex flex-col items-center">
              <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center mb-8 border border-rose-100 shadow-inner">
                 <AlertTriangle size={40} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-tight">Account Restricted</h2>
              <p className="text-slate-500 text-sm font-bold mt-6 leading-relaxed">
                 Your account has been blocked. Please contact the administrator.
              </p>
              <button onClick={() => { setIsBlocked(false); navigate('/login'); }} className="mt-10 w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-all shadow-xl active:scale-95">
                 Return to Portal
              </button>
           </div>
        </div>
      )}
    </div>
  );
};
