
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Search, Plus, Trash2, Printer, CreditCard, 
  Minus, AlertCircle, CheckCircle2, Loader2, X, ArrowRight,
  Package, DollarSign, User, ReceiptText, Zap, ShoppingCart,
  History, BarChart3, TrendingUp, Info, Activity, ShieldCheck,
  CreditCard as CardIcon, Banknote, Landmark, Wallet, Percent,
  ChevronRight, ArrowDownRight, Terminal, Tag, Calculator,
  UserPlus, Wallet2, Fingerprint, Receipt, MapPin, Eye,
  FileDown, ShieldAlert, BadgeCheck, RotateCcw, FileSpreadsheet,
  ArrowUpCircle, Box, Target, ClipboardList, Download, Calendar,
  TrendingDown
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { db } from '../../api/db';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { useAuth } from '../../context/AuthContext';

const DONUT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export const SellProducts: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [inventory, setInventory] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  
  // UI States
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastInvoiceId, setLastInvoiceId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('walk-in');
  const [lastSales, setLastSales] = useState<any[]>([]);
  
  // Additive POS states
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [cartDiscount, setCartDiscount] = useState<{ value: number; type: 'flat' | 'percent' }>({ value: 0, type: 'flat' });
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Reporting/Analytics States
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [reportFilter, setReportFilter] = useState('Today');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundInvoiceRef, setRefundInvoiceRef] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    const loadData = () => {
      setInventory(db.inventory.getAll());
      setClients(db.clients.getAll());
      setLastSales(db.sales.getAll());
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const filteredProducts = inventory.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: any) => {
    if (product.stock <= 0) return;
    const existing = cart.find(c => c.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) return;
      setCart(cart.map(c => c.id === product.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...product, qty: 1, itemDiscount: 0, discountType: 'percent' }]);
    }
  };

  const updateQty = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const product = inventory.find(p => p.id === id);
        const newQty = item.qty + delta;
        if (newQty > 0 && newQty <= (product?.stock || 0)) {
          return { ...item, qty: newQty };
        }
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id));

  const updateItemDiscount = (id: string, value: number, type: 'flat' | 'percent') => {
    setCart(cart.map(item => {
      if (item.id === id) return { ...item, itemDiscount: value, discountType: type };
      return item;
    }));
  };

  const fiscalData = useMemo(() => {
    const grossSubtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
    const lineItemDiscounts = cart.reduce((acc, curr) => {
      const lineGross = curr.price * curr.qty;
      const discount = curr.discountType === 'percent' ? lineGross * (curr.itemDiscount / 100) : curr.itemDiscount;
      return acc + discount;
    }, 0);
    const subtotalAfterLine = Math.max(0, grossSubtotal - lineItemDiscounts);
    const globalDiscountAmount = cartDiscount.type === 'percent' ? subtotalAfterLine * (cartDiscount.value / 100) : cartDiscount.value;
    const netSubtotal = Math.max(0, subtotalAfterLine - globalDiscountAmount);
    const totalDiscount = lineItemDiscounts + globalDiscountAmount;
    const tax = netSubtotal * 0.05;
    const finalTotal = netSubtotal + tax;

    const isWalletSufficient = (user?.walletBalance || 0) >= finalTotal;
    const lowStockItems = cart.filter(item => {
      const original = inventory.find(i => i.id === item.id);
      return original && (original.stock - item.qty) < 3;
    });

    return {
      grossSubtotal, netSubtotal, tax, finalTotal, totalDiscount,
      isWalletSufficient, totalItems: cart.reduce((a, b) => a + b.qty, 0),
      lowStockItems
    };
  }, [cart, cartDiscount, user, inventory]);

  // DAILY INTELLIGENCE ENGINE (TASKS 1-8)
  const dailyIntelligence = useMemo(() => {
    const allSalesData = db.sales.getAll();
    const now = new Date();
    const startOfToday = new Date(now.setHours(0,0,0,0));

    // Task 6: Filter Logic (Standardized for robustness)
    const filteredSales = allSalesData.filter(s => {
      const sDate = s.timestamp ? new Date(s.timestamp) : new Date(s.date);
      if (isNaN(sDate.getTime())) return false;

      if (reportFilter === 'Today') return sDate >= startOfToday;
      if (reportFilter === 'Yesterday') {
        const yest = new Date(startOfToday);
        yest.setDate(yest.getDate() - 1);
        return sDate >= yest && sDate < startOfToday;
      }
      if (reportFilter === 'Last 7 Days') {
        const l7 = new Date(startOfToday);
        l7.setDate(l7.getDate() - 7);
        return sDate >= l7;
      }
      if (reportFilter === 'Custom' && customRange.from && customRange.to) {
        const from = new Date(customRange.from);
        const to = new Date(customRange.to);
        to.setHours(23, 59, 59);
        return sDate >= from && sDate <= to;
      }
      return sDate >= startOfToday;
    });

    // Task 1: Aggregates
    const totalRevenue = filteredSales.reduce((a, b) => a + b.total, 0);
    const totalOrders = filteredSales.length;
    const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Profit Aggregate (Read-Only from stored sales/inventory)
    const totalProfit = filteredSales.reduce((acc, s) => {
      const product = inventory.find(p => p.id === s.productId);
      const cost = product?.actualCost || (s.price * 0.7);
      return acc + (s.total - (cost * s.qty));
    }, 0);

    // Task 2, 3, 5: Hourly Data
    const hourlyNodes = Array.from({ length: 24 }, (_, i) => ({
      time: `${i === 0 ? 12 : i > 12 ? i - 12 : i} ${i >= 12 ? 'PM' : 'AM'}`,
      sales: 0,
      profit: 0,
      orders: 0,
      hour: i
    }));

    // Task 4: Payment Distribution
    const paymentMap: Record<string, number> = { Cash: 0, Wallet: 0, Stripe: 0, PayPal: 0, PayFast: 0 };

    filteredSales.forEach(s => {
      const dateObj = s.timestamp ? new Date(s.timestamp) : new Date(s.date);
      if (isNaN(dateObj.getTime())) return;

      const hour = dateObj.getHours();
      const product = inventory.find(p => p.id === s.productId);
      const cost = product?.actualCost || (s.price * 0.7);
      const profit = s.total - (cost * s.qty);
      
      hourlyNodes[hour].sales += s.total;
      hourlyNodes[hour].profit += profit;
      hourlyNodes[hour].orders += 1;

      // Ensure we match existing keys
      const method = s.paymentMethod || 'Cash';
      if (paymentMap.hasOwnProperty(method)) paymentMap[method] += s.total;
      else paymentMap['Cash'] += s.total;
    });

    const donutData = Object.entries(paymentMap).map(([name, value]) => ({ name, value }));
    const filteredHourlyTable = hourlyNodes.filter(n => n.orders > 0 || n.sales > 0);

    return { totalRevenue, totalProfit, totalOrders, avgOrder, hourlyNodes, filteredHourlyTable, donutData };
  }, [lastSales, inventory, reportFilter, customRange]);

  const handleProcessSale = async () => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);
    setShowConfirmModal(false);
    await new Promise(resolve => setTimeout(resolve, 1200));
    try {
      const clientName = selectedClientId === 'walk-in' ? (customerName || 'Walk-in Customer') : clients.find(c => c.id === selectedClientId)?.name;
      let generatedId = '';
      for (const item of cart) {
        // Core POS Logic - Deducts Stock & Adds Sale Entry
        const success = db.inventory.sell(item.id, item.qty, item.price, clientName);
        if (success && !generatedId) generatedId = `INV-${Math.floor(1000 + Math.random() * 9000)}`;
      }
      setLastInvoiceId(generatedId || `INV-${Math.floor(1000 + Math.random() * 9000)}`);
      setShowSuccess(true);
      setCart([]);
      setCustomerName('');
      setSelectedClientId('walk-in');
      setCartDiscount({ value: 0, type: 'flat' });
      setLastSales(db.sales.getAll());
    } catch (err) {
      alert("Transmission failed.");
    } finally { setIsProcessing(false); }
  };

  // REFUND NODE LOGIC (FIXED)
  const handleRefundProtocol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundInvoiceRef || isRefunding) return;
    setIsRefunding(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const allSales = db.sales.getAll();
    const queryRef = refundInvoiceRef.startsWith('SALE-') ? refundInvoiceRef : `SALE-${refundInvoiceRef}`;
    const saleToRefund = allSales.find(s => s.id === queryRef || s.id === refundInvoiceRef);
    
    if (!saleToRefund) {
      alert("Invalid Invoice Reference Node. Sale not found in global ledger.");
      setIsRefunding(false);
      return;
    }

    const item = inventory.find(i => i.id === saleToRefund.productId);
    if (item) {
      // ADDITIVE: Restoring stock without modifying core deducting API
      db.inventory.update(item.id, { stock: item.stock + saleToRefund.qty });
      db.activity.log({ 
        actionType: 'Asset Refund Processed', 
        moduleName: 'POS', 
        refId: saleToRefund.id, 
        status: 'Success' 
      });
      alert("Refund Authorized. Asset inventory successfully restituted.");
    } else {
      alert("Asset node missing from database. Partial refund state detected.");
    }
    
    setRefundInvoiceRef('');
    setShowRefundModal(false);
    setIsRefunding(false);
    setInventory(db.inventory.getAll());
    setLastSales(db.sales.getAll());
  };

  const handleExportCSV = () => {
    const headers = ["Hour", "Orders", "Sales", "Profit"];
    const rows = dailyIntelligence.filteredHourlyTable.map(n => [n.time, n.orders, n.sales, n.profit]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `POS_Audit_Report_${reportFilter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[calc(100vh-180px)] animate-in fade-in duration-500 pb-10">
      
      {/* Product Catalog - Left Side */}
      <div className="flex-1 flex flex-col space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">POS TERMINAL</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
               <Activity size={12} className="text-emerald-500"/> Node: Active • {new Date().toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setShowDailyReport(!showDailyReport)} className={`p-4 rounded-2xl transition-all shadow-sm flex items-center gap-2 ${showDailyReport ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50'}`}>
                <BarChart3 size={20}/>
                <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-inherit">Performance Report</span>
             </button>
             <button onClick={() => setShowRefundModal(true)} className="p-4 bg-white border border-slate-200 text-rose-600 rounded-2xl hover:bg-rose-50 transition-all shadow-sm"><RotateCcw size={20}/></button>
             <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" placeholder="Query Warehouse Assets..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm font-bold shadow-sm transition-all" 
                />
             </div>
          </div>
        </div>

        {/* DAILY ANALYTICS HUB (TASKS 1-8) */}
        {showDailyReport && (
          <div className="bg-white rounded-[3.5rem] border-2 border-indigo-100 shadow-2xl p-8 md:p-12 space-y-12 animate-in slide-in-from-top-6 duration-500 max-h-[85vh] overflow-y-auto custom-scrollbar">
             
             {/* Task 6: Date Filter Strip */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                   {['Today', 'Yesterday', 'Last 7 Days', 'Custom'].map(f => (
                     <button 
                       key={f} onClick={() => setReportFilter(f)}
                       className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                     >
                       {f}
                     </button>
                   ))}
                </div>
                {reportFilter === 'Custom' && (
                  <div className="flex items-center gap-3 animate-in zoom-in-95">
                     <input type="date" className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={customRange.from} onChange={e => setCustomRange({...customRange, from: e.target.value})} />
                     <ArrowRight size={14} className="text-slate-300" />
                     <input type="date" className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={customRange.to} onChange={e => setCustomRange({...customRange, to: e.target.value})} />
                  </div>
                )}
                {/* Task 7: Export Options */}
                <div className="flex gap-3">
                   <button onClick={handleExportCSV} title="Export CSV" className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all border border-slate-200"><FileSpreadsheet size={18}/></button>
                   <button onClick={() => window.print()} title="Export PDF" className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-black transition-all shadow-xl"><FileDown size={18}/></button>
                </div>
             </div>

             {/* Task 8: Low Sales / Loss Indicator Banner */}
             {(dailyIntelligence.totalRevenue === 0 || dailyIntelligence.totalProfit < 0) && (
               <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2rem] flex items-center gap-4 animate-pulse">
                  <ShieldAlert size={28} className="text-rose-600" />
                  <div>
                    <h4 className="text-sm font-black text-rose-900 uppercase">⚠ Low sales activity detected for selected period</h4>
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1">Warning: Transaction volume or profit margins below threshold.</p>
                  </div>
               </div>
             )}

             {/* Task 1: Daily Sales Summary Header */}
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: `Total Sales (${reportFilter})`, val: dailyIntelligence.totalRevenue, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', isCurr: true },
                  { label: `Total Profit (${reportFilter})`, val: dailyIntelligence.totalProfit, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', isCurr: true },
                  { label: 'Total Orders', val: dailyIntelligence.totalOrders, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Average Order Value', val: dailyIntelligence.avgOrder, icon: Target, color: 'text-amber-600', bg: 'bg-amber-50', isCurr: true }
                ].map((stat, i) => (
                  <div key={i} className="p-6 rounded-[2.5rem] border border-slate-100 bg-slate-50/50 flex flex-col gap-4 group hover:shadow-xl transition-all">
                     <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}><stat.icon size={22}/></div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <h4 className="text-2xl font-black text-slate-800 tracking-tighter">
                           {stat.isCurr ? currency.symbol : ''}{Math.round(stat.val).toLocaleString()}
                        </h4>
                     </div>
                  </div>
                ))}
             </div>

             <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Task 2: Daily Sales Line Graph */}
                <div className="xl:col-span-2 space-y-6">
                   <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2"><Activity size={16} className="text-indigo-600" /> Hourly Flow Graph</h4>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">Autonomous Trace</span>
                   </div>
                   <div className="h-72 bg-slate-50/30 rounded-[3rem] border-2 border-dashed border-slate-100 p-6">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={dailyIntelligence.hourlyNodes}>
                            <defs>
                               <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 900}} />
                            <YAxis hide domain={['auto', 'auto']} />
                            <Tooltip 
                               contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                               itemStyle={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}
                               formatter={(val: number) => [`${currency.symbol}${val.toLocaleString()}`, 'SALES']}
                               labelStyle={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8', marginBottom: '4px' }}
                            />
                            <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={5} fill="url(#salesGrad)" animationDuration={1500} />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                   
                   {/* Task 5: Hourly Sales Table */}
                   <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                      <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                         <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Hourly Detailed Ledger</h5>
                         <History size={14} className="text-slate-300" />
                      </div>
                      <div className="max-h-64 overflow-y-auto custom-scrollbar">
                         <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[8px] font-black uppercase text-slate-400 border-b border-slate-100">
                               <tr className="h-10"><th className="px-6">Hour node</th><th className="px-6 text-center">Orders</th><th className="px-6 text-right">Sales</th><th className="px-6 text-right">Profit</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-[10px] font-bold">
                               {dailyIntelligence.filteredHourlyTable.map((n, i) => (
                                 <tr key={i} className="hover:bg-slate-50 h-12 transition-all">
                                    <td className="px-6 text-slate-400 uppercase">{n.time}</td>
                                    <td className="px-6 text-center font-black text-indigo-600">{n.orders}</td>
                                    <td className="px-6 text-right font-black text-slate-900">{currency.symbol}{n.sales.toLocaleString()}</td>
                                    <td className={`px-6 text-right font-black ${n.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{currency.symbol}{n.profit.toLocaleString()}</td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </div>
                </div>

                <div className="space-y-8">
                   {/* Task 4: Payment Distribution (Donut Chart) */}
                   <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm flex flex-col h-fit">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] mb-8 text-center">Protocol Mix</h4>
                      <div className="h-48 w-full relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie data={dailyIntelligence.donutData} innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none">
                                  {dailyIntelligence.donutData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                                  ))}
                               </Pie>
                               <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'}} />
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-sm font-black text-slate-900">{dailyIntelligence.totalOrders}</span>
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total Tx</span>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-8">
                         {dailyIntelligence.donutData.map((d, i) => (
                           <div key={i} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                              <span className="text-[9px] font-black text-slate-500 uppercase truncate">{d.name}: {currency.symbol}{d.value.toLocaleString()}</span>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Task 3: Daily Profit Graph */}
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2"><Target size={16} className="text-emerald-600" /> Profit Delta Node</h4>
                      <div className="h-48 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 p-4">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyIntelligence.hourlyNodes}>
                               <XAxis dataKey="time" hide />
                               <YAxis hide />
                               <Tooltip 
                                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                  contentStyle={{ borderRadius: '16px', border: 'none', padding: '10px' }}
                                  formatter={(val: number) => [`${currency.symbol}${val.toLocaleString()}`, 'PROFIT']}
                               />
                               <Bar dataKey="profit" radius={[4, 4, 0, 0]} barSize={8}>
                                  {dailyIntelligence.hourlyNodes.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#f43f5e'} />
                                  ))}
                               </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                      </div>
                   </div>
                </div>
             </div>

             <div className="pt-8 border-t border-slate-100 flex justify-center">
                <button onClick={() => setShowDailyReport(false)} className="px-10 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100">Close Intelligence Node</button>
             </div>
          </div>
        )}

        {/* Inventory Listing */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[60vh]">
          {filteredProducts.map(p => (
            <div 
              key={p.id} onClick={() => addToCart(p)}
              className={`bg-white p-4 rounded-[2rem] border-2 transition-all cursor-pointer group relative ${p.stock > 0 ? 'border-slate-50 hover:border-indigo-500 hover:shadow-xl' : 'opacity-40 grayscale pointer-events-none'}`}
            >
              <div className="aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center text-slate-300 relative overflow-hidden">
                {p.image ? <img src={p.image} className="w-full h-full object-cover" /> : <ShoppingBag size={40} />}
              </div>
              <h4 className="font-black text-slate-800 truncate text-sm uppercase tracking-tight">{p.name}</h4>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                <span className="text-base font-black text-indigo-600">{currency.symbol}{p.price}</span>
                <span className="text-[9px] text-slate-500 font-black uppercase">Qty: {p.stock}</span>
              </div>
            </div>
          ))}
        </div>

        {/* SESSION LEDGER */}
        <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white overflow-hidden relative">
           <div className="flex items-center gap-3 mb-6">
              <History size={16} className="text-indigo-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Session Activity Feed</h3>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {lastSales.slice(0, 3).map((sale) => (
                <div key={sale.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-md flex items-center justify-between">
                   <div className="min-w-0">
                      <p className="text-[9px] font-black text-indigo-400 uppercase">#{sale.id.slice(-4)}</p>
                      <p className="text-[10px] font-bold text-white truncate uppercase">{sale.productName}</p>
                   </div>
                   <button onClick={() => window.print()} className="p-2 text-white/50 hover:text-white transition-all"><Printer size={14}/></button>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Cart Summary Panel */}
      <div className="w-full lg:w-[450px] bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden sticky top-24 max-h-[calc(100vh-140px)] border-b-8 border-b-indigo-600">
        
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><ShoppingCart size={20} /></div>
             <div><h3 className="font-black text-sm uppercase tracking-widest leading-none">Order logic</h3><p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Staff: {user?.name}</p></div>
           </div>
           <button onClick={() => setShowInvoicePreview(true)} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><Eye size={18}/></button>
        </div>

        <div className="p-5 border-b border-slate-50 bg-slate-50/30 space-y-4 shrink-0">
           <div className="flex gap-2">
              <select 
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none appearance-none cursor-pointer shadow-sm"
                value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}
              >
                <option value="walk-in">Standard Walk-in Client</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={() => navigate('/user/clients')} className="p-3 bg-white border border-slate-200 text-indigo-600 rounded-xl shadow-sm"><UserPlus size={16}/></button>
           </div>
           {selectedClientId === 'walk-in' && <input type="text" placeholder="Reference Name..." value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold shadow-sm" />}
        </div>

        {/* CART DETAILS SECTION */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white">
          {cart.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50"><ShoppingCart size={32} /><p className="text-[10px] font-black uppercase tracking-widest">Cart Node Empty</p></div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="p-4 bg-slate-50/50 rounded-[1.8rem] border border-slate-100 space-y-3 animate-in slide-in-from-right-4">
                <div className="flex justify-between items-start">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100"><Package size={18} className="text-slate-400"/></div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-800 uppercase truncate max-w-[150px]">{item.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Unit: {currency.symbol}{item.price.toLocaleString()}</p>
                      </div>
                   </div>
                   <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-300 hover:text-rose-600 transition-colors" title="Remove Asset"><Trash2 size={16}/></button>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                   <div className="flex items-center bg-white rounded-xl p-1 shadow-sm border border-slate-200">
                      <button onClick={() => updateQty(item.id, -1)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Minus size={12}/></button>
                      <span className="px-3 text-xs font-black text-slate-700 min-w-[35px] text-center">{item.qty}</span>
                      <button 
                        disabled={item.qty >= item.stock}
                        onClick={() => updateQty(item.id, 1)} 
                        className={`p-1.5 transition-colors ${item.qty >= item.stock ? 'text-slate-200 cursor-not-allowed' : 'text-slate-400 hover:text-indigo-600'}`}
                      >
                        <Plus size={12}/>
                      </button>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-slate-900 tracking-tighter">{currency.symbol}{(item.price * item.qty).toLocaleString()}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Line Net</p>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50/80 border-t border-slate-100 space-y-6 shrink-0">
           <div className="grid grid-cols-5 gap-2">
             {[
               { id: 'Cash', icon: Banknote },
               { id: 'Wallet', icon: Wallet },
               { id: 'Stripe', icon: CardIcon },
               { id: 'PayPal', icon: Wallet2 },
               { id: 'PayFast', icon: Landmark }
             ].map(m => (
               <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${paymentMethod === m.id ? 'bg-white border-indigo-600 shadow-lg' : 'bg-white border-transparent text-slate-300 hover:bg-slate-100'}`}>
                 <m.icon size={20} /><span className="text-[7px] font-black uppercase tracking-tighter">{m.id}</span>
               </button>
             ))}
           </div>

           <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span>Subtotal</span>
                 <span className="text-slate-800">{currency.symbol}{fiscalData.grossSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <span>VAT Node (5%)</span>
                 <span className="text-slate-800">{currency.symbol}{fiscalData.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-dashed border-slate-200">
                 <div><span className="text-[10px] font-black text-slate-400 uppercase block">Settlement Total</span><span className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest mt-1 italic">Network Auth node Required</span></div>
                 <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">{currency.symbol}{fiscalData.finalTotal.toLocaleString()}</h2>
              </div>
              <button 
                disabled={cart.length === 0 || isProcessing || (paymentMethod === 'Wallet' && !fiscalData.isWalletSufficient)}
                onClick={() => setShowConfirmModal(true)}
                className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-2xl active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[10px]"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <><ShieldCheck size={20}/> Authorize Authorized Settlement</>}
              </button>
           </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
          <div className="bg-white w-full max-md rounded-[3rem] shadow-2xl overflow-hidden border border-indigo-100">
             <div className="bg-slate-900 p-8 text-white flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-white/10 rounded-[1.8rem] flex items-center justify-center border border-white/10"><ShieldCheck size={32} className="text-indigo-400" /></div>
                <h3 className="text-xl font-black uppercase tracking-widest">Confirm Transaction</h3>
             </div>
             <div className="p-10 space-y-8">
                <div className="space-y-4">
                   <div className="flex justify-between items-center pb-4 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase">Items Node</span><span className="text-sm font-black text-slate-800">{fiscalData.totalItems} Units</span></div>
                   <div className="flex justify-between items-center pb-4 border-b border-slate-50"><span className="text-[10px] font-black text-slate-400 uppercase">Payment protocol</span><span className="text-sm font-black text-indigo-600 uppercase">{paymentMethod}</span></div>
                   <div className="flex justify-between items-center"><span className="text-[10px] font-black text-slate-400 uppercase">Settlement Total</span><span className="text-2xl font-black text-slate-900 tracking-tighter">{currency.symbol}{fiscalData.finalTotal.toLocaleString()}</span></div>
                </div>
                {fiscalData.lowStockItems.length > 0 && <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3"><ShieldAlert size={18} className="text-amber-600 mt-0.5" /><div><p className="text-[9px] font-black text-amber-900 uppercase tracking-widest">Low stock node alert</p></div></div>}
                <div className="grid grid-cols-2 gap-3"><button onClick={() => setShowConfirmModal(false)} className="py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px]">Discard</button><button onClick={handleProcessSale} className="py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">Authorize sale</button></div>
             </div>
          </div>
        </div>
      )}

      {/* REFUND MODAL (FIXED) */}
      {showRefundModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
           <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-rose-100">
              <div className="bg-rose-600 p-8 text-white flex items-center justify-between">
                 <div className="flex items-center gap-4"><div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><RotateCcw size={24}/></div><h3 className="text-xl font-black uppercase tracking-widest">Refund Node</h3></div>
                 <button onClick={() => setShowRefundModal(false)} className="p-2 hover:bg-rose-500 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Invoice Reference Node</label>
                    <input required type="text" placeholder="e.g. SALE-1234" value={refundInvoiceRef} onChange={e => setRefundInvoiceRef(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:border-rose-500" />
                 </div>
                 <div className="bg-rose-50 p-6 rounded-[1.8rem] border border-rose-100 flex items-start gap-4">
                    <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-1" />
                    <p className="text-[9px] font-bold text-rose-600/70 uppercase leading-relaxed">Authorizing a refund will restore stock levels for the selected invoice and reverse transactional logs.</p>
                 </div>
                 <button onClick={handleRefundProtocol} disabled={isRefunding} className="w-full bg-rose-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-rose-200 flex items-center justify-center gap-3">
                    {isRefunding ? <Loader2 className="animate-spin" size={20}/> : <><RotateCcw size={18}/> Authorize Reverse Protocol</>}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* SUCCESS OVERLAY */}
      {showSuccess && (
         <div className="fixed inset-0 bg-emerald-600/95 backdrop-blur-md z-[700] flex flex-col items-center justify-center p-10 text-white animate-in zoom-in">
            <div className="w-24 h-24 bg-white/20 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl animate-bounce border-2 border-white/20"><BadgeCheck size={56} /></div>
            <h4 className="text-4xl font-black tracking-tighter uppercase text-center leading-none">Sale Authorized</h4>
            <div className="mt-6 flex flex-col items-center gap-2"><span className="text-[11px] font-bold text-emerald-100 uppercase tracking-[0.3em]">Ref Node: {lastInvoiceId}</span></div>
            <div className="flex gap-4 mt-12">
               <button onClick={() => window.print()} className="px-8 py-5 bg-white text-emerald-700 rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-3"><Printer size={18}/> Print Node Receipt</button>
               <button onClick={() => setShowSuccess(false)} className="px-8 py-5 bg-emerald-800 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-3"><FileDown size={18}/> Audit PDF</button>
            </div>
            <button onClick={() => setShowSuccess(false)} className="mt-12 text-emerald-200 font-black text-[10px] uppercase hover:text-white">Protocol Complete</button>
         </div>
      )}

      {/* INVOICE PREVIEW OVERLAY */}
      {showInvoicePreview && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-slate-900 p-6 sm:p-8 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
                    <Receipt size={24}/>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-widest">Audit Preview</h3>
                </div>
                <button onClick={() => setShowInvoicePreview(false)} className="p-2 hover:bg-rose-500 rounded-full transition-colors shrink-0"><X size={24}/></button>
              </div>
              <div className="p-6 sm:p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                 <div className="flex justify-between items-start pb-6 border-b-2 border-dashed border-slate-100">
                   <div>
                     <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">DibNow <span className="text-indigo-600">POS</span></h2>
                     <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1"><MapPin size={10}/> UK-7721</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Timestamp</p>
                     <p className="text-[10px] sm:text-xs font-bold text-slate-800">{new Date().toLocaleString()}</p>
                   </div>
                 </div>
                 <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Fiscal line items</h4>
                   {cart.map(item => (
                     <div key={item.id} className="flex justify-between items-center text-xs">
                       <span className="font-bold text-slate-700 uppercase">{item.name} <span className="text-slate-400">x{item.qty}</span></span>
                       <span className="font-black text-slate-900">{currency.symbol}{(item.price * item.qty).toLocaleString()}</span>
                     </div>
                   ))}
                 </div>
                 <div className="pt-8 border-t-2 border-dashed border-slate-100 space-y-3">
                    <div className="flex justify-between text-xs font-black uppercase text-slate-400"><span>Net Subtotal</span><span className="text-slate-900">{currency.symbol}{fiscalData.netSubtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-xs font-black uppercase text-slate-400"><span>VAT (5%)</span><span className="text-slate-900">{currency.symbol}{fiscalData.tax.toLocaleString()}</span></div>
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="text-sm sm:text-lg font-black text-indigo-600 uppercase tracking-widest">Authorized Total</span>
                      <span className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter">{currency.symbol}{fiscalData.finalTotal.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
              <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                <button onClick={() => window.print()} className="flex-1 py-4 sm:py-5 bg-white border border-slate-200 text-slate-600 rounded-3xl font-black uppercase text-[10px] flex items-center justify-center gap-3"><Printer size={18}/> Print Node</button>
                <button onClick={() => setShowInvoicePreview(false)} className="flex-1 py-4 sm:py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-[10px] shadow-xl">Close Node</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
