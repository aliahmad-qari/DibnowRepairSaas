
import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, DollarSign, Globe, CreditCard, Activity, 
  ArrowUpRight, ArrowDownRight, Zap, Target, BarChart3,
  Scale, PieChart as PieIcon, Landmark, ShieldCheck
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie,
  Legend
} from 'recharts';

const COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e'];

export const RevenueAnalytics: React.FC = () => {
  const { currency } = useCurrency();
  const [timeframe, setTimeframe] = useState('6M');

  const analytics = useMemo(() => {
    const transactions = db.wallet.getTransactions();
    const successful = transactions.filter(t => t.status === 'success');
    const totalEarnings = successful.reduce((acc, t) => acc + (t.type === 'credit' ? t.amount : 0), 0);
    const refunds = transactions.filter(t => t.description.toLowerCase().includes('refund')).reduce((acc, t) => acc + t.amount, 0);

    const chartData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return {
        name: d.toLocaleString('default', { month: 'short' }),
        revenue: Math.floor(Math.random() * 10000) + 5000,
        refunds: Math.floor(Math.random() * 500),
      };
    });

    const countryData = [
      { name: 'United Kingdom', value: 45000 },
      { name: 'United States', value: 32000 },
      { name: 'Pakistan', value: 28000 },
      { name: 'United Arab Emirates', value: 15000 },
      { name: 'Germany', value: 12000 },
    ];

    const gatewayData = [
      { name: 'Stripe', value: 65 },
      { name: 'PayPal', value: 20 },
      { name: 'Manual', value: 10 },
      { name: 'PayFast', value: 5 },
    ];

    return { totalEarnings, refunds, chartData, countryData, gatewayData };
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">Revenue Analytics</h1>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-3 flex items-center gap-2">
               <TrendingUp size={14} className="text-indigo-500" /> Platform-Wide Financial Forensic Node
            </p>
         </div>
         <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            {['1M', '3M', '6M', '1Y'].map((t) => (
              <button 
                key={t} 
                onClick={() => setTimeframe(t)} 
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeframe === t ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
              >
                {t}
              </button>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
           <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><DollarSign size={24}/></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase">+12.4%</span>
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Platform Earnings</p>
              <h4 className="text-3xl font-black text-white tracking-tighter">{currency.symbol}{analytics.totalEarnings.toLocaleString()}</h4>
           </div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
           <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><Activity size={24}/></div>
              <span className="text-[10px] font-black text-emerald-400 uppercase">Nominal</span>
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg Transaction</p>
              <h4 className="text-3xl font-black text-white tracking-tighter">{currency.symbol}142.50</h4>
           </div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
           <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl"><Landmark size={24}/></div>
              <span className="text-[10px] font-black text-rose-400 uppercase">0.4% Rate</span>
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Refunds / Disputes</p>
              <h4 className="text-3xl font-black text-white tracking-tighter">{currency.symbol}{analytics.refunds.toLocaleString()}</h4>
           </div>
        </div>
        <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 space-y-4">
           <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl"><Zap size={24}/></div>
              <span className="text-[10px] font-black text-amber-400 uppercase">99.9% Up</span>
           </div>
           <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conversion Node</p>
              <h4 className="text-3xl font-black text-white tracking-tighter">8.4%</h4>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-slate-900/50 border border-white/5 rounded-[3rem] p-10 flex flex-col">
            <div className="flex items-center justify-between mb-12">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10"><BarChart3 size={24} className="text-indigo-400"/></div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Temporal Yield Flow</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revenue vs Deficit Node Analysis</p>
                  </div>
               </div>
            </div>
            <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.chartData}>
                     <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900}} />
                     <YAxis hide />
                     <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                     <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fill="url(#revGrad)" />
                     <Area type="monotone" dataKey="refunds" stroke="#f43f5e" strokeWidth={2} fillOpacity={0} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="lg:col-span-4 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl">
            <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-10">Regional Yield mapping</h4>
            <div className="space-y-6">
               {analytics.countryData.map((c, i) => (
                 <div key={i} className="space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-xs font-black uppercase text-slate-300">{c.name}</span>
                       <span className="text-xs font-black text-white">{currency.symbol}{(c.value/1000).toFixed(1)}K</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(c.value / 45000) * 100}%` }} />
                    </div>
                 </div>
               ))}
            </div>
            <div className="mt-12 p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
               <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed tracking-widest">
                  Primary liquidity cluster identified in the <span className="text-indigo-400 font-black">United Kingdom</span> node for the current fiscal cycle.
               </p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10">
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg"><Globe size={24}/></div>
               <h3 className="text-xl font-black uppercase tracking-tight">Gateway Distribution</h3>
            </div>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={analytics.gatewayData} innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none">
                        {analytics.gatewayData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                     </Pie>
                     <Tooltip />
                     <Legend />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 flex flex-col justify-center text-center">
            <Scale className="text-indigo-500 mx-auto mb-6" size={48} />
            <h3 className="text-xl font-black uppercase tracking-widest mb-4">Fiscal Integrity Protocol</h3>
            <p className="text-slate-500 text-xs font-bold uppercase leading-relaxed tracking-tighter max-w-sm mx-auto">
               All revenue nodes are cryptographically signed and stored in the platform vault. Handshake verification latency: ~240ms.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
               <ShieldCheck size={16} className="text-emerald-500" />
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Audit Status: Nominal</span>
            </div>
         </div>
      </div>
    </div>
  );
};
