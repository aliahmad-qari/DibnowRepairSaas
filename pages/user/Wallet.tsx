import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Download, 
  History, 
  MoreHorizontal,
  Wallet as WalletIcon,
  X,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  ArrowRight,
  TrendingUp,
  Landmark,
  ShieldAlert,
  Search,
  Activity,
  Zap,
  Clock,
  ArrowDownRight,
  BarChart3,
  ArrowUpCircle,
  Percent,
  TrendingDown,
  PieChart as PieIcon,
  ShoppingCart,
  Wrench,
  RotateCcw,
  /* Fixed: Correctly included AlertTriangle in the lucide-react imports */
  AlertTriangle,
  AlertCircle,
  ShieldX,
  BrainCircuit,
  Flame,
  AlertOctagon,
  Timer,
  FileSpreadsheet,
  FileText,
  Filter,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { db } from '../../api/db';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';

const GATEWAY_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e'];

export const Wallet: React.FC = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({ amount: '', method: 'Stripe' });
  
  // Tasks 7 & 8: UI States for Filtering & Exporting
  const [chartView, setChartView] = useState<'Daily' | 'Monthly'>('Daily');
  const [dateFilter, setDateFilter] = useState<'Today' | '7D' | '30D' | 'Custom'>('30D');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadTransactions = () => {
      setTransactions(db.wallet.getTransactions());
    };
    loadTransactions();
    window.addEventListener('storage', loadTransactions);
    return () => window.removeEventListener('storage', loadTransactions);
  }, []);

  // TASK 3: INTELLIGENCE TAGGING HELPER
  const getTransactionContext = (tx: any) => {
    const desc = tx.description.toLowerCase();
    if (desc.includes('subscription')) return { label: 'Subscription', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50 border-indigo-100', category: 'Subscription' };
    if (desc.includes('repair')) return { label: 'Repair Payment', icon: Wrench, color: 'text-blue-600 bg-blue-50 border-blue-100', category: 'Repair' };
    if (desc.includes('pos') || desc.includes('sale')) return { label: 'POS Sale', icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50 border-emerald-100', category: 'POS' };
    if (desc.includes('refill') || desc.includes('top-up')) return { label: 'Wallet Top-Up', icon: Plus, color: 'text-amber-600 bg-amber-50 border-amber-100', category: 'Top-Up' };
    if (desc.includes('refund')) return { label: 'Refund', icon: RotateCcw, color: 'text-rose-600 bg-rose-50 border-rose-100', category: 'Refund' };
    return { label: 'General', icon: Activity, color: 'text-slate-600 bg-slate-50 border-slate-100', category: 'General' };
  };

  // TASK 1, 2, 4, 5, 6 & 8: FINANCIAL INTELLIGENCE ENGINE
  const financialIntel = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0,0,0,0));

    // Task 8: Filter Logic
    let filtered = transactions.filter(t => {
      const tDate = new Date(t.date);
      const ctx = getTransactionContext(t);
      
      // Date filtering
      let dateMatch = true;
      if (dateFilter === 'Today') dateMatch = tDate >= startOfToday;
      else if (dateFilter === '7D') dateMatch = tDate >= new Date(now.getTime() - 7 * 86400000);
      else if (dateFilter === '30D') dateMatch = tDate >= new Date(now.getTime() - 30 * 86400000);
      else if (dateFilter === 'Custom' && customRange.from && customRange.to) {
        dateMatch = tDate >= new Date(customRange.from) && tDate <= new Date(customRange.to);
      }

      // Type/Category filtering
      let typeMatch = true;
      if (typeFilter !== 'all') {
        if (typeFilter === 'credit' || typeFilter === 'debit') typeMatch = t.type === typeFilter;
        else typeMatch = ctx.category.toLowerCase() === typeFilter.toLowerCase();
      }

      // Search query
      const searchMatch = !searchQuery || t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.id.includes(searchQuery);

      return dateMatch && typeMatch && searchMatch;
    });

    // Task 7: Financial Audit Stats (Opening/Closing/Net)
    const netMovement = filtered.reduce((acc, t) => acc + (t.type === 'credit' ? t.amount : -t.amount), 0);
    const closingBalance = user?.walletBalance || 0;
    const openingBalance = closingBalance - netMovement;

    const pendingCredits = transactions.filter(t => t.type === 'credit' && t.status === 'pending').reduce((acc, t) => acc + t.amount, 0);
    const pendingDebits = transactions.filter(t => t.type === 'debit' && t.status === 'pending').reduce((acc, t) => acc + t.amount, 0);
    
    const lastTopUp = transactions.find(t => t.type === 'credit' && t.status === 'success');
    const lastDeduction = transactions.find(t => t.type === 'debit' && t.status === 'success');

    // Chart Data Preparation (Task 2)
    const timeNodes: Record<string, { name: string, inflow: number, outflow: number }> = {};
    const gatewayMap: Record<string, number> = { Stripe: 0, PayPal: 0, PayFast: 0, Wallet: 0, Manual: 0 };
    
    const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedTx.forEach(t => {
      const date = new Date(t.date);
      const key = chartView === 'Daily' ? t.date : `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
      
      if (!timeNodes[key]) {
        timeNodes[key] = { name: key, inflow: 0, outflow: 0 };
      }
      
      if (t.type === 'credit' && t.status === 'success') timeNodes[key].inflow += t.amount;
      if (t.type === 'debit' && t.status === 'success') timeNodes[key].outflow += t.amount;

      if (t.status === 'success') {
        const desc = t.description.toLowerCase();
        if (desc.includes('stripe')) gatewayMap.Stripe += t.amount;
        else if (desc.includes('paypal')) gatewayMap.PayPal += t.amount;
        else if (desc.includes('payfast')) gatewayMap.PayFast += t.amount;
        else if (desc.includes('wallet') || t.type === 'debit') gatewayMap.Wallet += t.amount;
        else gatewayMap.Manual += t.amount;
      }
    });

    const chartData = Object.values(timeNodes).slice(-10);
    const distributionData = Object.entries(gatewayMap).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const failedTransactions = transactions.filter(t => 
      t.status === 'failed' && new Date(t.date) >= sevenDaysAgo
    ).map(t => ({
      ...t,
      reason: t.description.includes('refill') ? 'Gateway timeout / Card refused' : 'Insufficient treasury nodes'
    }));

    const successDebits = transactions.filter(t => t.type === 'debit' && t.status === 'success');
    const successCredits = transactions.filter(t => t.type === 'credit' && t.status === 'success');
    const avgMonthlySpend = successDebits.length > 0 ? (successDebits.reduce((a,b) => a+b.amount,0) / Math.max(1, (new Set(successDebits.map(t => new Date(t.date).getMonth()))).size)) : 0;
    const avgTopUpSize = successCredits.length > 0 ? (successCredits.reduce((a,b) => a+b.amount,0) / successCredits.length) : 0;
    const last30DaysDebits = successDebits.filter(t => new Date(t.date) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    const dailyBurnRate = last30DaysDebits.reduce((acc, t) => acc + t.amount, 0) / 30;
    const daysRemaining = dailyBurnRate > 0 ? Math.floor((user?.walletBalance || 0) / dailyBurnRate) : 999;

    return {
      availableBalance: user?.walletBalance || 0,
      pendingCredits,
      pendingDebits,
      lastTopUpDate: lastTopUp ? lastTopUp.date : 'None',
      lastTopUpMethod: lastTopUp ? (lastTopUp.description.split(':')[1]?.trim() || 'Internal') : 'N/A',
      lastDeductionReason: lastDeduction ? (lastDeduction.description.split(':')[1]?.trim() || lastDeduction.description) : 'N/A',
      chartData,
      distributionData,
      failedTransactions,
      filtered,
      netMovement,
      openingBalance,
      closingBalance,
      insights: { avgMonthlySpend, avgTopUpSize, dailyBurnRate, daysRemaining }
    };
  }, [transactions, user, chartView, dateFilter, typeFilter, searchQuery, customRange]);

  // TASK 7: EXPORT LOGIC
  const handleExportCSV = () => {
    const headers = ["Protocol Node", "Settlement", "Type", "Status", "Timestamp", "Reference"];
    const rows = financialIntel.filtered.map(t => [
      t.description,
      `${t.type === 'credit' ? '+' : '-'}${t.amount}`,
      t.type.toUpperCase(),
      t.status.toUpperCase(),
      t.date,
      `#${t.id}`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Wallet_Audit_${dateFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) return;
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      db.wallet.addTransaction({
        amount: parseFloat(formData.amount),
        type: 'credit',
        status: 'success',
        date: new Date().toLocaleDateString(),
        description: `Refill: ${formData.method} Gateway Entry`
      });
      setIsProcessing(false);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); setShowAddModal(false); setFormData({ amount: '', method: 'Stripe' }); }, 2000);
    } catch (error) { setIsProcessing(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 max-w-[1400px] mx-auto">
      
      {/* TASK 9: LOW BALANCE WARNING */}
      {financialIntel.availableBalance < 50 && (
        <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2.5rem] flex items-center justify-between gap-6 animate-in slide-in-from-top-4 duration-700">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 animate-pulse"><AlertTriangle size={28}/></div>
              <div>
                 <h4 className="text-base font-black text-rose-900 uppercase leading-none">⚠ Low Treasury Balance detected</h4>
                 <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-2">Critical threshold reached. Infrastructure services may pause if balance reaches zero.</p>
              </div>
           </div>
           <button onClick={() => setShowAddModal(true)} className="px-8 py-3 bg-rose-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-700 transition-all shadow-xl">Top Up Protocol</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Virtual Treasury</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1 flex items-center gap-2">
            <ShieldCheck size={14} className="text-indigo-600" />
            Authorized Financial Node • {currency.code} Context
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm">
             <button onClick={handleExportCSV} className="p-3 text-slate-500 hover:text-indigo-600 transition-colors" title="Export CSV Ledger"><FileSpreadsheet size={20}/></button>
             <button onClick={() => window.print()} className="p-3 text-slate-500 hover:text-indigo-600 transition-colors" title="Export PDF Statement"><FileText size={20}/></button>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#0052FF] text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-2xl shadow-blue-200 hover:scale-[1.03] active:scale-95 transition-all text-[11px] uppercase tracking-[0.2em]"
          >
            <Plus size={18} /> Deploy Capital
          </button>
        </div>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Treasury Balance', val: financialIntel.availableBalance, icon: WalletIcon, color: 'text-indigo-600', bg: 'bg-indigo-50', isCurr: true },
          { label: 'Pending Inflow', val: financialIntel.pendingCredits, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', isCurr: true },
          { label: 'Pending Outflow', val: financialIntel.pendingDebits, icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50', isCurr: true },
          { label: 'Last Top-Up', val: `${financialIntel.lastTopUpMethod} • ${financialIntel.lastTopUpDate}`, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Last Deduction', val: financialIntel.lastDeductionReason, icon: ArrowDownRight, color: 'text-amber-600', bg: 'bg-amber-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-indigo-500 transition-all">
             <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}><stat.icon size={18}/></div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <h4 className={`font-black text-slate-800 truncate ${stat.isCurr ? 'text-lg' : 'text-[10px]'}`}>
                  {stat.isCurr ? currency.symbol : ''}{stat.val.toLocaleString()}
                </h4>
             </div>
          </div>
        ))}
      </div>

      {/* TASK 6: INSIGHTS MODULE */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
         {[
           { label: 'Avg Monthly Spend', val: financialIntel.insights.avgMonthlySpend, icon: Flame, color: 'text-rose-600', bg: 'bg-rose-50', isCurr: true },
           { label: 'Avg Top-Up Size', val: financialIntel.insights.avgTopUpSize, icon: ArrowUpCircle, color: 'text-blue-600', bg: 'bg-blue-50', isCurr: true },
           { label: 'Daily Burn Rate', val: financialIntel.insights.dailyBurnRate, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50', isCurr: true },
           { label: 'Projected Exhaustion', val: financialIntel.insights.daysRemaining === 999 ? '∞' : `${financialIntel.insights.daysRemaining} Days`, icon: Timer, color: 'text-amber-600', bg: 'bg-amber-50' }
         ].map((insight, i) => (
           <div key={i} className="bg-slate-900 border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-5 group hover:border-indigo-500 transition-all">
              <div className={`w-12 h-12 rounded-2xl ${insight.bg} ${insight.color} flex items-center justify-center group-hover:scale-110 transition-transform`}><insight.icon size={22}/></div>
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{insight.label}</p>
                 <h4 className="text-xl font-black text-white tracking-tighter">
                   {insight.isCurr ? currency.symbol : ''}{typeof insight.val === 'number' ? Math.round(insight.val).toLocaleString() : insight.val}
                 </h4>
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* TASK 2: CHART */}
        <div className="xl:col-span-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
           <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-50/20">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><BarChart3 size={24}/></div>
                 <div><h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Cash Flow breakdown</h3><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Liquidity Flux Analysis Node</p></div>
              </div>
              <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                 {['Daily', 'Monthly'].map((v) => (
                   <button key={v} onClick={() => setChartView(v as any)} className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${chartView === v ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{v}</button>
                 ))}
              </div>
           </div>
           <div className="flex-1 p-8">
              <div className="h-80 w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={financialIntel.chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} /><YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 900}} tickFormatter={(v) => `${currency.symbol}${v}`} /><Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} /><Legend verticalAlign="top" align="right" height={36} /><Area name="Inflows" type="monotone" dataKey="inflow" stroke="#10b981" strokeWidth={4} fill="#10b98120" /><Area name="Outflows" type="monotone" dataKey="outflow" stroke="#f43f5e" strokeWidth={4} fill="#f43f5e20" /></AreaChart></ResponsiveContainer></div>
           </div>
        </div>

        {/* TASK 4: GATEWAY DISTRIBUTION */}
        <div className="xl:col-span-4 flex flex-col gap-8">
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-between group h-full">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><PieIcon size={24}/></div>
               <div><h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Gateway Preference</h3><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Method Distribution Audit</p></div>
            </div>
            <div className="h-64 w-full relative"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={financialIntel.distributionData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">{financialIntel.distributionData.map((_, index) => (<Cell key={`cell-${index}`} fill={GATEWAY_COLORS[index % GATEWAY_COLORS.length]} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
          </div>

          {/* TASK 5: RISK MONITOR */}
          <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col h-fit border-b-8 border-b-rose-600">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse"><ShieldX size={24}/></div>
                <div><h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Risk Forensic Monitor</h3><p className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mt-1">Failed & Reversed Flow Nodes</p></div>
             </div>
             <div className="space-y-4">
                {financialIntel.failedTransactions.length === 0 ? <div className="py-12 flex flex-col items-center justify-center opacity-20"><CheckCircle2 size={48} /><p className="text-[9px] font-black uppercase mt-4">Protocol: All handshakes success</p></div> : financialIntel.failedTransactions.map((tx, idx) => (<div key={idx} className="p-5 bg-rose-50 border border-rose-100 rounded-3xl space-y-2"><div className="flex items-center justify-between"><span className="text-[10px] font-black text-rose-900 uppercase">⚠ Protocol Rejection</span><span className="text-[9px] font-mono font-bold text-rose-400">#{tx.id}</span></div><p className="text-[11px] font-black text-rose-800 leading-tight truncate uppercase">{tx.description}</p><div className="flex items-center justify-between pt-2 border-t border-rose-200/50"><span className="text-[9px] font-bold text-rose-600/70 uppercase">Reason: {tx.reason}</span><span className="text-xs font-black text-rose-700">{currency.symbol}{tx.amount}</span></div></div>))}
             </div>
          </div>
        </div>
      </div>

      {/* TASK 8: LEDGER WITH FILTERS */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
        <div className="p-8 border-b border-slate-50 flex flex-col gap-8 bg-slate-50/20">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm"><History size={24} /></div>
                <div><h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Transaction Ledger</h3><p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Real-time Synchronized Digital Record</p></div>
              </div>
              <div className="relative w-full max-w-sm group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                 <input type="text" placeholder="Query hash or reference..." className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
           </div>

           {/* TASK 8: FILTER BAR */}
           <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200">
                 <Calendar size={14} className="text-slate-400" />
                 <select value={dateFilter} onChange={e => setDateFilter(e.target.value as any)} className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer">
                    <option value="Today">Today</option>
                    <option value="7D">Last 7 Days</option>
                    <option value="30D">Last 30 Days</option>
                    <option value="Custom">Custom Range</option>
                 </select>
              </div>
              {dateFilter === 'Custom' && (
                <div className="flex items-center gap-2 animate-in zoom-in-95">
                  <input type="date" value={customRange.from} onChange={e => setCustomRange({...customRange, from: e.target.value})} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold" />
                  <span className="text-slate-300">to</span>
                  <input type="date" value={customRange.to} onChange={e => setCustomRange({...customRange, to: e.target.value})} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold" />
                </div>
              )}
              <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-slate-200">
                 <Filter size={14} className="text-slate-400" />
                 <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer">
                    <option value="all">All Types</option>
                    <option value="credit">Credits (Top-Ups)</option>
                    <option value="debit">Debits (Expenses)</option>
                    <option value="subscription">Subscriptions</option>
                    <option value="repair">Repairs</option>
                    <option value="pos">POS Sales</option>
                    <option value="refund">Refunds</option>
                 </select>
              </div>
              <div className="ml-auto hidden lg:flex items-center gap-6 px-6 py-2.5 bg-slate-900 rounded-2xl text-white">
                 <div className="text-center">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Opening</p>
                    <p className="text-xs font-black">{currency.symbol}{financialIntel.openingBalance.toLocaleString()}</p>
                 </div>
                 <ArrowRight size={14} className="text-slate-600" />
                 <div className="text-center">
                    <p className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Net Change</p>
                    <p className={`text-xs font-black ${financialIntel.netMovement >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {financialIntel.netMovement >= 0 ? '+' : ''}{currency.symbol}{financialIntel.netMovement.toLocaleString()}
                    </p>
                 </div>
                 <ArrowRight size={14} className="text-slate-600" />
                 <div className="text-center">
                    <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest">Closing</p>
                    <p className="text-xs font-black">{currency.symbol}{financialIntel.closingBalance.toLocaleString()}</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
              <tr>
                <th className="px-10 py-6">Protocol Node / Intelligence</th>
                <th className="px-10 py-6 text-center">Settlement</th>
                <th className="px-10 py-6 text-center">Node Status</th>
                <th className="px-10 py-6 text-center">Audit Timestamp</th>
                <th className="px-10 py-6 text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {financialIntel.filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-24 text-center opacity-30 uppercase font-black tracking-widest text-sm">No transaction nodes identified for current criteria</td></tr>
              ) : financialIntel.filtered.map((t) => {
                const intel = getTransactionContext(t);
                const IconNode = intel.icon;
                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-all group">
                    <td className="px-10 py-7">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border ${t.type === 'credit' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                          {t.type === 'credit' ? <Plus size={22} /> : <TrendingDown size={22} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 leading-tight tracking-tight uppercase">{t.description}</p>
                          <div className={`mt-1.5 px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${intel.color}`}>
                            <IconNode size={10} /> {intel.label}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-10 py-7 text-center font-black text-base ${t.status === 'failed' ? 'text-slate-300' : t.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {t.status === 'failed' ? '' : t.type === 'credit' ? '+' : '-'}{currency.symbol}{t.amount.toLocaleString()}
                    </td>
                    <td className="px-10 py-7 text-center">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase inline-flex items-center gap-2 border ${t.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : t.status === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'success' ? 'bg-emerald-500' : t.status === 'failed' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        {t.status}
                      </span>
                    </td>
                    <td className="px-10 py-7 text-center text-[10px] text-slate-400 font-black uppercase tracking-widest">{t.date}</td>
                    <td className="px-10 py-7 text-right">
                      <span className="font-mono text-[10px] font-black text-slate-300 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">#{t.id}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL REDESIGNED */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300 backdrop-blur-xl bg-slate-950/40">
          <div className="bg-white w-full max-w-lg rounded-[2rem] sm:rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col relative border border-white/20 max-h-[95vh] sm:max-h-[90vh]">
            {success ? (
               <div className="flex-1 p-10 sm:p-20 flex flex-col items-center justify-center text-center space-y-6 sm:space-y-8 animate-in zoom-in-90 duration-300 overflow-y-auto">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-200 animate-bounce shrink-0">
                     <CheckCircle2 size={40} />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Authorization Successful</h3>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px] sm:text-[10px]">Your treasury node has been updated.</p>
                  </div>
               </div>
            ) : (
              <>
                <div className="bg-slate-900 p-6 sm:p-8 text-white flex items-center justify-between shrink-0">
                   <div className="flex items-center gap-4">
                     <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 backdrop-blur-md shrink-0"><CreditCard size={20} /></div>
                     <div>
                        <h3 className="text-base sm:text-xl font-black uppercase tracking-widest leading-none">Capital Refill</h3>
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 mt-1 sm:mt-2 uppercase tracking-tighter">Authorized Gateway Node</p>
                     </div>
                   </div>
                   <button onClick={() => setShowAddModal(false)} className="p-2 sm:p-3 bg-white/10 hover:bg-rose-500 text-white rounded-full transition-all duration-300 shrink-0"><X size={18}/></button>
                </div>
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                  <form onSubmit={handleAddCredits} className="p-6 sm:p-10 space-y-6 sm:space-y-8">
                    <div className="space-y-2">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Refill Amount ({currency.code})</label>
                      <div className="relative group">
                        <div className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 text-slate-300 text-xl sm:text-2xl font-black group-focus-within:text-blue-600 transition-colors">{currency.symbol}</div>
                        <input required autoFocus type="number" step="0.01" className="w-full pl-12 sm:pl-16 pr-6 sm:pr-8 py-4 sm:py-6 bg-slate-50 border-2 border-slate-100 rounded-2xl sm:rounded-3xl outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 text-2xl sm:text-3xl font-black transition-all placeholder:text-slate-200" placeholder="0.00" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Select Payment Protocol</label>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {['Stripe', 'PayPal', 'PayFast', 'Manual'].map(m => (
                          <button key={m} type="button" onClick={() => setFormData({...formData, method: m})} className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 flex items-center gap-2 sm:gap-3 transition-all ${formData.method === m ? 'bg-blue-50 border-[#0052FF]' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>
                            <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest ${formData.method === m ? 'text-[#0052FF]' : ''}`}>{m}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <button type="submit" disabled={isProcessing || !formData.amount || parseFloat(formData.amount) <= 0} className="w-full bg-[#0052FF] text-white font-black py-5 sm:py-6 rounded-xl sm:rounded-[2rem] shadow-2xl shadow-blue-100 hover:bg-blue-600 transition-all uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-[11px] flex items-center justify-center gap-3 sm:gap-4 group active:scale-95 disabled:opacity-50">{isProcessing ? <><Loader2 className="animate-spin" size={18} /> Transmitting...</> : <><ShieldCheck size={18} /> Authorize Deployment</>}</button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
