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
import Swal from 'sweetalert2';
import {
   ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
   BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { useQuotas } from '../../hooks/useQuotas';
import { BackButton } from '../../components/common/BackButton';

const COMP_COLORS = ['#6366f1', '#f43f5e'];

export const Inventory: React.FC = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const { currency } = useCurrency();

   // Data States
   const [items, setItems] = useState<any[]>([]);
   const [sales, setSales] = useState<any[]>([]);
   const [repairs, setRepairs] = useState<any[]>([]);
   const { quotas } = useQuotas();
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
            const [invResp, salesResp, repairsResp] = await Promise.all([
               callBackendAPI('/api/inventory', null, 'GET'),
               callBackendAPI('/api/sales', null, 'GET'),
               callBackendAPI('/api/repairs', null, 'GET')
            ]);

            setItems(Array.isArray(invResp) ? invResp : []);
            setSales(Array.isArray(salesResp) ? salesResp : []);
            setRepairs(Array.isArray(repairsResp) ? repairsResp : []);
            const activResp = await callBackendAPI('/api/activities', null, 'GET');
            setActivityLogs(Array.isArray(activResp) ? activResp : []);

         } catch (error) {
            console.error('Error loading inventory data:', error);
         } finally {
            setIsLoading(false);
         }
      };

      loadData();
      
      const handleInventoryUpdate = () => loadData();
      
      window.addEventListener('storage', loadData);
      window.addEventListener('inventoryUpdated', handleInventoryUpdate);
      
      return () => {
         window.removeEventListener('storage', loadData);
         window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
      };
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

      const fastMoving = (Array.isArray(items) ? [...items] : [])
         .map(i => ({ ...i, salesCount: salesMap[i._id || i.id] || 0 }))
         .sort((a, b) => b.salesCount - a.salesCount)
         .slice(0, 5);

      const profitability = (Array.isArray(items) ? items : []).map(i => {
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
      
      if (Array.isArray(sales)) {
         sales.forEach(s => {
            list.push({
               date: s.date,
               timestamp: s.timestamp,
               product: s.productName,
               actionType: 'SALE',
               qty: -s.qty,
               ref: `#${(s.id || s._id || '').toString().slice(-4)}`,
               user: 'Staff Terminal',
               icon: TrendingDown,
               color: 'text-rose-600'
            });
         });
      }

      if (Array.isArray(repairs)) {
         repairs.forEach(r => {
            if (r.status === 'completed' || r.status === 'delivered') {
               list.push({
                  date: r.date,
                  timestamp: r.createdAt || r.date,
                  product: r.device,
                  actionType: 'REPAIR',
                  qty: -1,
                  ref: r.trackingId || `#${(r.id || r._id || '').toString().slice(-4)}`,
                  user: r.assignedTo || 'Technician',
                  icon: Wrench,
                  color: 'text-amber-600'
               });
            }
         });
      }

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

         const response = await callBackendAPI('/api/sales', payload, 'POST');
         if (response) {
            setIsSellModalOpen(false);
            // Refresh local data
            const invResp = await callBackendAPI('/api/inventory', null, 'GET');
            const salesResp = await callBackendAPI('/api/sales', null, 'GET');
            setItems(Array.isArray(invResp) ? invResp : []);
            setSales(Array.isArray(salesResp) ? salesResp : []);
            // Dispatch inventory update event
            window.dispatchEvent(new CustomEvent('inventoryUpdated'));
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
         const response = await callBackendAPI(`/api/inventory/${itemToEdit._id}`, editForm, 'PUT');
         if (response) {
            setIsEditModalOpen(false);
            const invResp = await callBackendAPI('/api/inventory', null, 'GET');
            setItems(Array.isArray(invResp) ? invResp : []);
            window.dispatchEvent(new CustomEvent('inventoryUpdated'));
         }
      } catch (error) {
         console.error('Update failed:', error);
         alert('Failed to update asset.');
      } finally {
         setIsUpdating(false);
      }
   };

   const handleDeleteItem = async (id: string) => {
      const confirm = await Swal.fire({
         title: 'Delete Asset?',
         text: "This will permanently purge this item from the warehouse ledger.",
         icon: 'warning',
         showCancelButton: true,
         confirmButtonColor: '#f43f5e',
         cancelButtonColor: '#94a3b8',
         confirmButtonText: 'Confirm Purge'
      });

      if (confirm.isConfirmed) {
         try {
            await callBackendAPI(`/api/inventory/${id}`, null, 'DELETE');
            const invResp = await callBackendAPI('/api/inventory', null, 'GET');
            setItems(Array.isArray(invResp) ? invResp : []);
            window.dispatchEvent(new CustomEvent('inventoryUpdated'));
         } catch (error) {
            console.error('Delete failed:', error);
         }
      }
   };

   const handleLiquidateLedger = () => {
      const headers = ['Ref', 'Asset Name', 'SKU', 'Price', 'Stock', 'Category'];
      const rows = filteredItems.map(i => [i._id || i.id, i.name, i.sku || 'N/A', i.price, i.stock, i.category]);
      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `warehouse_ledger_${new Date().toISOString().split('T')[0]}.csv`);
      link.click();
   };

   return (
      <div className="space-y-8 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto px-4 md:px-6">
         <BackButton />
         
         {/* Header */}
         <div className="flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
               <div>
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight uppercase">Warehouse Protocol</h2>
                  <p className="text-slate-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                     <Boxes size={14} className="text-indigo-600" /> Inventory Node & Assets Ledger
                  </p>
               </div>
               <div className="bg-white border border-slate-200 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl flex items-center gap-3 shadow-sm w-fit shrink-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${quotas?.limits.stock.used >= quotas?.limits.stock.limit ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                  <div>
                     <p className="text-[7px] sm:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Stock Capacity</p>
                     <p className="text-xs sm:text-sm font-black text-slate-800 mt-1">{quotas?.limits.stock.used || 0} / {quotas?.limits.stock.limit || 0} <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold ml-1 uppercase">Units</span></p>
                  </div>
               </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full md:w-auto">
               <button onClick={() => navigate('/user/pos')} className="w-full sm:w-auto bg-white border border-slate-200 text-slate-600 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest shadow-sm"><ShoppingCart size={18} /> Point of Sale</button>
               <button 
                  onClick={() => {
                     const isAtStockLimit = quotas?.limits.stock.used >= quotas?.limits.stock.limit;
                     if (isAtStockLimit) {
                        Swal.fire({
                           icon: 'warning',
                           title: 'Warehouse Full',
                           text: 'Stock quota reached. Upgrade protocol to expand inventory ceiling.',
                           showCancelButton: true,
                           confirmButtonText: 'Upgrade',
                           confirmButtonColor: '#6366f1'
                        }).then(r => r.isConfirmed && navigate('/user/pricing'));
                     } else {
                        navigate('/user/add-inventory');
                     }
                  }} 
                  className="w-full sm:w-auto bg-indigo-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group"
               >
                  <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> Deploy Asset
               </button>
            </div>
         </div>

         {/* NAVIGATION TABS */}
         <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full overflow-x-auto custom-scrollbar no-scrollbar scroll-smooth shrink-0">
            <div className="flex shrink-0 w-full min-w-max">
               <button onClick={() => setActiveTab('inventory')} className={`flex-1 px-6 sm:px-8 py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'inventory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Stock Manager</button>
               <button onClick={() => setActiveTab('comparison')} className={`flex-1 px-6 sm:px-8 py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'comparison' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sold vs Unsold</button>
               <button onClick={() => setActiveTab('intelligence')} className={`flex-1 px-6 sm:px-8 py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'intelligence' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Intelligence Hub</button>
               <button onClick={() => setActiveTab('ledger')} className={`flex-1 px-6 sm:px-8 py-3 rounded-xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'ledger' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Operational Ledger</button>
            </div>
         </div>

         {activeTab === 'inventory' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {/* SMART FILTERS */}
               <div className="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
                  <div className="flex-1 relative group w-full">
                     <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} sm:size={20} />
                     <input
                        type="text"
                        placeholder="Query Warehouse Ledger (Title, SKU, Serial)..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3.5 sm:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-xs sm:text-sm font-bold transition-all"
                     />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                     <div className="flex-1 sm:flex-none flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl min-w-[140px]">
                        <Filter size={16} className="text-slate-400" />
                        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="bg-transparent text-[9px] sm:text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer w-full">
                           <option value="all">Categories Matrix</option>
                           {Array.from(new Set(items.map(i => i.category))).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setViewMode('table')} className={`p-2 sm:p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><List size={18} /></button>
                        <button onClick={() => setViewMode('grid')} className={`p-2 sm:p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
                     </div>
                  </div>
               </div>

               {/* MAIN LIST */}
               {viewMode === 'table' ? (
                  <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
                     <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left min-w-[1000px]">
                           <thead className="bg-slate-50/50 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 whitespace-nowrap">
                              <tr className="h-16 h-20">
                                 <th className="px-6 sm:px-10">Asset Identification</th>
                                 <th className="px-6 sm:px-10">SKU Node</th>
                                 <th className="px-6 sm:px-10 text-right">Fiscal Unit</th>
                                 <th className="px-6 sm:px-10 text-center">In-Ledger</th>
                                 <th className="px-6 sm:px-10 text-right">Actions</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-50">
                              {filteredItems.map((item) => (
                                 <tr key={item._id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-6 sm:px-10 py-7">
                                       <div className="flex items-center gap-5">
                                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all shadow-sm ${item.stock < 5 ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                             {item.name.charAt(0)}
                                          </div>
                                          <div>
                                             <p className="font-black text-slate-800 text-base tracking-tight uppercase leading-none">{item.name}</p>
                                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{item.category}</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 sm:px-10 py-7">
                                       <span className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100">{item.sku || 'NO-SKU'}</span>
                                    </td>
                                    <td className="px-6 sm:px-10 py-7 text-right">
                                       <p className="font-black text-slate-900 text-lg tracking-tighter">{currency.symbol}{item.price.toLocaleString()}</p>
                                    </td>
                                    <td className="px-6 sm:px-10 py-7 text-center">
                                       <div className="flex flex-col items-center">
                                          <span className={`text-sm font-black ${item.stock < 5 ? 'text-rose-600' : 'text-slate-800'}`}>{item.stock}</span>
                                          {item.stock < 5 && (
                                             <span className="text-[8px] font-black text-rose-500 uppercase flex items-center gap-1 mt-1"><AlertTriangle size={8} /> Restock Req</span>
                                          )}
                                       </div>
                                    </td>
                                    <td className="px-6 sm:px-10 py-7 text-right">
                                       <div className="flex items-center justify-end gap-2">
                                          <button onClick={() => handleOpenSell(item)} className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Quick Sell"><ShoppingCart size={16} /></button>
                                          <button onClick={() => handleOpenEdit(item)} className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Edit Data"><Edit size={16} /></button>
                                          <button onClick={() => handleDeleteItem(item._id)} className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Purge"><Trash2 size={16} /></button>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
               ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                     {filteredItems.map((item) => (
                        <div key={item._id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 group hover:border-indigo-600 transition-all flex flex-col">
                           <div className="flex items-start justify-between mb-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg ${item.stock < 5 ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>{item.name.charAt(0)}</div>
                              <div className="text-right">
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</p>
                                 <p className="text-xl font-black text-slate-800 tracking-tighter mt-1">{currency.symbol}{item.price.toLocaleString()}</p>
                              </div>
                           </div>
                           <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight mb-2 truncate">{item.name}</h4>
                           <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Available</p>
                                 <p className={`text-lg font-black ${item.stock < 5 ? 'text-rose-600' : 'text-slate-800'}`}>{item.stock} Units</p>
                              </div>
                              <div className="flex gap-2">
                                 <button onClick={() => handleOpenSell(item)} className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100 active:scale-90 transition-all"><ShoppingCart size={16} /></button>
                                 <button onClick={() => handleOpenEdit(item)} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 active:scale-90 transition-all"><Edit size={16} /></button>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}

         {activeTab === 'intelligence' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm col-span-full">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3"><Zap className="text-amber-500" /> Restock Predictions</h3>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left min-w-[800px]">
                        <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                           <tr>
                              <th className="py-6">Critical Asset</th>
                              <th className="py-6">Lifecycle Status</th>
                              <th className="py-6">Burn Rate Est.</th>
                              <th className="py-6 text-right">Restock Suggestion</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {restockPredictions.map(p => (
                              <tr key={p._id} className="group">
                                 <td className="py-6 font-black text-slate-800 uppercase text-sm">{p.name}</td>
                                 <td className="py-6">
                                    <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-100">Critical: {p.stock} Units</span>
                                 </td>
                                 <td className="py-6">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase">
                                       <Clock size={14} className="text-amber-500" /> Exhaustion in ~{p.daysLeft} Days
                                    </div>
                                 </td>
                                 <td className="py-6 text-right">
                                    <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Order +{p.suggestedQty} Units</button>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'ledger' && (
            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border-b-8 border-b-emerald-600">
               <div className="p-6 sm:p-10 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50/30">
                  <div>
                     <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">Operational Ledger</h3>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Asset Movement Forensic Log</p>
                  </div>
                  <button onClick={handleLiquidateLedger} className="w-full sm:w-auto bg-white border border-slate-200 text-slate-600 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 shadow-sm transition-all"><Download size={18} /> Liquidate LEDGER</button>
               </div>
               <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left min-w-[900px]">
                     <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                        <tr>
                           <th className="px-10 py-6">Timestamp Node</th>
                           <th className="px-10 py-6">Operational Entity</th>
                           <th className="px-10 py-6">Delta Magnitude</th>
                           <th className="px-10 py-6">Uplink User</th>
                           <th className="px-10 py-6 text-right">Protocol Ref</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {movementLedger.map((log, idx) => (
                           <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                              <td className="px-10 py-7">
                                 <p className="text-xs font-black text-slate-800 uppercase">{log.date}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">08:45 AM UTC</p>
                              </td>
                              <td className="px-10 py-7">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${log.color} bg-slate-50 shadow-sm border border-slate-100`}><log.icon size={18} /></div>
                                    <span className="font-black text-slate-700 text-sm uppercase tracking-tight">{log.product}</span>
                                 </div>
                              </td>
                              <td className="px-10 py-7">
                                 <span className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${log.qty > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                    {log.qty > 0 ? `+${log.qty}` : log.qty} Units
                                 </span>
                              </td>
                              <td className="px-10 py-7">
                                 <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">{log.user.charAt(0)}</div>
                                    <span className="text-xs font-bold text-slate-500 uppercase">{log.user}</span>
                                 </div>
                              </td>
                              <td className="px-10 py-7 text-right">
                                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{log.ref}</span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         )}

         {activeTab === 'comparison' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm col-span-full grid grid-cols-1 md:grid-cols-4 gap-8 mb-4">
                  <div className="md:col-span-1">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inventory Liquidity Ratio</p>
                     <h4 className="text-4xl font-black text-slate-800 tracking-tighter">{comparisonData.unsoldRatio.toFixed(1)}% <span className="text-sm text-slate-400 uppercase">Unsold</span></h4>
                     <p className="text-xs font-bold text-slate-500 mt-2">Optimal protocol recommends ratio below 40%.</p>
                  </div>
                  <div className="md:col-span-3 h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                           <Pie data={comparisonData.pieData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                              {comparisonData.pieData.map((entry, index) => <Cell key={index} fill={COMP_COLORS[index % COMP_COLORS.length]} />)}
                           </Pie>
                           <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                           <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>
         )}

         {/* Edit Modal */}
         {isEditModalOpen && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-2xl rounded-3xl sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in zoom-in-95 duration-300 border border-white/20">
                  <div className="bg-slate-900 p-6 sm:p-10 text-white flex items-center justify-between shrink-0">
                     <div className="flex items-center gap-4 sm:gap-6">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-2xl sm:rounded-3xl flex items-center justify-center border border-white/10 shrink-0"><Edit size={24} sm:size={28} /></div>
                        <div>
                           <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest leading-none">Modify Asset</h3>
                           <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 sm:mt-2 tracking-widest opacity-80">Synchronizing Vault Data</p>
                        </div>
                     </div>
                     <button onClick={() => setIsEditModalOpen(false)} className="p-3 hover:bg-rose-500 rounded-full transition-all"><X size={20} sm:size={24} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 sm:p-10 md:p-12 custom-scrollbar">
                     <form onSubmit={handleEditSubmit} className="space-y-6 sm:space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Asset Nomenclature</label>
                              <input type="text" className="w-full px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none font-bold text-sm" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">ID Code (SKU)</label>
                              <input type="text" className="w-full px-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none font-bold text-sm" value={editForm.sku} onChange={e => setEditForm({...editForm, sku: e.target.value})} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Listed Valuation</label>
                              <div className="relative">
                                 <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">{currency.symbol}</span>
                                 <input type="number" className="w-full pl-10 pr-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none font-bold text-sm" value={editForm.price} onChange={e => setEditForm({...editForm, price: parseFloat(e.target.value)})} />
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Acquisition Cost</label>
                              <div className="relative">
                                 <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400">{currency.symbol}</span>
                                 <input type="number" className="w-full pl-10 pr-5 py-3.5 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl outline-none font-bold text-sm font-bold text-emerald-600" value={editForm.actualCost} onChange={e => setEditForm({...editForm, actualCost: parseFloat(e.target.value)})} />
                              </div>
                           </div>
                        </div>
                        <div className="pt-6">
                           <button type="submit" disabled={isUpdating} className="w-full bg-slate-900 text-white font-black py-4 sm:py-5 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                              {isUpdating ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />} Commit Updates
                           </button>
                        </div>
                     </form>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};
