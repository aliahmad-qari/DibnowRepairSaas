import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  CreditCard, Rocket, Wrench, Package, Lock, 
  LayoutGrid, BarChart3, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { db } from '../../api/db.ts';

const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#64748b'];

export const ComplaintCategoryAnalytics: React.FC = () => {
  const analysis = useMemo(() => {
    const all = db.complaints.getAll();
    const categories = [
      { id: 'payment', label: 'Payment', icon: CreditCard, color: '#6366f1', keywords: ['payment', 'billing', 'charge', 'money', 'refund'] },
      { id: 'plans', label: 'Plans', icon: Rocket, color: '#8b5cf6', keywords: ['plan', 'subscription', 'upgrade', 'tier', 'pricing'] },
      { id: 'repairs', label: 'Repairs', icon: Wrench, color: '#3b82f6', keywords: ['repair', 'device', 'hardware', 'fix', 'status'] },
      { id: 'inventory', label: 'Inventory', icon: Package, color: '#10b981', keywords: ['inventory', 'stock', 'sku', 'product', 'warehouse'] },
      { id: 'access', label: 'Access', icon: Lock, color: '#f59e0b', keywords: ['access', 'login', 'password', 'permission', 'entry'] },
      { id: 'other', label: 'Other', icon: LayoutGrid, color: '#64748b', keywords: [] },
    ];

    const distribution = categories.map(cat => {
      const count = all.filter(c => {
        const text = (c.subject + ' ' + (c.description || '')).toLowerCase();
        return cat.keywords.some(k => text.includes(k)) || (cat.id === 'other' && !categories.slice(0, -1).some(other => other.keywords.some(k => text.includes(k))));
      }).length;
      return { ...cat, count };
    });

    return {
      distribution,
      chartData: distribution.filter(d => d.count > 0).map(d => ({ name: d.label, value: d.count })),
      total: all.length
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Distribution Cards */}
      <div className="lg:col-span-7 bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 md:p-10 flex flex-col border-b-8 border-b-indigo-600">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 leading-none">Weakness Diagnostics</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Identify high-friction system modules</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {analysis.distribution.map((cat, i) => (
            <div key={i} className={`p-5 rounded-3xl border transition-all flex items-center justify-between group ${cat.count > 0 ? 'bg-slate-50 border-slate-100 hover:border-indigo-300' : 'bg-white border-dashed border-slate-100 opacity-40'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${cat.count > 0 ? 'bg-white text-indigo-600' : 'bg-slate-50 text-slate-300'}`}>
                  <cat.icon size={18} />
                </div>
                <span className="text-[11px] font-black uppercase tracking-tight text-slate-700">{cat.label}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-lg font-black ${cat.count > 0 ? 'text-slate-900' : 'text-slate-300'}`}>{cat.count}</span>
                {cat.count > 0 && <span className="text-[8px] font-black text-indigo-400 uppercase">Impact Node</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Analytics */}
      <div className="lg:col-span-5 bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 flex flex-col items-center justify-center text-center relative overflow-hidden border-b-8 border-b-blue-600">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-indigo-600"><AlertCircle size={150} /></div>
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-10 relative z-10">Complaint Sentiment Heatmap</h4>
        
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', padding: '16px' }}
                itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-4xl font-black text-slate-900 leading-none">{analysis.total}</span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">Total Influx</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-10 relative z-10">
          {analysis.chartData.slice(0, 4).map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
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