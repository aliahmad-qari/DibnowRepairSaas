
import React, { useState, useEffect } from 'react';
import { Rocket, Plus, Edit2, Trash2, CheckCircle2, ShieldCheck, Users, Zap, DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';
import { db } from '../../api/db.ts';

export const GlobalPlans: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [tenantUsage, setTenantUsage] = useState<Record<string, number>>({});

  useEffect(() => {
    setPlans(db.plans.getAll());
    // Aggregating actual usage
    const users = db.users.getAll();
    const usageMap: Record<string, number> = {};
    users.forEach(u => {
      const pid = u.planId || 'starter';
      usageMap[pid] = (usageMap[pid] || 0) + 1;
    });
    setTenantUsage(usageMap);
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tight">Tier Architecture</h2>
           <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Manage Global SaaS Monetization Nodes</p>
        </div>
        <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-700 transition-all text-[10px] uppercase tracking-widest">
          <Plus size={18} /> Deploy New Protocol Tier
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {plans.map(plan => (
           <div key={plan.id} className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:border-indigo-500/50 transition-all border-b-8" style={{ borderBottomColor: plan.price > 5 ? '#f59e0b' : plan.price > 0 ? '#6366f1' : '#64748b' }}>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                       <Rocket size={24} className="text-indigo-400" />
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-black text-slate-500 uppercase">Monthly Yield</p>
                       <h4 className="text-xl font-black text-white">£{plan.price}</h4>
                    </div>
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">{plan.name}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Tenant Capacity: {tenantUsage[plan.id] || 0} Nodes</p>
                 </div>
              </div>
              <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
                 <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase">
                    <span>Repairs Node</span>
                    <span className="text-white">{plan.limits.repairsPerMonth >= 999 ? '∞' : plan.limits.repairsPerMonth}</span>
                 </div>
                 <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase">
                    <span>Inventory Node</span>
                    <span className="text-white">{plan.limits.inventoryItems >= 999 ? '∞' : plan.limits.inventoryItems}</span>
                 </div>
                 <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase">
                    <span>AI Logic</span>
                    <span className={plan.limits.aiDiagnostics ? 'text-emerald-400' : 'text-rose-400'}>{plan.limits.aiDiagnostics ? 'ENABLED' : 'LOCKED'}</span>
                 </div>
              </div>
              <div className="mt-8 flex gap-2">
                 <button className="flex-1 py-3 bg-white/5 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-xl text-[9px] font-black uppercase transition-all">Edit Logic</button>
                 <button className="p-3 bg-white/5 hover:bg-rose-600 text-slate-400 hover:text-white rounded-xl transition-all"><Trash2 size={14}/></button>
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Zap size={150} className="text-indigo-400" /></div>
         <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl"><TrendingUp size={24} className="text-white" /></div>
               <h3 className="text-2xl font-black uppercase tracking-tighter">Monetization Integrity</h3>
            </div>
            <p className="text-slate-400 text-sm font-medium max-w-xl leading-relaxed uppercase tracking-tighter">
               Changing plan logic propagates to all tenants within 60 seconds. Active subscriptions will maintain their current rate until the next cycle handshake.
            </p>
         </div>
         <div className="flex items-center gap-4 px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] shrink-0 relative z-10 backdrop-blur-md">
            <ShieldCheck size={24} className="text-emerald-500" />
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Handshake Status</p>
               <p className="text-sm font-black text-white">AUTHORIZED</p>
            </div>
         </div>
      </div>
    </div>
  );
};
