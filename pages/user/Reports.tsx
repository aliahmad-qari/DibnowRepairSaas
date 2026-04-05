
import React, { useMemo, useState, useEffect } from 'react';
import {
  TrendingUp, BarChart3, Wrench, ShoppingBag,
  DollarSign, ArrowUpRight, ArrowDownRight,
  Calendar, Download, FileText, Filter, Info,
  Zap, Activity, Target
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { Loader2 } from 'lucide-react';
import { BackButton } from '../../components/common/BackButton';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'];

export const UserReports: React.FC = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [timeframe, setTimeframe] = useState('Last 30 Days');

  const [repairs, setRepairs] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [repResp, saleResp] = await Promise.all([
          callBackendAPI('/repairs', null, 'GET'),
          callBackendAPI('/sales', null, 'GET')
        ]);
        setRepairs(Array.isArray(repResp) ? repResp : repResp?.repairs || []);
        setSales(saleResp || []);
      } catch (error) {
        console.error('Failed to load growth trace:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const reportData = useMemo(() => {
    // Aggregate data for charts
    const chartPoints = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

      const dayRepairs = repairs.filter(r => new Date(r.createdAt || r.date).toLocaleDateString() === d.toLocaleDateString());
      const daySales = sales.filter(s => new Date(s.createdAt || s.date).toLocaleDateString() === d.toLocaleDateString());

      return {
        name: dateStr,
        revenue: daySales.reduce((sum, s) => sum + (s.total || 0), 0) + dayRepairs.reduce((sum, r) => sum + (parseFloat(r.cost || r.estimatedCost) || 0), 0),
        repairs: dayRepairs.length,
        sales: daySales.length
      };
    });

    const totalRevenue = sales.reduce((a, b) => a + (b.total || 0), 0) + repairs.reduce((a, b) => a + (parseFloat(b.cost || b.estimatedCost) || 0), 0);
    const avgOrderValue = sales.length > 0 ? (sales.reduce((a, b) => a + (b.total || 0), 0) / sales.length) : 0;

    return { chartPoints, totalRevenue, avgOrderValue, repairsCount: repairs.length, salesCount: sales.length };
  }, [repairs, sales]);

  const handleExport = () => {
    alert("Protocol Initiated: Aggregated Business Report node dispatched to browser print engine.");
    window.print();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20 px-4">
      <div className="pt-4">
        <BackButton />
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Business Intelligence</h2>
          <p className="text-slate-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center justify-center lg:justify-start gap-2">
            <Activity size={12} className="text-indigo-600 shrink-0" /> Operational Analytics & Growth Forensics
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-3 w-full lg:w-auto">
          <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm w-full sm:w-auto justify-center">
            {['7D', '30D', '1Y'].map(t => (
              <button key={t} onClick={() => setTimeframe(t)} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${timeframe.includes(t) ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
            ))}
          </div>
          <button onClick={handleExport} className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl hover:bg-black transition-all">
            <Download size={16} /> Export Audit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', val: `${currency.symbol}${reportData.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Repair Volume', val: reportData.repairsCount, icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Sales Volume', val: reportData.salesCount, icon: ShoppingBag, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Avg. Transaction', val: `${currency.symbol}${reportData.avgOrderValue.toFixed(2)}`, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-3 sm:gap-4 group hover:shadow-xl transition-all">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0`}><stat.icon size={20} sm:size={22} /></div>
            <div className="min-w-0">
              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{stat.label}</p>
              <h4 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tighter truncate">{stat.val}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
              <TrendingUp size={14} sm:size={16} className="text-indigo-600 shrink-0" /> Revenue Stream
            </h3>
          </div>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.chartPoints}>
                <defs>
                   <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                     <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-800 flex items-center gap-2">
              <BarChart3 size={14} sm:size={16} className="text-emerald-600 shrink-0" /> Service vs Sales Mix
            </h3>
          </div>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.chartPoints}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                <YAxis hide />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="repairs" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
