import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip 
} from 'recharts';
import { 
  CreditCard, Wrench, Package, Rocket, 
  Lock, Bug, LayoutGrid, BarChart3,
  ShieldCheck, Info
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { UserRole } from '../../types.ts';

const CAT_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

export const SupportCategoryAnalysis: React.FC = () => {
  const { user } = useAuth();

  const analysis = useMemo(() => {
    const allTickets = user?.role === UserRole.ADMIN 
      ? db.supportTickets.getAll() 
      : db.supportTickets.getByUser(user?.id || '');

    const categories = [
      { id: 'Billing', label: 'Billing / Payment', icon: CreditCard, count: 0 },
      { id: 'Technical', label: 'Repair Issues', icon: Wrench, count: 0 },
      { id: 'Inventory', label: 'Inventory Issues', icon: Package, count: 0 },
      { id: 'Subscription', label: 'Plan / Subscription', icon: Rocket, count: 0 },
      { id: 'Access', label: 'Login / Access', icon: Lock, count: 0 },
      { id: 'Bug', label: 'Bug / Feature', icon: Bug, count: 0 },
      { id: 'Other', label: 'General / Other', icon: LayoutGrid, count: 0 },
    ];

    allTickets.forEach(t => {
      const cat = categories.find(c => 
        t.category.toLowerCase().includes(c.id.toLowerCase()) || 
        t.subject.toLowerCase().includes(c.id.toLowerCase())
      );
      if (cat) cat.count++;
      else categories[categories.length - 1].count++;
    });

    const chartData = categories
      .filter(c => c.count > 0)
      .map(c => ({ name: c.label, value: c.count }));

    return { categories, chartData, total: allTickets.length };
  }, [user]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* 1. Categorization Summary (Numeric) */}
      <div className="lg:col-span-7 bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 md:p-10 flex flex-col">
         <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
               <BarChart3 size={24} />
            </div>
            <div>
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 leading-none">Category Distribution</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Node-Level Problem Identification</p>
            </div>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {analysis.categories.map((cat, i) => (
              <div key={i} className={`p-5 rounded-3xl border transition-all flex items-center justify-between group ${cat.count > 0 ? 'bg-slate-50 border-slate-100 hover:border-indigo-300' : 'bg-white border-dashed border-slate-100 opacity-40'}`}>
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${cat.count > 0 ? 'bg-white text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                       <cat.icon size={18} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">{cat.label}</span>
                 </div>
                 <span className={`text-lg font-black ${cat.count > 0 ? 'text-slate-900' : 'text-slate-300'}`}>{cat.count}</span>
              </div>
            ))}
         </div>
      </div>

      {/* 2. Visual Analytics (Pie) */}
      <div className="lg:col-span-5 bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 flex flex-col items-center justify-center text-center relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-600"><LayoutGrid size={150} /></div>
         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 relative z-10">System Weakness Heatmap</h4>
         
         <div className="h-64 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                  <Pie
                    data={analysis.chartData}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {analysis.chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CAT_COLORS[index % CAT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', padding: '16px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                  />
               </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <span className="text-4xl font-black text-slate-900 leading-none">{analysis.total}</span>
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Total Tickets</span>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-10 relative z-10">
            {analysis.chartData.slice(0, 4).map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[i % CAT_COLORS.length] }} />
                 <span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[120px]">{d.name}</span>
              </div>
            ))}
         </div>

         <div className="mt-12 pt-8 border-t border-slate-50 w-full flex items-center justify-center gap-3">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Diagnostic Node Verified</span>
         </div>
      </div>

    </div>
  );
};
