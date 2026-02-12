
import React, { useMemo } from 'react';
import { 
  Users, Building2, TrendingUp, CreditCard, Activity, 
  ShieldCheck, Server, Database, Zap, Globe, 
  Lock, RefreshCw, BarChart3, ArrowUpRight
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, ComposedChart, Bar, Line, Legend 
} from 'recharts';

export const SuperAdminDashboard: React.FC = () => {
  const { currency } = useCurrency();

  const stats = useMemo(() => {
    const users = db.users.getAll();
    const shops = users.filter(u => u.role === 'USER');
    const transactions = db.wallet.getTransactions();
    const activeSubscribers = users.filter(u => u.status === 'active' && u.planId && u.planId !== 'starter');
    const totalRev = transactions.reduce((acc, t) => acc + (t.type === 'credit' && t.status === 'success' ? t.amount : 0), 0);

    const chartData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        name: d.toLocaleString('default', { month: 'short' }),
        revenue: Math.floor(Math.random() * 5000) + 2000,
        signups: Math.floor(Math.random() * 50) + 10,
      };
    });

    return {
      totalUsers: users.length,
      totalShops: shops.length,
      totalRevenue: totalRev,
      activeSubs: activeSubscribers.length,
      chartData
    };
  }, []);

  const MetricCard = ({ label, value, icon: Icon, color, sub }: any) => (
    <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><Icon size={120} /></div>
       <div className="relative z-10 flex flex-col gap-6">
          <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-2xl`}>
             <Icon size={28} className="text-white" />
          </div>
          <div>
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
             <h4 className="text-3xl font-black text-white tracking-tighter">{value}</h4>
             <p className="text-[9px] font-bold text-indigo-400 mt-2 uppercase">{sub}</p>
          </div>
       </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Root Dashboard</h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
               <ShieldCheck size={14} className="text-indigo-500" /> Platform-Wide Authority Node Active
            </p>
         </div>
         <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Sync Status: Nominal</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <MetricCard label="Global Users" value={stats.totalUsers} icon={Users} color="bg-blue-600" sub="All Platform Identities" />
         <MetricCard label="Active Shops" value={stats.totalShops} icon={Building2} color="bg-emerald-600" sub="Revenue-Producing Nodes" />
         <MetricCard label="Global Revenue" value={`${currency.symbol}${stats.totalRevenue.toLocaleString()}`} icon={TrendingUp} color="bg-indigo-600" sub="Aggregated Capital Flow" />
         <MetricCard label="Active Tiers" value={stats.activeSubs} icon={Zap} color="bg-rose-600" sub="Premium/Gold Deployments" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-slate-900/50 border border-white/5 rounded-[3rem] p-10 flex flex-col">
            <div className="flex items-center justify-between mb-12">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10"><BarChart3 size={24} className="text-indigo-400"/></div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Ecosystem Flux</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Growth & Revenue Scrutiny</p>
                  </div>
               </div>
            </div>
            <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                     <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900}} />
                     <YAxis hide />
                     <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                     <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fill="url(#colorRev)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="lg:col-span-4 space-y-6">
            <div className="bg-indigo-600 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000 rotate-12"><Globe size={150} /></div>
               <div className="relative z-10">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] mb-2 text-indigo-200">System Pulse</h4>
                  <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">Infrastructure Status</h3>
                  
                  <div className="mt-10 space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Server size={18} className="text-indigo-200"/><span className="text-[10px] font-black uppercase">Main API Cluster</span></div>
                        <div className="bg-white/20 px-3 py-1 rounded-lg text-[9px] font-black">STABLE</div>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Database size={18} className="text-indigo-200"/><span className="text-[10px] font-black uppercase">Shard Distribution</span></div>
                        <div className="bg-white/20 px-3 py-1 rounded-lg text-[9px] font-black">99.9%</div>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Lock size={18} className="text-indigo-200"/><span className="text-[10px] font-black uppercase">Security Node</span></div>
                        <div className="bg-white/20 px-3 py-1 rounded-lg text-[9px] font-black">ACTIVE</div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 md:p-10 flex flex-col justify-center items-center text-center">
               <RefreshCw className="text-indigo-500 mb-4 animate-spin-slow" size={32} />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Automated Garbage Collection</p>
               <h4 className="text-lg font-black text-white uppercase mt-2">Next Cycle in 14m</h4>
            </div>
         </div>
      </div>
    </div>
  );
};
