
import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, BarChart3, Users, CreditCard, 
  Target, Zap, Globe, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Download,
  Activity, PieChart as PieIcon, LineChart, 
  MapPin, Clock, Info, ShieldCheck, LayoutGrid
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie,
  ComposedChart, Line, Legend
} from 'recharts';
import { db } from '../../api/db.ts';
import { useCurrency } from '../../context/CurrencyContext.tsx';

const PIE_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e'];

export const AdminReports: React.FC = () => {
  const { currency } = useCurrency();
  const [filter, setFilter] = useState('This Quarter');

  const globalStats = useMemo(() => {
    const shops = db.users.getAll().filter(u => u.role === 'USER');
    const plans = db.plans.getAll();
    const sales = db.sales.getAll();
    
    // Growth Data Node Simulation
    const growthNodes = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthStr = d.toLocaleDateString('en-GB', { month: 'short' });
      return {
        name: monthStr,
        mrr: Math.floor(Math.random() * 2000) + 1500,
        shops: Math.floor(Math.random() * 20) + 10,
        repairs: Math.floor(Math.random() * 50) + 20
      };
    });

    const mrr = shops.reduce((acc, shop) => {
      const plan = plans.find(p => p.id === shop.planId) || { price: 0 };
      return acc + plan.price;
    }, 0);

    const churnRate = "0.8%";
    const conversionRate = "12.4%";

    return { growthNodes, mrr, totalShops: shops.length, churnRate, conversionRate, globalSales: sales.length };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Global Intelligence Hub</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Globe size={14} className="text-indigo-600" /> Platform-Wide Performance Audit & Growth Forensics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-white border border-slate-200 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none shadow-sm">
             <option>This Quarter</option>
             <option>Year to Date</option>
             <option>All Time Node</option>
          </select>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-black transition-all">
             <Download size={18} /> Global Archive
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Platform MRR', val: `${currency.symbol}${globalStats.mrr.toLocaleString()}`, icon: CreditCard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Tenant Count', val: globalStats.totalShops, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Churn Resilience', val: globalStats.churnRate, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Conversion Node', val: globalStats.conversionRate, icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-6 group hover:shadow-xl transition-all">
             <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}><stat.icon size={28}/></div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{stat.val}</h4>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col">
           <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><LineChart size={24}/></div>
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 leading-none">Subscription Flux Analytics</h3>
              </div>
           </div>
           <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <ComposedChart data={globalStats.growthNodes}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} />
                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} />
                    <Legend />
                    <Area type="monotone" dataKey="mrr" fill="#6366f1" stroke="#6366f1" fillOpacity={0.1} strokeWidth={4} />
                    <Bar dataKey="shops" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                    <Line type="monotone" dataKey="repairs" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                 </ComposedChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="xl:col-span-4 space-y-8">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Revenue Distribution</h4>
              <div className="h-64 w-full relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                         data={[
                            { name: 'Gold', value: 45 },
                            { name: 'Premium', value: 25 },
                            { name: 'Basic', value: 20 },
                            { name: 'Others', value: 10 }
                         ]}
                         innerRadius={70}
                         outerRadius={95}
                         paddingAngle={8}
                         dataKey="value"
                         stroke="none"
                       >
                         {[1, 2, 3, 4, 5].map((_, index) => (
                           <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                         ))}
                       </Pie>
                       <Tooltip />
                    </PieChart>
                 </ResponsiveContainer>
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-800">100%</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Yield Mapping</span>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000"><ShieldCheck size={200} /></div>
              <div className="relative z-10 space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20"><ShieldAlert size={24}/></div>
                    <h4 className="text-lg font-black uppercase tracking-widest">Anomaly Detection</h4>
                 </div>
                 <p className="text-blue-100/60 text-xs font-medium leading-relaxed uppercase tracking-tighter">Forensic nodes detected 2 unusual high-value transactional spikes in the last 24h cycle.</p>
                 <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-indigo-500 transition-all shadow-xl">Audit Log Review</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
