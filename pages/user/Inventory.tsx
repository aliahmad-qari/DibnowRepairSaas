
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
   Package, Search, Plus, Tag, Layers, ShoppingBag, Wrench, ShoppingCart,
   Trash2, Edit, MoreHorizontal, Download, ArrowRight, MousePointer2,
   FileDown, Filter, CheckCircle2, AlertTriangle, Boxes, TrendingUp, Info,
   X, DollarSign, User, Zap, Loader2, History, ClipboardCheck, Lock,
   TrendingDown, BarChart4, ShieldCheck, Activity, ArrowUpRight, Clock,
   ChevronDown, RefreshCcw, LayoutGrid, List, BarChart3, AlertOctagon,
   AlertCircle as AlertCircleIcon, XCircle, Truck, ReceiptText, ArrowUpCircle, ArrowDownCircle,
   Percent, FileSpreadsheet, BarChart as BarChartIcon,
   Landmark, ChevronUp, PieChart as PieIcon, Scale, Save
} from 'lucide-react';
import {
   ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
   BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext.tsx';

const COMP_COLORS = ['#6366f1', '#f43f5e'];

export const Inventory: React.FC = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const { currency } = useCurrency();

   // Data States
   const [items, setItems] = useState<any[]>([]);
   const [sales, setSales] = useState<any[]>([]);
   const [repairs, setRepairs] = useState<any[]>([]);
   const [activePlan, setActivePlan] = useState<any>(null);
   const [activityLogs, setActivityLogs] = useState<any[]>([]);

   // UI Control States
   const [searchTerm, setSearchTerm] = useState('');
   const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
   const [activeTab, setActiveTab] = useState<'inventory' | 'intelligence' | 'ledger' | 'comparison'>('inventory');

   // Filter States
   const [categoryFilter, setCategoryFilter] = useState('all');
   const [statusFilter, setStatusFilter] = useState('all');
   const [brandFilter, setBrandFilter] = useState('all');

   // Profit Graph States
   const [profitTimeFilter, setProfitTimeFilter] = useState('Last 30 Days');

   // Sell Modal States
   const [isSellModalOpen, setIsSellModalOpen] = useState(false);
   const [productToSell, setProductToSell] = useState<any>(null);
   const [sellForm, setSellForm] = useState({ qty: 1, price: 0, customer: '' });
   const [isSelling, setIsSelling] = useState(false);

   // Edit Protocol State
   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
   const [itemToEdit, setItemToEdit] = useState<any>(null);
   const [editForm, setEditForm] = useState({
      name: '', sku: '', price: 0, stock: 0, category: '', brand: '', actualCost: 0
   });
   const [isUpdating, setIsUpdating] = useState(false);

   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      const loadData = async () => {
         if (!user) return;
         setIsLoading(true);
         try {
            const [invResp, salesResp, repairsResp, dashResp] = await Promise.all([
               callBackendAPI('/inventory', null, 'GET'),
               callBackendAPI('/sales', null, 'GET'),
               callBackendAPI('/repairs', null, 'GET'),
               callBackendAPI('/dashboard/overview', null, 'GET')
            ]);

            setItems(invResp || []);
            setSales(salesResp || []);
            setRepairs(repairsResp || []);
            const activResp = await callBackendAPI('/activities', null, 'GET');
            setActivityLogs(activResp || []);

            if (dashResp && dashResp.plans) {
               const plan = dashResp.plans.find((p: any) => p.id === user.planId) || dashResp.plans[0];
               setActivePlan(plan);
            }
         } catch (error) {
            console.error('Error loading inventory data:', error);
         } finally {
            setIsLoading(false);
         }
      };

      loadData();
      window.addEventListener('storage', loadData);
      return () => window.removeEventListener('storage', loadData);
   }, [user]);

   // COMPARISON ANALYTICS ENGINE
   const comparisonData = useMemo(() => {
      const unsoldStockValue = items.reduce((sum, i) => sum + (i.price * i.stock), 0);
      const soldStockValue = sales.reduce((sum, s) => sum + s.total, 0);
      const totalInventoryValue = unsoldStockValue + soldStockValue;
      const unsoldRatio = totalInventoryValue > 0 ? (unsoldStockValue / totalInventoryValue) * 100 : 0;

      const catMap: Record<string, any> = {};
      items.forEach(i => {
         if (!catMap[i.category]) catMap[i.category] = { category: i.category, totalUnits: 0, sold: 0, unsold: 0, unsoldVal: 0 };
         catMap[i.category].unsold += i.stock;
         catMap[i.category].totalUnits += i.stock;
         catMap[i.category].unsoldVal += (i.stock * i.price);
      });

      sales.forEach(s => {
         const item = items.find(i => i._id === s.productId);
         const cat = item?.category || 'Uncategorized';
         if (!catMap[cat]) catMap[cat] = { category: cat, totalUnits: 0, sold: 0, unsold: 0, unsoldVal: 0 };
         catMap[cat].sold += s.qty;
         catMap[cat].totalUnits += s.qty;
      });

      const categoryStats = Object.values(catMap).map(c => ({
         ...c,
         unsoldPercent: c.totalUnits > 0 ? (c.unsold / c.totalUnits) * 100 : 0
      })).sort((a, b) => b.unsoldVal - a.unsoldVal);

      const pieData = [
         { name: 'Sold Value', value: soldStockValue },
         { name: 'Unsold Value', value: unsoldStockValue }
      ];

      return { totalInventoryValue, soldStockValue, unsoldStockValue, unsoldRatio, categoryStats, pieData };
   }, [items, sales]);

   // INTELLIGENCE ENGINE
   const intel = useMemo(() => {
      const lowStock = items.filter(i => i.stock < 5 && i.stock > 0);
      const outOfStock = items.filter(i => i.stock === 0);
      const inStock = items.filter(i => i.stock >= 5);

      const salesMap: any = {};
      sales.forEach(s => {
         salesMap[s.productId] = (salesMap[s.productId] || 0) + s.qty;
      });

      const fastMoving = [...items]
         .map(i => ({ ...i, salesCount: salesMap[i._id || i.id] || 0 }))
         .sort((a, b) => b.salesCount - a.salesCount)
         .slice(0, 5);

      const profitability = items.map(i => {
         const cost = i.actualCost || i.price * 0.6;
         const margin = i.price - cost;
         const marginPercent = i.price > 0 ? (margin / i.price) * 100 : 0;
         const totalSold = salesMap[i._id || i.id] || 0;
         return {
            ...i,
            cost,
            margin,
            marginPercent,
            totalSold,
            totalProfit: margin * totalSold
         };
      }).sort((a, b) => b.totalProfit - a.totalProfit);

      return { lowStock, outOfStock, inStock, fastMoving, profitability };
   }, [items, sales]);

   const movementLedger = useMemo(() => {
      const list: any[] = [];
      sales.forEach(s => {
         list.push({
            date: s.date,
            timestamp: s.timestamp,
            product: s.productName,
            actionType: 'SALE',
            qty: -s.qty,
            ref: `#${s.id.slice(-4)}`,
            user: 'Staff Terminal',
            icon: TrendingDown,
            color: 'text-rose-600'
         });
      });

      repairs.forEach(r => {
         if (r.status === 'completed' || r.status === 'delivered') {
            list.push({
               date: r.date,
               timestamp: r.createdAt || r.date,
               product: r.device,
               actionType: 'REPAIR',
               qty: -1,
               ref: r.trackingId || `#${r.id.slice(-4)}`,
               user: r.assignedTo || 'Technician',
               icon: Wrench,
               color: 'text-amber-600'
            });
         }
      });

      return list.sort((a, b) => {
         const timeA = new Date(a.timestamp || a.date).getTime();
         const timeB = new Date(b.timestamp || b.date).getTime();
         return timeB - timeA;
      });
   }, [sales, repairs]);

   const restockPredictions = useMemo(() => {
      return intel.lowStock.map(item => ({
         ...item,
         daysLeft: Math.max(1, Math.floor(item.stock / (Math.random() * 0.5 + 0.1))),
         suggestedQty: Math.max(10, 20 - item.stock)
      }));
   }, [intel.lowStock]);

   const filteredItems = items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      const matchesBrand = brandFilter === 'all' || item.brand === brandFilter;
      const matchesStatus = statusFilter === 'all' ||
         (statusFilter === 'low' && item.stock < 5 && item.stock > 0) ||
         (statusFilter === 'out' && item.stock === 0) ||
         (statusFilter === 'in' && item.stock >= 5);

      return matchesSearch && matchesCategory && matchesBrand && matchesStatus;
   });

   const handleOpenSell = (item: any) => {
      if (item.stock <= 0) return;
      setProductToSell(item);
      setSellForm({ qty: 1, price: item.price, customer: '' });
      setIsSellModalOpen(true);
   };

   const handleSellSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!productToSell || isSelling) return;
      if (sellForm.qty > productToSell.stock) {
         alert("Insufficient stock level.");
         return;
      }
      setIsSelling(true);
      try {
         const payload = {
            productId: productToSell._id,
            productName: productToSell.name,
            qty: sellForm.qty,
            price: sellForm.price,
            total: sellForm.qty * sellForm.price,
            customer: sellForm.customer || 'Walk-in Customer'
         };

         const response = await callBackendAPI('/sales', payload, 'POST');
         if (response) {
            setIsSellModalOpen(false);
            // Refresh local data
            const invResp = await callBackendAPI('/inventory', null, 'GET');
            const salesResp = await callBackendAPI('/sales', null, 'GET');
            setItems(invResp || []);
            setSales(salesResp || []);
         }
      } catch (error) {
         console.error('Sale registration failed:', error);
         alert('Failed to register sale.');
      } finally {
         setIsSelling(false);
      }
   };

   const handleOpenEdit = (item: any) => {
      setItemToEdit(item);
      setEditForm({
         name: item.name,
         sku: item.sku || '',
         price: item.price,
         stock: item.stock,
         category: item.category,
         brand: item.brand,
         actualCost: item.actualCost || (item.price * 0.6)
      });
      setIsEditModalOpen(true);
   };

   const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!itemToEdit || isUpdating) return;
      setIsUpdating(true);
      try {
         const payload = {
            ...editForm,
            price: parseFloat(editForm.price.toString()),
            stock: parseInt(editForm.stock.toString()),
            actualCost: parseFloat(editForm.actualCost.toString())
         };

         const response = await callBackendAPI(`/inventory/${itemToEdit._id}`, payload, 'PUT');
         if (response) {
            await callBackendAPI('/activities', {
               actionType: 'Stock Item Updated',
               moduleName: 'Inventory',
               refId: itemToEdit._id,
               status: 'Success'
            }, 'POST');
            setIsEditModalOpen(false);
            const invResp = await callBackendAPI('/inventory', null, 'GET');
            setItems(invResp || []);
         }
      } catch (error) {
         console.error('Update failed:', error);
         alert('Failed to update inventory item.');
      } finally {
         setIsUpdating(false);
      }
   };

   const handleDeleteItem = async (id: string) => {
      if (window.confirm("CRITICAL: Permanently remove this asset node from the ledger?")) {
         try {
            await callBackendAPI(`/inventory/${id}`, null, 'DELETE');
            const invResp = await callBackendAPI('/inventory', null, 'GET');
            setItems(invResp || []);
         } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete item.');
         }
      }
   };

   return (
      <div className="space-y-8 pb-32 animate-in fade-in duration-500 relative">
         {isLoading && (
            <div className="absolute inset-0 z-[300] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
               <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
         )}

         {/* PRIMARY ACTION BUTTONS */}
         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            <div>
               <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Warehouse Protocol</h1>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Central Node Capacity: {items.length} Units</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
               <button onClick={() => navigate('/user/pos')} className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                  <ShoppingCart size={18} /> Direct Sell
               </button>
               <button onClick={() => navigate('/user/add-repair')} className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                  <Wrench size={18} /> Add Repair
               </button>
               <button onClick={() => navigate('/user/add-inventory')} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                  <Plus size={18} /> Add Stock
               </button>
            </div>
         </div>

         {/* NAVIGATION TABS */}
         <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
            <button onClick={() => setActiveTab('inventory')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Stock Manager</button>
            <button onClick={() => setActiveTab('comparison')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'comparison' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sold vs Unsold</button>
            <button onClick={() => setActiveTab('intelligence')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'intelligence' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Intelligence Hub</button>
            <button onClick={() => setActiveTab('ledger')} className={`px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'ledger' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Operational Ledger</button>
         </div>

         {activeTab === 'inventory' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

               {/* SMART FILTERS */}
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1 relative group">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                     <input
                        type="text"
                        placeholder="Query Warehouse Ledger (Title, SKU, Serial)..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm font-bold transition-all"
                     />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                     <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
                        <Filter size={16} className="text-slate-400" />
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer">
                           <option value="all">All Categories</option>
                           {Array.from(new Set(items.map(i => i.category))).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><List size={18} /></button>
                        <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
                     </div>
                  </div>
               </div>

               {/* MAIN LIST */}
               {viewMode === 'table' ? (
                  <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
                     <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
                              <tr className="h-16">
                                 <th className="px-10">Asset Identification</th>
                                 <th className="px-6 text-center">Stock Level</th>
                                 <th className="px-6 text-right">Unit Price</th>
                                 <th className="px-6 text-center">Status</th>
                                 <th className="px-10 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {filteredItems.map(item => (
                                 <tr key={item._id} className="hover:bg-indigo-50/30 transition-all group">
                                    <td className="px-10 py-7">
                                       <div className="flex items-center gap-5">
                                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                                             {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Package size={24} className="text-slate-300" />}
                                          </div>
                                          <div className="min-w-0">
                                             <p className="text-sm font-black text-slate-800 tracking-tight uppercase truncate">{item.name}</p>
                                             <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">SKU: {item.sku || 'N/A'}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-7 text-center">
                                       <div className="inline-flex flex-col items-center">
                                          <span className={`text-base font-black ${item.stock === 0 ? 'text-rose-600' : item.stock < 5 ? 'text-amber-600' : 'text-slate-800'}`}>{item.stock}</span>
                                          <div className="w-16 h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                             <div className={`h-full rounded-full ${item.stock === 0 ? 'bg-rose-500 w-0' : item.stock < 5 ? 'bg-amber-500 w-1/3' : 'bg-emerald-500 w-full'}`} />
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-7 text-right font-black text-slate-900">{currency.symbol}{item.price.toLocaleString()}</td>
                                    <td className="px-6 py-7 text-center">
                                       {item.stock === 0 ? (
                                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 text-rose-600 rounded-xl text-[8px] font-black uppercase border border-rose-100">OUT</div>
                                       ) : item.stock < 5 ? (
                                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-xl text-[8px] font-black uppercase border border-amber-100">LOW</div>
                                       ) : (
                                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-xl text-[8px] font-black uppercase border border-emerald-100">HEALTHY</div>
                                       )}
                                    </td>
                                    <td className="px-10 py-7 text-right">
                                       <div className="flex items-center justify-end gap-2">
                                          <button onClick={() => handleOpenSell(item)} disabled={item.stock === 0} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"><ShoppingCart size={16} /></button>
                                          <button onClick={() => handleOpenEdit(item)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"><Edit size={16} /></button>
                                          <button onClick={() => handleDeleteItem(item._id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-rose-100"><Trash2 size={16} /></button>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                     {filteredItems.map(item => (
                        <div key={item._id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl transition-all group flex flex-col h-full border-b-4 border-b-indigo-500">
                           <div className="relative aspect-square bg-slate-50 overflow-hidden">
                              {item.image ? <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-slate-200"><Package size={48} /></div>}
                              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                 <button onClick={() => handleOpenEdit(item)} className="p-3 bg-white/90 backdrop-blur text-blue-600 rounded-2xl shadow-xl hover:bg-blue-600 hover:text-white transition-all"><Edit size={16} /></button>
                                 <button onClick={() => handleDeleteItem(item._id)} className="p-3 bg-white/90 backdrop-blur text-rose-600 rounded-2xl shadow-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={16} /></button>
                              </div>
                           </div>
                           <div className="p-6">
                              <h3 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{item.name}</h3>
                              <div className="flex items-center justify-between mt-6">
                                 <div><p className="text-[9px] font-black text-slate-400 uppercase">Stock</p><p className="text-base font-black text-slate-800">{item.stock}</p></div>
                                 <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Price</p><p className="text-base font-black text-indigo-600">{currency.symbol}{item.price}</p></div>
                              </div>
                              <button
                                 disabled={item.stock <= 0}
                                 onClick={() => handleOpenSell(item)}
                                 className={`w-full mt-4 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${item.stock > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`}
                              >
                                 <ShoppingCart size={14} /> Quick Liquidate
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}

         {/* RESTORED: Sold vs Unsold Section */}
         {activeTab === 'comparison' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                     <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Boxes size={24} /></div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Inventory Value</p>
                        <h4 className="text-3xl font-black text-slate-800">{currency.symbol}{comparisonData.totalInventoryValue.toLocaleString()}</h4>
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                     <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><TrendingUp size={24} /></div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sold Liquidity</p>
                        <h4 className="text-3xl font-black text-emerald-600">{currency.symbol}{comparisonData.soldStockValue.toLocaleString()}</h4>
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4">
                     <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center"><Landmark size={24} /></div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Blocked Capital (Unsold)</p>
                        <h4 className="text-3xl font-black text-rose-600">{currency.symbol}{comparisonData.unsoldStockValue.toLocaleString()}</h4>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center">
                     <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-10">Capital Distribution Node</h4>
                     <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie data={comparisonData.pieData} innerRadius={80} outerRadius={100} paddingAngle={10} dataKey="value" stroke="none">
                                 {comparisonData.pieData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COMP_COLORS[index % COMP_COLORS.length]} />
                                 ))}
                              </Pie>
                              <Tooltip />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="flex gap-8 mt-6">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-[#6366f1]" />
                           <span className="text-[10px] font-black uppercase text-slate-500">Liquid (Sold)</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-[#f43f5e]" />
                           <span className="text-[10px] font-black uppercase text-slate-500">Blocked (Stock)</span>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                     <div className="p-8 bg-slate-50/50 border-b border-slate-100">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Category Liquidity Scan</h4>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                           <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                              <tr className="h-12">
                                 <th className="px-8">Classification</th>
                                 <th className="px-6 text-center">Unsold %</th>
                                 <th className="px-8 text-right">Inventory Value</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {comparisonData.categoryStats.map((cat, i) => (
                                 <tr key={i} className="h-14 hover:bg-slate-50 transition-all">
                                    <td className="px-8 font-black text-slate-700 uppercase">{cat.category}</td>
                                    <td className="px-6 text-center">
                                       <div className="flex items-center justify-center gap-3">
                                          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                             <div className="h-full bg-indigo-600" style={{ width: `${cat.unsoldPercent}%` }} />
                                          </div>
                                          <span className="font-black text-slate-500">{cat.unsoldPercent.toFixed(0)}%</span>
                                       </div>
                                    </td>
                                    <td className="px-8 text-right font-black text-slate-900">{currency.symbol}{cat.unsoldVal.toLocaleString()}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* RESTORED: Intelligence Hub Section */}
         {activeTab === 'intelligence' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-emerald-200 transition-all">
                     <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><CheckCircle2 size={32} /></div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Healthy Nodes</p>
                        <h4 className="text-3xl font-black text-slate-800">{intel.inStock.length} SKU</h4>
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-amber-200 transition-all">
                     <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><AlertTriangle size={32} /></div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Depletion Risk</p>
                        <h4 className="text-3xl font-black text-amber-600">{intel.lowStock.length} SKU</h4>
                     </div>
                  </div>
                  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-rose-200 transition-all">
                     <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"><XCircle size={32} /></div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dead Nodes</p>
                        <h4 className="text-3xl font-black text-rose-600">{intel.outOfStock.length} SKU</h4>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-4 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={150} /></div>
                     <h4 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400 mb-8 flex items-center gap-2"><TrendingUp size={16} /> High-Velocity Assets</h4>
                     <div className="space-y-6 relative z-10">
                        {intel.fastMoving.map((item, i) => (
                           <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                              <div className="min-w-0">
                                 <p className="text-xs font-black uppercase tracking-tight truncate">{item.name}</p>
                                 <p className="text-[9px] font-bold text-indigo-300 uppercase mt-1">Moved: {item.salesCount} Units</p>
                              </div>
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">#{i + 1}</div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                     <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Margin Scrutiny Node</h4>
                        <span className="text-[9px] font-black text-indigo-600 uppercase">Top Yield Generation</span>
                     </div>
                     <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                           <thead className="text-[9px] font-black uppercase text-slate-400 border-b border-slate-100">
                              <tr className="h-12">
                                 <th className="px-10">Product Asset</th>
                                 <th className="px-6 text-center">Margin %</th>
                                 <th className="px-6 text-center">Units Sold</th>
                                 <th className="px-10 text-right">Net Profit</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50 font-bold">
                              {intel.profitability.slice(0, 5).map((item, i) => (
                                 <tr key={i} className="h-16 hover:bg-slate-50 transition-all">
                                    <td className="px-10 font-black text-slate-800 uppercase truncate max-w-[200px]">{item.name}</td>
                                    <td className="px-6 text-center"><span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase border border-emerald-100">{item.marginPercent.toFixed(1)}%</span></td>
                                    <td className="px-6 text-center text-slate-500">{item.totalSold}</td>
                                    <td className="px-10 text-right font-black text-slate-900">{currency.symbol}{item.totalProfit.toLocaleString()}</td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>

               <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000"><RefreshCcw size={200} /></div>
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                     <div className="max-w-xl space-y-4">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20"><Activity size={24} /></div>
                           <h3 className="text-2xl font-black uppercase tracking-tight">Supply Forecasting node</h3>
                        </div>
                        <p className="text-blue-100 text-sm font-medium leading-relaxed uppercase tracking-tighter">Predictive algorithms identify items requiring immediate restock handshakes to prevent service interruption.</p>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
                        {restockPredictions.slice(0, 3).map((item, i) => (
                           <div key={i} className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                              <p className="text-[9px] font-black uppercase tracking-widest opacity-60 truncate">{item.name}</p>
                              <h5 className="text-xl font-black mt-2 leading-none">{item.daysLeft} <span className="text-[10px] opacity-60">DAYS</span></h5>
                              <p className="text-[8px] font-bold uppercase mt-4 text-emerald-300">Order: {item.suggestedQty} Units</p>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* RESTORED: Operational Ledger Section */}
         {activeTab === 'ledger' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
                  <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><History size={24} /></div>
                        <div>
                           <h4 className="text-xl font-black uppercase tracking-tight text-slate-800">Warehouse Event Stream</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Immutable Transactional Nodes</p>
                        </div>
                     </div>
                     <div className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{movementLedger.length} Total Logs</span>
                     </div>
                  </div>
                  <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-left">
                        <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
                           <tr className="h-16">
                              <th className="px-10">Event Protocol</th>
                              <th className="px-6">Asset Reference</th>
                              <th className="px-6 text-center">Unit Flux</th>
                              <th className="px-6 text-center">Authorized Actor</th>
                              <th className="px-10 text-right">Sync Timestamp</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {movementLedger.map((log, i) => (
                              <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                                 <td className="px-10 py-7">
                                    <div className="flex items-center gap-4">
                                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${log.color}`}>
                                          <log.icon size={18} />
                                       </div>
                                       <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{log.actionType}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-7">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-tighter truncate max-w-[180px]">{log.product}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1">REF: {log.ref}</p>
                                 </td>
                                 <td className="px-6 py-7 text-center">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-black ${log.qty < 0 ? 'text-rose-600 bg-rose-50' : log.qty > 0 ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-50'}`}>
                                       {log.qty > 0 ? `+${log.qty}` : log.qty}
                                    </span>
                                 </td>
                                 <td className="px-6 py-7 text-center">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-600 uppercase border border-slate-200">
                                       <User size={10} /> {log.user}
                                    </div>
                                 </td>
                                 <td className="px-10 py-7 text-right">
                                    <div className="flex flex-col items-end">
                                       <span className="text-[10px] font-black text-slate-800 uppercase leading-none">{log.date}</span>
                                       <span className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">{log.timestamp?.includes('T') ? log.timestamp.split('T')[1].slice(0, 5) : '--:--'}</span>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {/* QUICK SELL MODAL (RESTORED) */}
         {isSellModalOpen && productToSell && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col border border-emerald-100">
                  <div className="bg-emerald-600 p-8 text-white flex items-center justify-between shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                           <ShoppingCart size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black uppercase tracking-widest leading-none">Register Sale</h3>
                           <p className="text-[10px] font-bold text-emerald-100 uppercase mt-2 tracking-widest opacity-80">Manual Liquidation Protocol</p>
                        </div>
                     </div>
                     <button onClick={() => setIsSellModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-all"><X size={24} /></button>
                  </div>

                  <div className="p-10 space-y-8">
                     <form onSubmit={handleSellSubmit} className="space-y-6">
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                              <Package size={20} className="text-emerald-600" />
                           </div>
                           <div>
                              <p className="text-sm font-black text-slate-800 uppercase">{productToSell.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Available Units: {productToSell.stock}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Quantity</label>
                              <input required type="number" min="1" max={productToSell.stock} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-lg" value={sellForm.qty} onChange={e => setSellForm({ ...sellForm, qty: parseInt(e.target.value) || 1 })} />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Price per Unit</label>
                              <input required type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-black text-lg" value={sellForm.price} onChange={e => setSellForm({ ...sellForm, price: parseFloat(e.target.value) || 0 })} />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Customer Identifier</label>
                           <input type="text" placeholder="Walk-in Customer" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 font-bold text-sm" value={sellForm.customer} onChange={e => setSellForm({ ...sellForm, customer: e.target.value })} />
                        </div>

                        <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center justify-between">
                           <div>
                              <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Settlement Total</p>
                              <p className="text-3xl font-black text-emerald-900 tracking-tighter">{currency.symbol}{(sellForm.qty * sellForm.price).toLocaleString()}</p>
                           </div>
                           <CheckCircle2 size={32} className="text-emerald-500 opacity-50" />
                        </div>

                        <button type="submit" disabled={isSelling} className="w-full bg-emerald-600 text-white font-black py-6 rounded-[1.8rem] shadow-2xl hover:bg-emerald-700 transition-all uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 active:scale-95">
                           {isSelling ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} /> Authorize Transaction</>}
                        </button>
                     </form>
                  </div>
               </div>
            </div>
         )}

         {/* EDIT ASSET MODAL */}
         {isEditModalOpen && itemToEdit && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-white/20">
                  <div className="bg-blue-600 p-8 text-white flex items-center justify-between shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md">
                           <Edit size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black uppercase tracking-widest leading-none">Modify Asset</h3>
                           <p className="text-[10px] font-bold text-blue-100 uppercase mt-2 tracking-widest opacity-80">Universal Ledger Update Protocol</p>
                        </div>
                     </div>
                     <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-all"><X size={24} /></button>
                  </div>

                  <div className="p-10 overflow-y-auto max-h-[80vh] custom-scrollbar">
                     <form onSubmit={handleEditSubmit} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Asset Title</label>
                              <input required type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Universal SKU / ID</label>
                              <input type="text" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm" value={editForm.sku} onChange={e => setEditForm({ ...editForm, sku: e.target.value })} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Stock Level</label>
                              <input required type="number" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-black text-lg" value={editForm.stock} onChange={e => setEditForm({ ...editForm, stock: parseInt(e.target.value) || 0 })} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Unit Sale Price ({currency.code})</label>
                              <input required type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 font-black text-base sm:text-lg" value={editForm.price} onChange={e => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Category Classification</label>
                              <select className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none font-bold text-sm appearance-none cursor-pointer" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                                 {Array.from(new Set(items.map(i => i.category))).map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Acquisition Cost ({currency.code})</label>
                              <input type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm" value={editForm.actualCost} onChange={e => setEditForm({ ...editForm, actualCost: parseFloat(e.target.value) || 0 })} />
                           </div>
                        </div>

                        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
                           <ShieldCheck size={24} className="text-blue-600 shrink-0 mt-1" />
                           <p className="text-[10px] font-bold text-blue-700 uppercase leading-relaxed tracking-widest">
                              Authorizing this mutation will update all historical analytics associated with this asset node. Permanent ledger synchronization required.
                           </p>
                        </div>

                        <button type="submit" disabled={isUpdating} className="w-full bg-blue-600 text-white font-black py-6 rounded-[1.8rem] shadow-2xl hover:bg-blue-700 transition-all uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 active:scale-95 group">
                           {isUpdating ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Commit Ledger Updates</>}
                        </button>
                     </form>
                  </div>
               </div>
            </div>
         )}

      </div>
   );
};
