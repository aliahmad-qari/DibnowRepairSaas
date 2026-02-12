import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Plus, Search, Trash2, Edit2, CheckCircle, ChevronLeft, Save, X, Lock, 
  ArrowUpCircle, PieChart, TrendingUp, ShoppingCart, Package, Info, 
  AlertCircle, BarChart3, Boxes, DollarSign, AlertTriangle, Activity, Flame,
  /* FIX: Corrected 'ArrowDownWideZap' to 'ArrowDownZa' which exists in lucide-react */
  Filter, ArrowDownZa, SortAsc
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, 
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { db } from '../../api/db';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];

export const Categories: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [categories, setCategories] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // TASK 7: UI-only Filter States
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'empty' | 'revenue'>('all');
  const [sortOrder, setSortOrder] = useState<'a-z' | 'none'>('none');

  const [newCat, setNewCat] = useState({ name: '', description: '' });
  const [activePlan, setActivePlan] = useState<any>(null);
  const [isAtLimit, setIsAtLimit] = useState(false);

  useEffect(() => {
    const loadData = () => {
      const allCats = db.categories.getAll();
      const allStock = db.inventory.getAll();
      const allSales = db.sales.getAll();
      
      setCategories(allCats);
      setInventory(allStock);
      setSales(allSales);
      
      if (user) {
        const plan = db.plans.getById(user.planId || 'starter');
        setActivePlan(plan);
        setIsAtLimit(allCats.length >= plan.limits.categories);
      }
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [user]);

  // ANALYTICS ENGINE (Tasks 1, 2, 3, 4, 5, 7)
  const analytics = useMemo(() => {
    const totalGlobalStock = inventory.reduce((acc, curr) => acc + curr.stock, 0);
    const totalGlobalRevenue = sales.reduce((acc, curr) => acc + curr.total, 0);

    let stats = categories.map(cat => {
      const catItems = inventory.filter(i => i.category === cat.name);
      const catSales = sales.filter(s => {
        const item = inventory.find(i => i.id === s.productId);
        return item?.category === cat.name;
      });

      const itemsCount = catItems.length;
      const unitsCount = catItems.reduce((acc, curr) => acc + curr.stock, 0);
      const stockValue = catItems.reduce((acc, curr) => acc + (curr.price * curr.stock), 0);
      const soldUnits = catSales.reduce((acc, curr) => acc + curr.qty, 0);
      const revenue = catSales.reduce((acc, curr) => acc + curr.total, 0);

      let status: 'Active' | 'Stock Only' | 'Inactive' = 'Inactive';
      if (unitsCount > 0 && soldUnits > 0) status = 'Active';
      else if (unitsCount > 0) status = 'Stock Only';

      return {
        ...cat,
        itemsCount,
        unitsCount,
        stockValue,
        soldUnits,
        revenue,
        status,
        stockContribution: totalGlobalStock > 0 ? (unitsCount / totalGlobalStock) * 100 : 0,
        revenueContribution: totalGlobalRevenue > 0 ? (revenue / totalGlobalRevenue) * 100 : 0
      };
    });

    const totalCategories = categories.length;
    const withStock = stats.filter(s => s.unitsCount > 0).length;
    const withSales = stats.filter(s => s.soldUnits > 0).length;
    const empty = stats.filter(s => s.unitsCount === 0).length;

    // Task 4: Dead Category Detection
    const deadCategories = stats.filter(s => s.unitsCount === 0 && s.soldUnits === 0);

    // Task 3: Sales Contribution Data
    const salesChartData = stats
      .filter(s => s.revenue > 0)
      .map(s => ({ name: s.name, value: s.revenue }))
      .sort((a, b) => b.value - a.value);

    // Task 7: UI Filtering Logic
    let filtered = stats.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeFilter === 'active') filtered = filtered.filter(c => c.status === 'Active');
    if (activeFilter === 'empty') filtered = filtered.filter(c => c.unitsCount === 0);
    if (activeFilter === 'revenue') filtered = filtered.filter(c => c.revenue > 0);

    // Task 7: Alphabetical Sort
    if (sortOrder === 'a-z') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return { 
      stats, filtered, totalCategories, withStock, withSales, empty, 
      deadCategories, salesChartData 
    };
  }, [categories, inventory, sales, searchTerm, activeFilter, sortOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name || isAtLimit) return;
    db.categories.add(newCat);
    setNewCat({ name: '', description: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Category Infrastructure</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Classification Ledger</p>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${isAtLimit ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                {categories.length} / {activePlan?.limits.categories >= 999 ? '∞' : activePlan?.limits.categories} Quota
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => {
            if (isAtLimit) navigate('/user/pricing');
            else setShowForm(!showForm);
          }}
          className={`${isAtLimit ? 'bg-slate-800' : 'bg-[#0052FF]'} text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all text-[10px] uppercase tracking-widest w-full md:w-auto`}
        >
          {isAtLimit ? <Lock size={18} /> : <Plus size={18} />} 
          {isAtLimit ? 'Upgrade Tier' : 'Define Category Node'}
        </button>
      </div>

      {/* TASK 1: CATEGORY SUMMARY HEADER */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Nodes', val: analytics.totalCategories, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active (Stock)', val: analytics.withStock, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Revenue Nodes', val: analytics.withSales, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Empty Nodes', val: analytics.empty, icon: Info, color: 'text-rose-600', bg: 'bg-rose-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all">
             <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}><stat.icon size={22}/></div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{stat.val}</h4>
             </div>
          </div>
        ))}
      </div>

      {/* TASK 4: DEAD CATEGORY DETECTION ALERT */}
      {analytics.deadCategories.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2.5rem] flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-900 uppercase">Inactive Nodes Detected</h4>
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1">⚠ {analytics.deadCategories.length} categories are inactive and unused (0 Stock / 0 Sales)</p>
            </div>
          </div>
          <button onClick={() => setActiveFilter('empty')} className="px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-100 transition-all">Review Dead Nodes</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="xl:col-span-8 space-y-8">
          {/* Add Form Section */}
          {showForm && !isAtLimit && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-blue-100 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <Layers size={150} />
              </div>
              <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Category Architect</h3>
                  <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24}/></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Classification Name</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-bold transition-all" 
                      placeholder="e.g. OLED Assemblies, Batteries"
                      value={newCat.name}
                      onChange={(e) => setNewCat({...newCat, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Functional Description</label>
                    <input 
                      type="text" 
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-bold transition-all" 
                      placeholder="Operational brief..."
                      value={newCat.description}
                      onChange={(e) => setNewCat({...newCat, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 bg-[#0052FF] text-white font-black py-4 rounded-2xl shadow-xl hover:bg-blue-600 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
                    <Save size={16} /> Deploy Node
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)}
                    className="px-8 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[10px]"
                  >
                    Discard
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TASK 2 & 7: CATEGORY PERFORMANCE TABLE WITH FILTERS */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
            <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="relative flex-1 max-w-sm group">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                 <input 
                   type="text" 
                   placeholder="Search nodes..." 
                   className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
               <div className="flex flex-wrap items-center gap-3">
                  {/* Task 7: UI Filter Nodes */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl">
                    <Filter size={14} className="text-slate-400" />
                    <select 
                      value={activeFilter}
                      onChange={(e) => setActiveFilter(e.target.value as any)}
                      className="bg-transparent text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer"
                    >
                      <option value="all">All Classifications</option>
                      <option value="active">Active Nodes Only</option>
                      <option value="empty">Empty Nodes Only</option>
                      <option value="revenue">Revenue Generating</option>
                    </select>
                  </div>

                  <button 
                    onClick={() => setSortOrder(sortOrder === 'a-z' ? 'none' : 'a-z')}
                    className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-all ${sortOrder === 'a-z' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
                  >
                    <SortAsc size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">A–Z</span>
                  </button>
               </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-6">Node Classification</th>
                    <th className="px-6 py-6 text-center">Items</th>
                    <th className="px-6 py-6 text-center">In Stock</th>
                    <th className="px-6 py-6 text-right">Asset Value</th>
                    <th className="px-6 py-6 text-center text-indigo-600">Sold Units</th>
                    <th className="px-6 py-6 text-right text-emerald-600">Revenue</th>
                    <th className="px-10 text-right">Heat Indicator</th>
                    <th className="px-6 py-6 text-center">Status</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {/* TASK 8: EMPTY STATE INTELLIGENCE */}
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-32 px-10 text-center">
                        <div className="max-w-md mx-auto space-y-6">
                           <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner border-2 border-dashed border-indigo-200">
                             <Layers size={40} className="animate-pulse" />
                           </div>
                           <div className="space-y-2">
                             <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">Zero Registry Nodes</h4>
                             <p className="text-sm font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">
                               Categories help organize stock, pricing, and analytics. Create at least one category to activate inventory insights.
                             </p>
                           </div>
                           <button onClick={() => setShowForm(true)} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                             Define First Node
                           </button>
                        </div>
                      </td>
                    </tr>
                  ) : analytics.filtered.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-24 text-center">
                        <Layers size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="font-black uppercase tracking-widest text-xs text-slate-400">No Nodes Identified matching filters</p>
                        <button onClick={() => {setActiveFilter('all'); setSearchTerm(''); setSortOrder('none');}} className="mt-4 text-[9px] font-black text-indigo-600 uppercase underline">Clear All Criteria</button>
                      </td>
                    </tr>
                  ) : (
                    analytics.filtered.map((cat) => (
                      <tr key={cat.id} className="hover:bg-indigo-50/30 transition-all group">
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-xl text-indigo-600 shadow-sm border border-slate-50 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              {cat.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-slate-800 text-sm tracking-tight uppercase truncate max-w-[150px]">{cat.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{cat.description || 'Verified Classification node'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-7 text-center font-bold text-slate-600 text-xs">
                          {cat.itemsCount}
                        </td>
                        <td className="px-6 py-7 text-center font-black text-slate-800 text-xs">
                          {cat.unitsCount}
                        </td>
                        <td className="px-6 py-7 text-right font-black text-slate-900 text-xs">
                          {currency.symbol}{cat.stockValue.toLocaleString()}
                        </td>
                        <td className="px-6 py-7 text-center font-black text-indigo-600 text-xs">
                          {cat.soldUnits}
                        </td>
                        <td className="px-6 py-7 text-right font-black text-emerald-600 text-xs">
                          {currency.symbol}{cat.revenue.toLocaleString()}
                        </td>
                        {/* TASK 5: CATEGORY USAGE HEAT INDICATOR */}
                        <td className="px-10 py-7 text-right">
                           <div className="flex flex-col items-end gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Stock {cat.stockContribution.toFixed(0)}%</span>
                                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500" style={{ width: `${cat.stockContribution}%` }} />
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Rev {cat.revenueContribution.toFixed(0)}%</span>
                                <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${cat.revenueContribution}%` }} />
                                </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-7 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                            cat.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            cat.status === 'Stock Only' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                            'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {cat.status}
                          </span>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm">
                              <Edit2 size={14} />
                            </button>
                            <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="xl:col-span-4 space-y-8">
           {/* TASK 3: CATEGORY SALES CONTRIBUTION GRAPH */}
           {analytics.salesChartData.length > 0 && (
             <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm group hover:shadow-xl transition-all">
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                      <PieChart size={20} />
                   </div>
                   <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 leading-none">Revenue Distribution</h4>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Classification Yield Audit</p>
                   </div>
                </div>
                
                <div className="h-64 relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                         <Pie
                           data={analytics.salesChartData}
                           cx="50%"
                           cy="50%"
                           innerRadius={60}
                           outerRadius={85}
                           paddingAngle={8}
                           dataKey="value"
                           stroke="none"
                         >
                           {analytics.salesChartData.map((_, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                         </Pie>
                         <Tooltip 
                           contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                           itemStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }}
                         />
                      </RePieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Top Yield</span>
                      <span className="text-base font-black text-indigo-600 uppercase truncate max-w-[80px]">{analytics.salesChartData[0]?.name}</span>
                   </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                   {analytics.salesChartData.slice(0, 4).map((d, i) => (
                     <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[9px] font-black text-slate-500 uppercase truncate">{d.name}</span>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {/* HEAT MAP OVERVIEW */}
           <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                 <Flame size={150} />
              </div>
              <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-indigo-50 text-white rounded-xl flex items-center justify-center">
                       <Activity size={20} />
                    </div>
                    <div>
                       <h4 className="text-xs font-black uppercase tracking-widest">Inventory Flow heat</h4>
                       <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1">Real-time Node Velocity</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    {analytics.stats.slice(0, 3).map((cat, i) => (
                      <div key={i} className="space-y-2">
                         <div className="flex justify-between items-end">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{cat.name}</span>
                            <span className="text-[10px] font-black text-indigo-400">{cat.revenueContribution.toFixed(1)}% Weight</span>
                         </div>
                         <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${cat.revenueContribution}%` }} />
                         </div>
                      </div>
                    ))}
                 </div>
                 
                 <div className="mt-10 p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                       Neural engine detected <span className="text-indigo-400 font-black">"{analytics.stats[0]?.name}"</span> as the primary revenue hub for this cycle.
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
