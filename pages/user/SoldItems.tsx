
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, Filter, ArrowUpRight, TrendingUp, Calendar, 
  User, Package, ChevronRight, FileText, Download, MoreHorizontal,
  CheckCircle2, DollarSign, Clock, ReceiptText, BarChart3, TrendingDown,
  Target, Activity, Users, Info, FileDown, X, ChevronDown, Landmark,
  AlertTriangle, Boxes, Scale, PieChart as PieIcon, RefreshCcw,
  Zap, ShieldAlert, BadgeCheck, AlertCircle, TrendingUp as VelocityIcon,
  AlertOctagon, Percent, Layers, BrainCircuit, Loader2, Sparkles,
  Cpu, ArrowDownRight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { db } from '../../api/db';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

const COMP_COLORS = ['#6366f1', '#f43f5e'];

export const SoldItems: React.FC = () => {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [sales, setSales] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState('Last 30 Days');
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'comparison' | 'deadstock' | 'restock' | 'forecast'>('comparison');
  
  // AI Forecast States
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiForecastResult, setAiForecastResult] = useState<any>(null);

  // Extended Filter States
  const [filters, setFilters] = useState({
    sku: '',
    brand: '',
    client: '',
    minPrice: '',
    maxPrice: '',
    minQty: '',
    maxQty: ''
  });

  useEffect(() => {
    const loadData = () => {
      setSales(db.sales.getAll());
      setInventory(db.inventory.getAll());
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const handleExportPDF = () => {
    window.print();
  };

  // 1. COMPARISON & CORE ANALYTICS ENGINE
  const analytics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.setHours(0,0,0,0));
    
    const filtered = sales.filter(s => {
      const sDate = s.timestamp ? new Date(s.timestamp) : new Date(s.date);
      if (isNaN(sDate.getTime())) return false;

      let matchesTime = true;
      if (dateFilter === 'Today') matchesTime = sDate >= startOfToday;
      else if (dateFilter === 'Last 7 Days') matchesTime = sDate >= new Date(now.getTime() - 7 * 86400000);
      else if (dateFilter === 'Last 30 Days') matchesTime = sDate >= new Date(now.getTime() - 30 * 86400000);

      const matchSearch = s.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchSku = !filters.sku || (s.sku && s.sku.toLowerCase().includes(filters.sku.toLowerCase()));
      const matchPrice = (!filters.minPrice || s.total >= parseFloat(filters.minPrice)) &&
                         (!filters.maxPrice || s.total <= parseFloat(filters.maxPrice));

      return matchesTime && matchSearch && matchSku && matchPrice;
    });

    const soldValue = filtered.reduce((a, b) => a + b.total, 0);
    const unsoldValue = inventory.reduce((a, b) => a + (b.price * b.stock), 0);
    const totalInventoryValue = soldValue + unsoldValue;
    const unsoldRatio = totalInventoryValue > 0 ? (unsoldValue / totalInventoryValue) * 100 : 0;

    const catMap: Record<string, any> = {};
    inventory.forEach(i => {
      if (!catMap[i.category]) catMap[i.category] = { name: i.category, totalUnits: 0, sold: 0, unsold: 0 };
      catMap[i.category].unsold += i.stock;
      catMap[i.category].totalUnits += i.stock;
    });
    filtered.forEach(s => {
      const invItem = inventory.find(i => i.id === s.productId);
      const cat = invItem?.category || 'Uncategorized';
      if (!catMap[cat]) catMap[cat] = { name: cat, totalUnits: 0, sold: 0, unsold: 0 };
      catMap[cat].sold += s.qty;
      catMap[cat].totalUnits += s.qty;
    });

    const categoryStats = Object.values(catMap).map(c => ({
      ...c,
      unsoldPercent: c.totalUnits > 0 ? (c.unsold / c.totalUnits) * 100 : 0
    }));

    return {
      filtered, soldValue, unsoldValue, totalInventoryValue, unsoldRatio, categoryStats,
      pieData: [
        { name: 'Liquidated (Sold)', value: soldValue },
        { name: 'Blocked (Unsold)', value: unsoldValue }
      ]
    };
  }, [sales, inventory, searchTerm, filters, dateFilter]);

  // 2. DEAD STOCK DETECTION ENGINE
  const deadStock = useMemo(() => {
    const now = new Date();
    return inventory.map(item => {
      const itemSales = sales.filter(s => s.productId === item.id);
      const lastSale = itemSales.length > 0 
        ? new Date(Math.max(...itemSales.map(s => {
            const d = s.timestamp ? new Date(s.timestamp) : new Date(s.date);
            return isNaN(d.getTime()) ? 0 : d.getTime();
          })))
        : new Date(item.createdAt || '2024-01-01');
      
      const daysSinceSale = Math.floor((now.getTime() - lastSale.getTime()) / (1000 * 3600 * 24));
      
      let status: 'SLOW' | 'AT RISK' | 'DEAD' | 'OPTIMAL' = 'OPTIMAL';
      if (daysSinceSale >= 90) status = 'DEAD';
      else if (daysSinceSale >= 60) status = 'AT RISK';
      else if (daysSinceSale >= 30) status = 'SLOW';

      return { ...item, daysSinceSale, status, lastSaleDate: lastSale.toLocaleDateString() };
    }).filter(i => i.status !== 'OPTIMAL' && i.stock > 0).sort((a,b) => b.daysSinceSale - a.daysSinceSale);
  }, [inventory, sales]);

  // 3. RESTOCK INTELLIGENCE ENGINE
  const restockIntel = useMemo(() => {
    const now = new Date();
    const daysWindow = 30;
    const windowStart = new Date(now.getTime() - daysWindow * 86400000);

    return inventory.map(item => {
      const windowSales = sales.filter(s => {
          const sDate = s.timestamp ? new Date(s.timestamp) : new Date(s.date);
          return s.productId === item.id && sDate >= windowStart;
      });
      const totalUnitsSold = windowSales.reduce((a, b) => a + b.qty, 0);
      const avgDailySales = totalUnitsSold / daysWindow;
      const estDaysLeft = avgDailySales > 0 ? Math.floor(item.stock / avgDailySales) : 999;
      
      let status: 'HEALTHY' | 'LOW' | 'CRITICAL' = 'HEALTHY';
      if (estDaysLeft <= 3) status = 'CRITICAL';
      else if (estDaysLeft <= 7 || item.stock < 5) status = 'LOW';

      return { ...item, avgDailySales, estDaysLeft, status, totalUnitsSold };
    }).filter(i => i.status !== 'HEALTHY').sort((a,b) => a.estDaysLeft - b.estDaysLeft);
  }, [inventory, sales]);

  // 4. AI DEMAND FORECAST (SAFE MODE)
  const runAIDemandForecast = async () => {
    setIsAIProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contextData = {
        inventory: inventory.map(i => ({ name: i.name, stock: i.stock, category: i.category })),
        recentSales: sales.slice(-20).map(s => ({ name: s.productName, qty: s.qty, date: s.date }))
      };

      const prompt = `You are a Supply Chain Data Scientist. Analyze this inventory and sales history: ${JSON.stringify(contextData)}. 
      Provide a Demand Forecast for the next 30 days in JSON format: { "top_demand": string[], "low_demand_warning": string[], "summary": string }. 
      Ensure advice is professional and purely advisory. Output ONLY JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setAiForecastResult(JSON.parse(response.text || '{}'));
    } catch (e) {
      console.error(e);
      alert("AI Neural Interface Offline.");
    } finally {
      setIsAIProcessing(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Stock Intelligence Hub</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <Activity size={14} className="text-indigo-600" />
            Node-Level Supply Chain Scrutiny
          </p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
           {['Today', 'Last 7 Days', 'Last 30 Days'].map(f => (
             <button key={f} onClick={() => setDateFilter(f)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-50'}`}>{f}</button>
           ))}
        </div>
      </div>

      {/* Analysis Module Selector */}
      <div className="flex flex-wrap gap-4 border-b border-slate-100 pb-4">
         {[
           { id: 'comparison', label: 'Liquidity Matrix', icon: Scale },
           { id: 'deadstock', label: 'Risk Monitor', icon: AlertOctagon },
           { id: 'restock', label: 'Supply Advisor', icon: RefreshCcw },
           { id: 'forecast', label: 'AI Demand Forecaster', icon: BrainCircuit },
         ].map(tab => (
           <button 
             key={tab.id} 
             onClick={() => setActiveAnalysisTab(tab.id as any)}
             className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeAnalysisTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
           >
             <tab.icon size={16} /> {tab.label}
           </button>
         ))}
      </div>

      {/* MODULE 1: SOLD VS UNSOLD COMPARISON */}
      {activeAnalysisTab === 'comparison' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col gap-4 shadow-sm group hover:border-indigo-200 transition-all">
               <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Boxes size={22}/></div>
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Portfolio Gross Value</p>
                  <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{currency.symbol}{Math.round(analytics.totalInventoryValue).toLocaleString()}</h4>
               </div>
            </div>
            <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col gap-4 shadow-sm group hover:border-emerald-200 transition-all">
               <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><TrendingUp size={22}/></div>
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Liquidated (Sold)</p>
                  <h4 className="text-2xl font-black text-emerald-600 tracking-tighter">{currency.symbol}{Math.round(analytics.soldValue).toLocaleString()}</h4>
               </div>
            </div>
            <div className="p-6 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col gap-4 shadow-sm group hover:border-rose-200 transition-all">
               <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><Landmark size={22}/></div>
               <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Blocked (In-Stock)</p>
                  <h4 className="text-2xl font-black text-rose-600 tracking-tighter">{currency.symbol}{Math.round(analytics.unsoldValue).toLocaleString()}</h4>
               </div>
            </div>
            <div className="p-6 bg-slate-900 rounded-[2.5rem] flex flex-col gap-4 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Percent size={100} className="text-white" /></div>
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md"><Scale size={22} className="text-indigo-400" /></div>
               <div>
                  <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Blocked Capital Ratio</p>
                  <h4 className="text-2xl font-black text-white tracking-tighter">{analytics.unsoldRatio.toFixed(1)}%</h4>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
             <div className="lg:col-span-4 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Asset Allocation Distribution</h4>
                <div className="h-64 w-full relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie data={analytics.pieData} innerRadius={70} outerRadius={95} paddingAngle={10} dataKey="value" stroke="none">
                            {analytics.pieData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COMP_COLORS[index % COMP_COLORS.length]} />
                            ))}
                         </Pie>
                         <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-black text-slate-800 uppercase">Capital</span>
                   </div>
                </div>
                <div className="flex gap-6 mt-8">
                   <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#6366f1]"/><span className="text-[9px] font-black uppercase text-slate-500">Liquid</span></div>
                   <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"/><span className="text-[9px] font-black uppercase text-slate-500">Blocked</span></div>
                </div>
             </div>

             <div className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Layers size={20}/></div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Category Liquidity index</h4>
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="text-[8px] font-black uppercase text-slate-400 border-b border-slate-50">
                         <tr className="h-12"><th className="px-10">Classification</th><th className="px-6 text-center">Total Units</th><th className="px-6 text-center text-emerald-600">Sold</th><th className="px-6 text-center text-rose-600">Unsold</th><th className="px-10 text-right">Blocked %</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[10px] font-bold">
                         {analytics.categoryStats.map((cat, i) => (
                           <tr key={i} className="h-16 hover:bg-slate-50 transition-all">
                              <td className="px-10"><span className="text-slate-800 uppercase">{cat.name}</span></td>
                              <td className="px-6 text-center text-slate-400">{cat.totalUnits}</td>
                              <td className="px-6 text-center text-emerald-600">{cat.sold}</td>
                              <td className="px-6 text-center text-rose-600">{cat.unsold}</td>
                              <td className="px-10 text-right"><span className={`px-2 py-0.5 rounded ${cat.unsoldPercent > 70 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>{cat.unsoldPercent.toFixed(1)}%</span></td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODULE 2: RISK MONITOR (DEAD STOCK) */}
      {activeAnalysisTab === 'deadstock' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><AlertOctagon size={150} className="text-rose-600" /></div>
              <div className="flex items-center gap-6 relative z-10">
                 <div className="w-20 h-20 bg-rose-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-rose-200 animate-pulse"><AlertCircle size={40} /></div>
                 <div>
                    <h3 className="text-2xl font-black text-rose-950 uppercase tracking-tighter leading-none">Capital Stagnancy alert</h3>
                    <p className="text-rose-600 font-bold uppercase text-[10px] tracking-widest mt-2">⚠ {deadStock.length} items detected as stagnant capital nodes</p>
                 </div>
              </div>
              <div className="flex gap-4 relative z-10">
                 <div className="px-6 py-4 bg-white/50 backdrop-blur rounded-2xl border border-rose-100 text-center min-w-[120px]">
                    <p className="text-[8px] font-black text-rose-400 uppercase mb-1">90+ Days Dead</p>
                    <p className="text-xl font-black text-rose-700">{deadStock.filter(i => i.status === 'DEAD').length}</p>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                    <tr className="h-14"><th className="px-10">Asset node</th><th className="px-6 text-center">In-Stock</th><th className="px-6 text-right">Value</th><th className="px-6 text-center">Last Active</th><th className="px-10 text-right">Risk Severity</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 text-[10px] font-bold">
                    {deadStock.length === 0 ? (
                      <tr><td colSpan={5} className="py-20 text-center text-emerald-500 font-black uppercase">No dead stock detected. Inventory health is optimal.</td></tr>
                    ) : deadStock.map((item, i) => (
                      <tr key={i} className="h-20 hover:bg-slate-50 transition-all">
                         <td className="px-10"><p className="text-slate-800 uppercase truncate max-w-[200px]">{item.name}</p></td>
                         <td className="px-6 text-center text-slate-400">{item.stock} Units</td>
                         <td className="px-6 text-right font-black">{currency.symbol}{(item.stock * item.price).toLocaleString()}</td>
                         <td className="px-6 text-center text-slate-400 uppercase">{item.lastSaleDate}</td>
                         <td className="px-10 text-right">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              item.status === 'DEAD' ? 'bg-rose-100 text-rose-700' : 
                              item.status === 'AT RISK' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {item.status} ({item.daysSinceSale}D)
                            </span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* MODULE 3: SUPPLY ADVISOR (RESTOCK) */}
      {activeAnalysisTab === 'restock' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex items-center justify-between border-b-8 border-b-emerald-500">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-100"><RefreshCcw size={40} /></div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Restock intelligence</h3>
                    <p className="text-emerald-600 font-black uppercase text-[10px] tracking-widest mt-2">📦 {restockIntel.length} items recommended for replenishment</p>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                 <div className="p-8 bg-slate-50 border-b border-slate-100">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Priority node Depletion</h4>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead className="text-[8px] font-black uppercase text-slate-400 border-b border-slate-50">
                          <tr className="h-12"><th className="px-8">Product</th><th className="px-6 text-center">Velocity</th><th className="px-6 text-center">Stock</th><th className="px-8 text-right">Estimated Node Lifetime</th></tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50 text-[10px] font-bold">
                          {restockIntel.map((item, i) => (
                            <tr key={i} className="h-20 hover:bg-slate-50 transition-all">
                               <td className="px-8"><p className="text-slate-800 uppercase truncate max-w-[150px]">{item.name}</p></td>
                               <td className="px-6 text-center font-black text-indigo-600">{item.avgDailySales.toFixed(2)}/day</td>
                               <td className="px-6 text-center">{item.stock} Units</td>
                               <td className="px-8 text-right">
                                  <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase ${item.status === 'CRITICAL' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'}`}>
                                     {item.estDaysLeft >= 999 ? 'STABLE' : `${item.estDaysLeft} DAYS LEFT`}
                                  </span>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>

              <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl flex flex-col justify-center">
                 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700"><VelocityIcon size={200} /></div>
                 <div className="relative z-10 space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">Restock Advisory Message</h4>
                    {restockIntel.length > 0 ? (
                      <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                         <p className="text-sm font-black leading-relaxed">
                           The node <span className="text-emerald-400">"{restockIntel[0].name}"</span> currently sells <span className="text-indigo-400">{restockIntel[0].avgDailySales.toFixed(1)} units/day</span> and will run out in <span className="text-rose-400">{restockIntel[0].estDaysLeft} days.</span>
                         </p>
                         <p className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">Consider restocking soon to avoid service interruption.</p>
                      </div>
                    ) : (
                      <div className="py-12 text-center opacity-40 italic">Protocol nominal. No critical restocking requirements.</div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODULE 4: AI DEMAND FORECAST */}
      {activeAnalysisTab === 'forecast' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000"><BrainCircuit size={250} /></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                 <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl">
                          <Cpu size={32} />
                       </div>
                       <h2 className="text-3xl font-black uppercase tracking-tighter">AI Demand Forecast</h2>
                    </div>
                    <p className="text-blue-100 text-sm font-medium leading-relaxed max-w-lg">Neural analysis of historical sales flux and inventory nodes to predict transactional behavior for the next 30-day cycle.</p>
                 </div>
                 <button 
                   onClick={runAIDemandForecast}
                   disabled={isAIProcessing}
                   className="px-10 py-5 bg-white text-indigo-600 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {isAIProcessing ? <><Loader2 className="animate-spin" size={18} /> HANDSHAKING...</> : <><Sparkles size={18} /> GENERATE FORECAST</>}
                 </button>
              </div>
           </div>

           {aiForecastResult && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in-95">
                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2"><ArrowUpRight size={16}/> Top Projected Demand</h4>
                   <div className="space-y-4">
                      {aiForecastResult.top_demand?.map((item: string, i: number) => (
                        <div key={i} className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                           <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-emerald-600 font-black text-xs shadow-sm">#0{i+1}</div>
                           <span className="text-xs font-black text-emerald-900 uppercase">{item}</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm space-y-8">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-600 flex items-center gap-2"><ArrowDownRight size={16}/> Low Performance Warning</h4>
                   <div className="space-y-4">
                      {aiForecastResult.low_demand_warning?.map((item: string, i: number) => (
                        <div key={i} className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-4">
                           <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-rose-600 font-black text-xs shadow-sm">!</div>
                           <span className="text-xs font-black text-rose-900 uppercase">{item}</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="lg:col-span-2 bg-indigo-50 p-10 rounded-[3rem] border border-indigo-100 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-10"><Info size={80} className="text-indigo-600" /></div>
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-4">Neural Summary Audit</h4>
                   <p className="text-indigo-900 font-black text-sm leading-relaxed italic relative z-10">"{aiForecastResult.summary}"</p>
                </div>
             </div>
           )}
        </div>
      )}

      {/* Main Ledger Table (Read-Only) */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden border-b-8 border-b-indigo-600">
        <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/20">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
             <input 
               type="text" 
               placeholder="Trace Audit ID (Item, Client, Ref)..." 
               className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none shadow-sm transition-all"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="flex items-center gap-3">
             <button onClick={handleExportPDF} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-black transition-all shadow-xl">
                <FileDown size={18} /> Export PDF Audit
             </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-8 py-6">Protocol ID</th>
                <th className="px-8 py-6">Liquidated Asset</th>
                <th className="px-8 py-6">Customer / Client</th>
                <th className="px-8 py-6 text-center">Qty</th>
                <th className="px-8 py-6 text-right">Settlement Value</th>
                <th className="px-8 py-6 text-center">Protocol Date</th>
                <th className="px-8 py-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {analytics.filtered.map((sale) => (
                <tr key={sale.id} className="hover:bg-indigo-50/30 transition-all cursor-pointer group">
                  <td className="px-8 py-6">
                    <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      {sale.id}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                         <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${sale.productName}`} className="w-7 h-7 opacity-50" />
                      </div>
                      <p className="font-black text-slate-800 text-sm tracking-tight">{sale.productName}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                       <User size={14} className="text-slate-300" />
                       {sale.customer}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-[11px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      x{sale.qty}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="font-black text-slate-900 text-base tracking-tighter">{currency.symbol}{sale.total.toLocaleString()}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sale.date}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-slate-300 hover:text-indigo-600 transition-colors p-2">
                       <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
              {analytics.filtered.length === 0 && (
                <tr>
                   <td colSpan={7} className="py-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in duration-700">
                         <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-100">
                            <ShoppingBag size={48} />
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-widest">No sold stock records found for this period</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-2">Once inventory is sold via POS, authorized audit records will appear here.</p>
                         </div>
                         <button onClick={() => navigate('/user/pos')} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100">Initialize POS Terminal</button>
                      </div>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
