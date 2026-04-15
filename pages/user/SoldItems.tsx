import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
   ShoppingBag, Search, Filter, Download, ArrowRight, Loader2, 
   History, DollarSign, User, Activity, TrendingUp, TrendingDown,
   Briefcase, ArrowUpRight, Clock, ChevronDown, RefreshCcw, 
   BarChart3, AlertOctagon, Scale, FileDown, BrainCircuit, Info,
   Lock, MoreHorizontal, X, Wrench, Package, Boxes
} from 'lucide-react';
import {
   ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
   BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { aiService } from '../../api/aiService';
import { BackButton } from '../../components/common/BackButton';

const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

export const SoldItems: React.FC = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const { currency } = useCurrency();
   const [sales, setSales] = useState<any[]>([]);
   const [inventory, setInventory] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [searchTerm, setSearchTerm] = useState('');
   const [dateFilter, setDateFilter] = useState('Last 30 Days');
   const [activeAnalysisTab, setActiveAnalysisTab] = useState<'comparison' | 'deadstock' | 'restock' | 'forecast'>('comparison');
   const [isAIProcessing, setIsAIProcessing] = useState(false);
   const [aiForecastResult, setAiForecastResult] = useState<any>(null);

   useEffect(() => {
      const loadData = async () => {
         if (!user) return;
         setIsLoading(true);
         try {
            const [salesResp, invResp] = await Promise.all([
               callBackendAPI('/api/sales', null, 'GET'),
               callBackendAPI('/api/inventory', null, 'GET')
            ]);
            setSales(Array.isArray(salesResp) ? salesResp : []);
            setInventory(Array.isArray(invResp) ? invResp : []);
         } catch (error) {
            console.error('Error loading sales ledger:', error);
         } finally {
            setIsLoading(false);
         }
      };
      loadData();
   }, [user]);

   const analytics = useMemo(() => {
      const filtered = sales.filter(s => {
         const matchesSearch = s.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s._id && s._id.toString().includes(searchTerm));
         return matchesSearch;
      });

      const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0);
      const totalUnits = filtered.reduce((sum, s) => sum + s.qty, 0);
      const avgSaleValue = totalUnits > 0 ? totalRevenue / totalUnits : 0;

      const categoryMap: any = {};
      filtered.forEach(s => {
         const item = inventory.find(i => i._id === s.productId);
         const cat = item?.category || 'General';
         categoryMap[cat] = (categoryMap[cat] || 0) + s.total;
      });

      const categoryChart = Object.keys(categoryMap).map(name => ({ name, value: categoryMap[name] }));

      return { filtered, totalRevenue, totalUnits, avgSaleValue, categoryChart };
   }, [sales, inventory, searchTerm]);

   const handleExportPDF = () => {
      window.print();
   };

   const runAIDemandForecast = async () => {
      setIsAIProcessing(true);
      try {
         const contextData = {
            inventory: inventory.map(i => ({ name: i.name, stock: i.stock, category: i.category })),
            recentSales: sales.slice(-20).map(s => ({ name: s.productName, qty: s.qty, date: s.date }))
         };

         const prompt = `Analyze inventory and sales: ${JSON.stringify(contextData)}. Provide a Demand Forecast for 30 days in JSON: { "top_demand": string[], "low_demand_warning": string[], "summary": string }.`;
         const data = await aiService.generateJson(prompt, "System: Supply Chain Data Scientist Demand Forecast");
         if (data) setAiForecastResult(data);
      } catch (e) {
         console.error(e);
      } finally {
         setIsAIProcessing(false);
      }
   };

   return (
      <div className="space-y-8 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto px-4 md:px-6 relative">
         <BackButton />
         
         {isLoading && (
            <div className="absolute inset-0 z-[300] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
               <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
         )}

         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-none uppercase">Stock Intelligence Hub</h1>
               <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                  <Activity size={14} className="text-indigo-600" />
                  Node-Level Supply Chain Scrutiny
               </p>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto custom-scrollbar no-scrollbar w-full md:w-auto shrink-0">
               {['Today', 'Last 7 Days', 'Last 30 Days'].map(f => (
                  <button key={f} onClick={() => setDateFilter(f)} className={`flex-1 md:flex-none px-4 sm:px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${dateFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{f}</button>
               ))}
            </div>
         </div>

         {/* Analysis Tabs */}
         <div className="flex overflow-x-auto custom-scrollbar no-scrollbar gap-3 border-b border-slate-100 pb-4 shrink-0 -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
               { id: 'comparison', label: 'Liquidity Matrix', icon: Scale },
               { id: 'deadstock', label: 'Risk Monitor', icon: AlertOctagon },
               { id: 'restock', label: 'Supply Advisor', icon: RefreshCcw },
               { id: 'forecast', label: 'AI Demand Forecaster', icon: BrainCircuit },
            ].map(tab => (
               <button
                  key={tab.id}
                  onClick={() => setActiveAnalysisTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-3.5 sm:py-4 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${activeAnalysisTab === tab.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 translate-y-[-2px]' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               >
                  <tab.icon size={16} /> {tab.label}
               </button>
            ))}
         </div>

         {/* Dash Cards */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Node Revenue</p>
               <h4 className="text-4xl font-black text-slate-800 tracking-tighter">{currency.symbol}{analytics.totalRevenue.toLocaleString()}</h4>
               <p className="text-[10px] font-bold text-emerald-500 uppercase mt-4 flex items-center gap-2"><TrendingUp size={14} /> +12.5% vs Prev Period</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Assets Liquidated</p>
               <h4 className="text-4xl font-black text-slate-800 tracking-tighter">{analytics.totalUnits} Units</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase mt-4">Volume Across {analytics.filtered.length} Protocols</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm sm:col-span-2 lg:col-span-1">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Average Settlement</p>
               <h4 className="text-4xl font-black text-slate-800 tracking-tighter">{currency.symbol}{analytics.avgSaleValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h4>
               <p className="text-[10px] font-bold text-indigo-500 uppercase mt-4">Per Asset Unit Node</p>
            </div>
         </div>

         {/* Main Ledger Table */}
         <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden border-b-8 border-b-indigo-600 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 sm:p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/20">
               <div className="relative flex-1 w-full">
                  <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                     type="text"
                     placeholder="Trace Audit ID (Item, Client, Ref)..."
                     className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3.5 sm:py-4 bg-white border-2 border-slate-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none shadow-sm transition-all"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="flex items-center gap-3 w-full lg:w-auto shrink-0">
                  <button onClick={handleExportPDF} className="flex-1 lg:flex-none bg-slate-900 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] flex items-center justify-center gap-2 hover:bg-black transition-all shadow-xl">
                     <FileDown size={18} /> Export PDF Audit
                  </button>
               </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-left min-w-[1000px]">
                  <thead className="bg-slate-50/50 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
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
                        <tr key={sale._id} className="hover:bg-indigo-50/30 transition-all cursor-pointer group">
                           <td className="px-8 py-6 font-mono text-[10px] font-black text-indigo-600">{sale._id}</td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Package size={18} className="text-slate-300" />
                                 </div>
                                 <p className="font-black text-slate-800 text-sm tracking-tight uppercase">{sale.productName}</p>
                              </div>
                           </td>
                           <td className="px-8 py-6">
                              <div className="flex items-center gap-2 text-slate-600 font-bold text-sm uppercase">
                                 <User size={14} className="text-slate-300" />
                                 {sale.customer}
                              </div>
                           </td>
                           <td className="px-8 py-6 text-center">
                              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                                 x{sale.qty}
                              </span>
                           </td>
                           <td className="px-8 py-6 text-right font-black text-slate-900 text-base">{currency.symbol}{sale.total.toLocaleString()}</td>
                           <td className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{sale.date}</td>
                           <td className="px-8 py-6 text-right">
                              <MoreHorizontal size={20} className="text-slate-300 hover:text-indigo-600 cursor-pointer" />
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
   );
};
