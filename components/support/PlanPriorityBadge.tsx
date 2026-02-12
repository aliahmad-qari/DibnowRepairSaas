
import React from 'react';
import { Zap, Info, ShieldCheck, Crown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export const PlanPriorityBadge: React.FC = () => {
  const { user } = useAuth();
  
  const isPremium = user?.planId === 'premium' || user?.planId === 'gold';
  
  if (isPremium) {
    return (
      <div className="bg-amber-400 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-200/50 animate-in fade-in zoom-in duration-500 border border-amber-300">
        <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
          <Crown size={14} fill="white" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Priority Support</span>
          <span className="text-[7px] font-bold uppercase opacity-80 mt-0.5 tracking-tighter">Fast-Track Node Active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl flex items-center gap-2 border border-slate-200">
      <Info size={14} className="text-slate-400" />
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Standard Response</span>
        <span className="text-[7px] font-bold uppercase opacity-60 mt-0.5 tracking-tighter">4-8 Hour Handshake SLA</span>
      </div>
    </div>
  );
};
