
import React, { useState, useMemo } from 'react';
import { 
  Building2, Search, Filter, ShieldAlert, Eye, 
  Trash2, Lock, Unlock, Zap, Building, ArrowUpRight,
  TrendingUp, Activity, BarChart3, Globe, ShieldCheck
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useCurrency } from '../../context/CurrencyContext.tsx';

export const ShopManagement: React.FC = () => {
  const { currency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>(db.users.getAll());

  const shops = useMemo(() => {
    return users.filter(u => u.role === 'USER').map(shop => {
      // Aggregate stats for each shop from global DB
      const allSales = db.sales.getAll();
      const shopSales = allSales.filter(s => s.customer === shop.name); // Mock linkage
      const totalRev = shopSales.reduce((acc, s) => acc + s.total, 0);
      const plan = db.plans.getById(shop.planId || 'starter');
      
      return {
        ...shop,
        totalRevenue: totalRev || Math.floor(Math.random() * 5000), // Random for demo if no real sales
        planName: plan.name,
        lastActive: '2 hours ago'
      };
    });
  }, [users]);

  const filteredShops = useMemo(() => {
    return shops.filter(s => 
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [shops, searchTerm]);

  const toggleShopStatus = (shopId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'expired' : 'active';
    db.users.update(shopId, { status: nextStatus });
    setUsers(db.users.getAll());
    
    db.audit.log({
      actionType: 'Shop Status Mutated',
      resource: 'Shops',
      details: `Transitioned node ${shopId} to ${nextStatus.toUpperCase()}`
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-white/5 text-indigo-400 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10">
              <Building2 size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Shop Ecosystem</h2>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Platform Business Node Scrutiny</p>
           </div>
        </div>
        <div className="relative w-full md:w-96">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
           <input 
             type="text" 
             placeholder="Query shop identity or email..." 
             className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-bold text-white transition-all shadow-sm"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-2">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Business Units</p>
           <h4 className="text-3xl font-black text-white">{shops.filter(s => s.status === 'active').length}</h4>
           <div className="flex items-center gap-2 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400 uppercase">Nodes Operational</span>
           </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-2">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Premium Deployments</p>
           <h4 className="text-3xl font-black text-white">{shops.filter(s => s.planId && s.planId !== 'starter').length}</h4>
           <div className="flex items-center gap-2 mt-2">
              <Zap size={12} className="text-amber-400" />
              <span className="text-[9px] font-bold text-amber-400 uppercase">Paid Subscriptions</span>
           </div>
        </div>
        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 flex flex-col gap-2">
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ecosystem Revenue</p>
           <h4 className="text-3xl font-black text-white">{currency.symbol}{shops.reduce((a,b) => a+b.totalRevenue, 0).toLocaleString()}</h4>
           <div className="flex items-center gap-2 mt-2">
              <TrendingUp size={12} className="text-blue-400" />
              <span className="text-[9px] font-bold text-blue-400 uppercase">Aggregated Flow</span>
           </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
               <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-white/5">
                  <tr>
                     <th className="px-10 py-6">Business Identity</th>
                     <th className="px-10 py-6">Plan Status</th>
                     <th className="px-10 py-6 text-center">Node Health</th>
                     <th className="px-10 py-6 text-right">Revenue Yield</th>
                     <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {filteredShops.map(shop => (
                    <tr key={shop.id} className="hover:bg-white/5 transition-all group">
                       <td className="px-10 py-7">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                <Building size={20} />
                             </div>
                             <div>
                                <p className="font-black text-white text-sm uppercase tracking-tight">{shop.name}</p>
                                <p className="text-[10px] text-slate-500 font-bold mt-1 lowercase italic">{shop.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-7">
                          <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-indigo-400 border border-white/10 uppercase tracking-widest">
                             {shop.planName} Tier
                          </span>
                       </td>
                       <td className="px-10 py-7 text-center">
                          <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-2 transition-all ${
                            shop.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                             <div className={`w-1.5 h-1.5 rounded-full ${shop.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                             {shop.status}
                          </span>
                       </td>
                       <td className="px-10 py-7 text-right">
                          <p className="text-base font-black text-white tracking-tighter">{currency.symbol}{shop.totalRevenue.toLocaleString()}</p>
                          <p className="text-[8px] text-slate-500 uppercase font-black">All-Time LTV</p>
                       </td>
                       <td className="px-10 py-7 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-30 group-hover:opacity-100 transition-all">
                             <button 
                               onClick={() => toggleShopStatus(shop.id, shop.status)}
                               className={`p-2.5 rounded-xl border border-white/5 transition-all shadow-sm ${shop.status === 'active' ? 'hover:bg-rose-600' : 'hover:bg-emerald-600'}`}
                               title={shop.status === 'active' ? 'Disable Business Node' : 'Authorize Business Node'}
                             >
                                {shop.status === 'active' ? <Lock size={18} /> : <Unlock size={18} />}
                             </button>
                             <button className="p-2.5 bg-white/5 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-xl border border-white/5 transition-all shadow-sm">
                                <Eye size={18} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      <div className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] flex items-start gap-6 opacity-60">
         <ShieldCheck className="text-indigo-400 mt-1 shrink-0" size={24} />
         <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-widest">
            Disabling a business node terminates all active staff sessions and restricts warehouse access for the tenant. Forensic audit records remain preserved in the cold storage ledger.
         </p>
      </div>
    </div>
  );
};
