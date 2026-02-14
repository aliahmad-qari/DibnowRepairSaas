import React, { useState, useEffect, useMemo } from 'react';
import {
   Package, Search, Trash2, Edit2, ShoppingCart, X, Save,
   ChevronLeft, Loader2, Image as ImageIcon, DollarSign,
   Tag, Layers, Hash, Boxes, Info, AlertTriangle, CheckCircle2,
   TrendingUp, Activity, BarChart3, Clock, User, ClipboardList,
   ArrowRight, ShieldCheck, History, Eye, Receipt, FileText,
   Paperclip, Target, RefreshCcw, TrendingDown, Layout,
   Plus, AlertOctagon, Terminal, FileDown, ExternalLink, ShieldAlert,
   /* FIX: Added missing Wrench icon import */
   Wrench
} from 'lucide-react';
import {
   ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend
} from 'recharts';
import { db } from '../../api/db';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'];

export const AllStock: React.FC = () => {
   const navigate = useNavigate();
   const { currency } = useCurrency();
   const [items, setItems] = useState<any[]>([]);
   const [searchTerm, setSearchTerm] = useState('');

   // UI States
   const [editingItem, setEditingItem] = useState<any | null>(null);
   const [isSelling, setIsSelling] = useState<any | null>(null);
   const [sellForm, setSellForm] = useState({ qty: 1, price: 0, customer: '' });
   const [isProcessing, setIsProcessing] = useState(false);

   // NEW: Detail Analysis State
   const [selectedStockDetail, setSelectedStockDetail] = useState<any | null>(null);

   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const loadItems = async () => {
         setIsLoading(true);
         try {
            const data = await callBackendAPI('/inventory', null, 'GET');
            setItems(data || []);
         } catch (error) {
            console.error('Failed to load inventory:', error);
         } finally {
            setIsLoading(false);
         }
      };
      loadItems();
      window.addEventListener('storage', loadItems);
      return () => window.removeEventListener('storage', loadItems);
   }, []);

   // Sync sell form price when an item is selected for selling
   useEffect(() => {
      if (isSelling) {
         setSellForm({
            qty: 1,
            price: isSelling.price,
            customer: ''
         });
      }
   }, [isSelling]);

   const handleDelete = async (id: string) => {
      if (window.confirm("Remove this item permanently from the stock ledger?")) {
         try {
            await callBackendAPI(`/inventory/${id}`, null, 'DELETE');
            const data = await callBackendAPI('/inventory', null, 'GET');
            setItems(data || []);
         } catch (error) {
            console.error('Failed to delete item:', error);
         }
      }
   };

   const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingItem) return;
      try {
         await callBackendAPI(`/inventory/${editingItem._id}`, editingItem, 'PUT');
         setEditingItem(null);
         const data = await callBackendAPI('/inventory', null, 'GET');
         setItems(data || []);
      } catch (error) {
         console.error('Failed to update asset node:', error);
      }
   };

   const handleSellSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isSelling || isProcessing) return;

      setIsProcessing(true);
      try {
         const saleData = {
            productId: isSelling._id,
            productName: isSelling.name,
            qty: sellForm.qty,
            price: sellForm.price,
            total: sellForm.qty * sellForm.price,
            customer: sellForm.customer,
            date: new Date().toISOString()
         };

         const response = await callBackendAPI('/sales', saleData, 'POST');
         if (response) {
            setIsSelling(null);
            setSellForm({ qty: 1, price: 0, customer: '' });
            // Refresh items
            const data = await callBackendAPI('/inventory', null, 'GET');
            setItems(data || []);
         }
      } catch (error) {
         console.error('Transaction failed:', error);
         alert("Transaction failed. Check stock availability.");
      } finally {
         setIsProcessing(false);
      }
   };

   const filteredItems = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchTerm.toLowerCase())
   );

   // NEW: READ-ONLY DETAIL ANALYSIS ENGINE
   const detailAnalysis = useMemo(() => {
      if (!selectedStockDetail) return null;
      const allSales = db.sales.getAll();
      const allRepairs = db.repairs.getAll();
      const allActivity = db.activity.getAll();

      // 1. Transaction Mapping
      const itemSales = allSales.filter(s => s.productId === selectedStockDetail._id || s.productId === selectedStockDetail.id);
      const itemLogs = allActivity.filter(l => l.refId === selectedStockDetail._id || l.refId === selectedStockDetail.id);

      // Repair usage simulation (finding parts used in repair description or meta if exists)
      const itemRepairUsage = allRepairs.filter(r =>
         r.description?.toLowerCase().includes(selectedStockDetail.name.toLowerCase()) ||
         r.internalNotes?.toLowerCase().includes(selectedStockDetail.sku?.toLowerCase())
      );

      // 2. Performance Metrics
      const totalSold = itemSales.reduce((acc, s) => acc + s.qty, 0);
      const totalRepairUsed = itemRepairUsage.length;
      const totalRevenue = itemSales.reduce((acc, s) => acc + s.total, 0);
      const costPerUnit = selectedStockDetail.actualCost || (selectedStockDetail.price * 0.6);
      const totalProfit = itemSales.reduce((acc, s) => acc + (s.price - costPerUnit) * s.qty, 0);
      const margin = selectedStockDetail.price > 0 ? ((selectedStockDetail.price - costPerUnit) / selectedStockDetail.price) * 100 : 0;

      // 3. Velocity & Reorder Forecasting
      const firstSaleDate = itemSales.length > 0 ? new Date(itemSales[itemSales.length - 1].date) : new Date();
      const daysActive = Math.max(1, Math.floor((new Date().getTime() - firstSaleDate.getTime()) / (1000 * 3600 * 24)));
      const dailyVelocity = (totalSold + totalRepairUsed) / daysActive;
      const daysRemaining = dailyVelocity > 0 ? Math.floor(selectedStockDetail.stock / dailyVelocity) : 999;

      // 4. Timeline Construction (The Ledger View)
      const timeline = [
         ...itemSales.map(s => ({
            type: 'SALE',
            qty: -s.qty,
            date: s.date,
            user: 'POS Terminal',
            ref: `INV-${s.id.slice(-4)}`,
            color: 'text-blue-600',
            icon: ShoppingCart
         })),
         ...itemRepairUsage.map(r => ({
            type: 'REPAIR',
            qty: -1,
            date: r.date,
            user: r.assignedTo || 'Technician',
            ref: r.trackingId || `RPR-${r.id.slice(-4)}`,
            color: 'text-amber-600',
            icon: Wrench
         })),
         ...itemLogs.map(l => ({
            type: l.actionType === 'Stock Item Added' ? 'ADDED' : 'ADJUST',
            qty: l.actionType === 'Stock Item Added' ? selectedStockDetail.stock + totalSold : 0,
            date: new Date(l.timestamp).toLocaleDateString(),
            user: l.userName || 'System',
            ref: `LOG-${l.id.slice(-4)}`,
            color: l.actionType === 'Stock Item Added' ? 'text-emerald-600' : 'text-slate-600',
            icon: l.actionType === 'Stock Item Added' ? Plus : History
         }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return {
         totalSold,
         totalRevenue,
         totalProfit,
         margin,
         dailyVelocity,
         daysRemaining,
         timeline,
         totalRepairUsed,
         costPerUnit,
         usageData: [
            { name: 'Sold', value: totalSold },
            { name: 'Repairs', value: totalRepairUsed },
            { name: 'Stock', value: selectedStockDetail.stock },
         ]
      };
   }, [selectedStockDetail]);

   return (
      <div className="space-y-8 pb-32 animate-in fade-in duration-500">
         {/* Header Area */}
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 shadow-sm transition-all">
                  <ChevronLeft size={20} />
               </button>
               <div>
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">Complete Stock Ledger</h1>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                     <Info size={12} className="text-blue-500" />
                     Real-time Asset Scrutiny & Node Analysis
                  </p>
               </div>
            </div>
            <div className="relative flex-1 max-w-md w-full">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input
                  type="text"
                  placeholder="Query warehouse database..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 text-sm font-bold shadow-sm transition-all"
               />
            </div>
         </div>

         {/* Main Grid */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 relative min-h-[400px]">
            {isLoading && (
               <div className="absolute inset-0 z-[300] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
               </div>
            )}
            {filteredItems.map(item => (
               <div key={item._id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group flex flex-col h-full">
                  <div className="relative aspect-square bg-slate-50 overflow-hidden">
                     {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                           <ImageIcon size={64} strokeWidth={1} />
                        </div>
                     )}
                     <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 duration-300">
                        <button onClick={() => setEditingItem(item)} className="p-3 bg-white/90 backdrop-blur text-blue-600 rounded-2xl shadow-xl hover:bg-blue-600 hover:text-white transition-all" title="Edit Metadata"><Edit2 size={16} /></button>
                        <button onClick={() => setSelectedStockDetail(item)} className="p-3 bg-white/90 backdrop-blur text-indigo-600 rounded-2xl shadow-xl hover:bg-indigo-600 hover:text-white transition-all" title="Detailed Analysis"><Terminal size={16} /></button>
                        <button onClick={() => handleDelete(item._id)} className="p-3 bg-white/90 backdrop-blur text-rose-600 rounded-2xl shadow-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                     </div>
                     {item.stock <= 5 && item.stock > 0 && (
                        <div className="absolute bottom-4 left-4 bg-amber-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase shadow-lg animate-pulse">Low Stock</div>
                     )}
                     {item.stock === 0 && (
                        <div className="absolute bottom-4 left-4 bg-rose-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase shadow-lg">Out of Stock</div>
                     )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                     <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                           <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg">{item.brand || 'No Brand'}</span>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.sku}</span>
                        </div>
                        <h3 className="text-base font-black text-slate-800 tracking-tight truncate leading-tight">{item.name}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{item.category}</p>
                     </div>

                     <div className="mt-6 pt-5 border-t border-slate-50 flex items-center justify-between">
                        <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Asset Value</p>
                           <p className="text-xl font-black text-slate-900 tracking-tighter">{currency.symbol}{item.price.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Inventory</p>
                           <p className="text-sm font-black text-blue-600">{item.stock} Units</p>
                        </div>
                     </div>

                     <button
                        disabled={item.stock <= 0}
                        onClick={() => setIsSelling(item)}
                        className={`w-full mt-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all ${item.stock > 0 ? 'bg-slate-900 text-white hover:bg-black hover:scale-[1.02] shadow-xl active:scale-95' : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'}`}
                     >
                        <ShoppingCart size={14} /> Quick Liquidate
                     </button>
                  </div>
               </div>
            ))}
         </div>

         {/* MODAL: STOCK INTELLIGENCE & LIFECYCLE AUDIT (NEW FEATURE) */}
         {selectedStockDetail && detailAnalysis && (
            <div className="fixed inset-0 z-[300] flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
               <div className="fixed inset-0" onClick={() => setSelectedStockDetail(null)} />
               <div className="bg-white w-full max-w-4xl h-full shadow-[0_0_100px_rgba(0,0,0,0.2)] animate-in slide-in-from-right duration-500 flex flex-col relative z-10 overflow-hidden rounded-l-[3rem]">

                  {/* Header */}
                  <div className="p-8 md:p-10 border-b border-slate-50 flex items-center justify-between shrink-0 bg-slate-50/20">
                     <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 p-1">
                           {selectedStockDetail.image ? <img src={selectedStockDetail.image} className="w-full h-full object-cover rounded-2xl" /> : <Package size={40} className="m-4 text-slate-200" />}
                        </div>
                        <div>
                           <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">{selectedStockDetail.name}</h2>
                           <div className="flex items-center gap-4 mt-2">
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100">SKU: {selectedStockDetail.sku}</span>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedStockDetail.category}</span>
                           </div>
                        </div>
                     </div>
                     <button onClick={() => setSelectedStockDetail(null)} className="p-4 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-600 shadow-sm transition-all"><X size={24} /></button>
                  </div>

                  {/* Scrollable Intelligence Body */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10 space-y-12 bg-white">

                     {/* 1. KEY ANALYTICS STRIP */}
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-indigo-200 transition-all">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Treasury Value</p>
                           <h4 className="text-2xl font-black text-slate-800">{currency.symbol}{(selectedStockDetail.stock * selectedStockDetail.price).toLocaleString()}</h4>
                           <span className="text-[8px] font-bold text-slate-400 uppercase">Capital Node</span>
                        </div>
                        <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 group hover:border-emerald-200 transition-all">
                           <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Net ROI Index</p>
                           <h4 className="text-2xl font-black text-emerald-900">{detailAnalysis.margin.toFixed(1)}%</h4>
                           <span className="text-[8px] font-bold text-emerald-500 uppercase">Yield Multiplier</span>
                        </div>
                        <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 group hover:border-blue-200 transition-all">
                           <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Repairs Used</p>
                           <h4 className="text-2xl font-black text-blue-900">{detailAnalysis.totalRepairUsed}</h4>
                           <span className="text-[8px] font-bold text-blue-500 uppercase">Internal Overhead</span>
                        </div>
                        <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 group hover:border-indigo-200 transition-all">
                           <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Sales Velocity</p>
                           <h4 className="text-2xl font-black text-indigo-900">{detailAnalysis.dailyVelocity.toFixed(2)}</h4>
                           <span className="text-[8px] font-bold text-indigo-500 uppercase">Units / Day</span>
                        </div>
                     </div>

                     {/* 2. FORECASTING & USAGE GRID */}
                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-7 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl">
                           <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700"><Target size={200} /></div>
                           <div className="relative z-10 space-y-8">
                              <div className="flex items-center gap-4">
                                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><Activity size={24} /></div>
                                 <div>
                                    <h4 className="text-lg font-black uppercase tracking-widest">Autonomous Forecasting</h4>
                                    <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Sales Node Projection</p>
                                 </div>
                              </div>

                              <div className="space-y-4">
                                 <div className="flex justify-between items-end">
                                    <p className="text-4xl font-black tracking-tighter">{detailAnalysis.daysRemaining} <span className="text-sm uppercase opacity-50">Days Remaining</span></p>
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${detailAnalysis.daysRemaining < 10 ? 'bg-rose-500 text-white animate-pulse' : 'bg-white/10 text-indigo-300'}`}>
                                       {detailAnalysis.daysRemaining < 10 ? 'Critical Depletion' : 'Status Nominal'}
                                    </span>
                                 </div>
                                 <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden border border-white/5 p-0.5">
                                    <div
                                       className={`h-full transition-all duration-1000 rounded-full ${detailAnalysis.daysRemaining < 10 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                       style={{ width: `${Math.min(100, (detailAnalysis.daysRemaining / 60) * 100)}%` }}
                                    />
                                 </div>
                              </div>

                              <div className="pt-8 border-t border-white/5 grid grid-cols-2 gap-8">
                                 <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Unit Cost Node</p>
                                    <p className="text-xl font-black">{currency.symbol}{detailAnalysis.costPerUnit.toLocaleString()}</p>
                                 </div>
                                 <div>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Performance Yield</p>
                                    <p className="text-xl font-black text-emerald-400">{currency.symbol}{detailAnalysis.totalProfit.toLocaleString()}</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="lg:col-span-5 bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm flex flex-col justify-center items-center text-center">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Utilization Breakdown</h4>
                           <div className="h-48 w-full relative">
                              <ResponsiveContainer width="100%" height="100%">
                                 <PieChart>
                                    <Pie
                                       data={detailAnalysis.usageData}
                                       cx="50%"
                                       cy="50%"
                                       innerRadius={55}
                                       outerRadius={75}
                                       paddingAngle={8}
                                       dataKey="value"
                                    >
                                       {detailAnalysis.usageData.map((_, index) => (
                                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                       ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} />
                                 </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                 <span className="text-2xl font-black text-slate-800">{selectedStockDetail.stock + detailAnalysis.totalSold + detailAnalysis.totalRepairUsed}</span>
                                 <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total Flow</span>
                              </div>
                           </div>
                           <div className="flex flex-wrap justify-center gap-4 mt-8">
                              {detailAnalysis.usageData.map((d, i) => (
                                 <div key={i} className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{d.name}: {d.value}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     {/* 3. STOCK LIFECYCLE TIMELINE (THE AUDIT) */}
                     <div className="space-y-8">
                        <div className="flex items-center justify-between px-2">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner"><History size={20} /></div>
                              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Asset Lifecycle Audit</h3>
                           </div>
                           <button className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-100 hover:border-indigo-600 transition-all">
                              <FileDown size={14} /> Export Node Ledger
                           </button>
                        </div>

                        <div className="bg-slate-50/50 rounded-[3rem] border border-slate-100 p-8 space-y-0 relative">
                           <div className="absolute left-16 top-12 bottom-12 w-0.5 bg-slate-200" />

                           {detailAnalysis.timeline.length === 0 ? (
                              <div className="py-20 text-center text-slate-300">
                                 <History size={48} className="mx-auto mb-4 opacity-10" />
                                 <p className="text-[10px] font-black uppercase tracking-widest">No historical node events identified.</p>
                              </div>
                           ) : detailAnalysis.timeline.map((event, i) => (
                              <div key={i} className="relative flex gap-8 group animate-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                 <div className="flex flex-col items-center">
                                    <div className={`w-14 h-14 rounded-2xl ${event.color} bg-white shadow-xl border border-slate-100 flex items-center justify-center z-10 group-hover:scale-110 transition-transform duration-500`}>
                                       <event.icon size={22} />
                                    </div>
                                    <div className="h-full w-0" />
                                 </div>
                                 <div className="flex-1 pb-10">
                                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50 group-hover:shadow-md transition-all">
                                       <div className="flex justify-between items-start mb-2">
                                          <div>
                                             <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${event.color} bg-white border border-slate-100 shadow-sm`}>{event.type}</span>
                                             <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight mt-1">{event.qty > 0 ? `+${event.qty}` : event.qty} Units Operation</h5>
                                          </div>
                                          <div className="text-right">
                                             <p className="text-[9px] font-black text-slate-400 uppercase">{event.date}</p>
                                             <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-tighter mt-1">Ref: {event.ref}</p>
                                          </div>
                                       </div>
                                       <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50">
                                          <div className="flex items-center gap-2">
                                             <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black">{event.user.charAt(0)}</div>
                                             <span className="text-[9px] font-bold text-slate-500 uppercase">Actor: {event.user}</span>
                                          </div>
                                          <button className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><ExternalLink size={14} /></button>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>

                     {/* 4. ATTACHMENTS, NOTES & FLAGS */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2"><FileText size={14} /> Technical Registry Notes</h4>
                           <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm space-y-6">
                              <div className="p-6 bg-slate-50 rounded-2xl italic text-slate-600 text-xs leading-relaxed border-l-4 border-indigo-500">
                                 "{selectedStockDetail.description || 'No critical technical metadata provided for this asset node. Operational guidelines remain standard.'}"
                              </div>

                              <div className="space-y-3">
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Behavioral Indicators</p>
                                 <div className="flex flex-wrap gap-2">
                                    {[
                                       { label: 'Fragile Components', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
                                       { label: 'High Return Potential', icon: RefreshCcw, color: 'text-rose-600 bg-rose-50' },
                                       { label: 'Fast Depletion', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' }
                                    ].map((flag, i) => (
                                       <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-transparent hover:border-slate-200 cursor-default transition-all ${flag.color}`}>
                                          <flag.icon size={12} />
                                          <span className="text-[8px] font-black uppercase tracking-widest">{flag.label}</span>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2"><Paperclip size={14} /> Document Vault</h4>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="aspect-[4/3] bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group hover:border-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer">
                                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-300 group-hover:text-indigo-600 group-hover:scale-110 transition-all mb-3"><Receipt size={24} /></div>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-indigo-600">Supplier Invoice</span>
                              </div>
                              <div className="aspect-[4/3] bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer">
                                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-300 group-hover:text-blue-600 group-hover:scale-110 transition-all mb-3"><ShieldCheck size={24} /></div>
                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-blue-600">Warranty Docs</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                     <button onClick={() => { setEditingItem(selectedStockDetail); setSelectedStockDetail(null); }} className="flex-1 py-5 bg-white border border-slate-200 text-slate-700 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-3 active:scale-95"><Edit2 size={16} /> Modify Registry Metadata</button>
                     <button disabled={selectedStockDetail.stock <= 0} onClick={() => { setIsSelling(selectedStockDetail); setSelectedStockDetail(null); }} className="flex-1 py-5 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"><ShoppingCart size={16} /> Liquidate From Node</button>
                  </div>
               </div>
            </div>
         )}

         {/* Edit Form Modal */}
         {editingItem && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 overflow-y-auto">
               <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
                  <div className="bg-blue-600 p-8 text-white flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                           <Edit2 size={24} />
                        </div>
                        <div>
                           <h2 className="text-xl font-black uppercase tracking-widest">Edit Asset metadata</h2>
                           <p className="text-[10px] font-bold text-blue-100 uppercase mt-1 tracking-widest opacity-80">Universal Ledger Update Protocol</p>
                        </div>
                     </div>
                     <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={24} />
                     </button>
                  </div>

                  <form onSubmit={handleEditSubmit} className="p-10 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Asset Title</label>
                           <div className="relative">
                              <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input required type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Universal SKU</label>
                           <div className="relative">
                              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input required type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm" value={editingItem.sku} onChange={e => setEditingItem({ ...editingItem, sku: e.target.value })} />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Stock Position</label>
                           <div className="relative">
                              <Boxes className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input required type="number" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm" value={editingItem.stock} onChange={e => setEditingItem({ ...editingItem, stock: parseInt(e.target.value) || 0 })} />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Unit Price ({currency.code})</label>
                           <div className="relative">
                              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                              <input required type="number" step="0.01" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold text-sm" value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })} />
                           </div>
                        </div>
                     </div>

                     <div className="pt-8 border-t border-slate-100 flex gap-4">
                        <button type="submit" className="flex-1 bg-blue-600 text-white font-black py-5 rounded-[1.5rem] shadow-2xl hover:bg-blue-700 transition-all uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3">
                           <Save size={18} /> Authorize Ledger Synchronization
                        </button>
                        <button type="button" onClick={() => setEditingItem(null)} className="px-10 py-5 bg-slate-100 text-slate-500 font-black rounded-[1.5rem] hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]">
                           Cancel
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* Sell Modal */}
         {isSelling && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
               <div className="bg-white w-full max-w-lg rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[95vh]">
                  <div className="bg-[#10b981] p-5 sm:p-8 text-white flex items-center justify-between shrink-0">
                     <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/20 backdrop-blur-sm shrink-0">
                           <ShoppingCart size={20} />
                        </div>
                        <div>
                           <h2 className="text-base sm:text-xl font-black uppercase tracking-widest leading-none">Register Quick Sale</h2>
                           <p className="text-[8px] sm:text-[10px] font-bold text-emerald-100 uppercase mt-1 sm:mt-2 tracking-widest opacity-80">Immediate Liquidation Protocol</p>
                        </div>
                     </div>
                     <button onClick={() => setIsSelling(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors shrink-0">
                        <X size={20} />
                     </button>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                     <form onSubmit={handleSellSubmit} className="p-6 sm:p-10 space-y-6 sm:space-y-8">
                        <div className="bg-slate-50 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 flex items-center gap-4 sm:gap-5">
                           <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 shrink-0">
                              {isSelling.image ? (
                                 <img src={isSelling.image} alt={isSelling.name} className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                 <ImageIcon size={24} className="sm:w-8 sm:h-8 text-slate-300" />
                              )}
                           </div>
                           <div className="min-w-0">
                              <h4 className="text-base sm:text-lg font-black text-slate-800 tracking-tight truncate">{isSelling.name}</h4>
                              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Available Liquidity: <span className="text-emerald-600">{isSelling.stock} Units</span></p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                           <div className="space-y-1.5">
                              <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Liquidation Quantity</label>
                              <div className="relative">
                                 <Boxes className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                 <input
                                    required
                                    type="number"
                                    min="1"
                                    max={isSelling.stock}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 font-black text-base sm:text-lg"
                                    value={sellForm.qty}
                                    onChange={e => setSellForm({ ...sellForm, qty: parseInt(e.target.value) || 1 })}
                                 />
                              </div>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sale Price per Unit</label>
                              <div className="relative">
                                 <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                 <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 font-black text-base sm:text-lg"
                                    value={sellForm.price}
                                    onChange={e => setSellForm({ ...sellForm, price: parseFloat(e.target.value) || 0 })}
                                 />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Identification (Optional)</label>
                           <input
                              type="text"
                              placeholder="Walk-in Customer"
                              className="w-full px-5 py-3 sm:py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/5 font-bold text-sm"
                              value={sellForm.customer}
                              onChange={e => setSellForm({ ...sellForm, customer: e.target.value })}
                           />
                        </div>

                        <div className="bg-emerald-50 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-emerald-100 flex items-center justify-between shadow-inner relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                              <DollarSign size={64} className="sm:w-20 sm:h-20 text-emerald-600" />
                           </div>
                           <div className="relative z-10">
                              <p className="text-[9px] sm:text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Total Settlement Value</p>
                              <p className="text-2xl sm:text-4xl font-black text-emerald-900 tracking-tighter">{currency.symbol}{(sellForm.qty * sellForm.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                           </div>
                           <CheckCircle2 size={24} className="sm:w-8 sm:h-8 text-emerald-500 shrink-0 relative z-10" />
                        </div>

                        <button
                           type="submit"
                           disabled={isProcessing}
                           className="w-full bg-[#10b981] text-white font-black py-4 sm:py-6 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl shadow-emerald-200 hover:bg-emerald-600 transition-all uppercase tracking-[0.1em] sm:tracking-[0.3em] text-[10px] sm:text-[11px] flex items-center justify-center gap-3 sm:gap-4 group active:scale-95"
                        >
                           {isProcessing ? (
                              <><Loader2 className="animate-spin" size={18} /> Transmitting...</>
                           ) : (
                              <><CheckCircle2 size={18} /> Authorize Transaction</>
                           )}
                        </button>
                     </form>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};