import React, { useState, useEffect, useMemo } from 'react';
import {
  Tag, Plus, Search, Trash2, Edit2, CheckCircle, Lock, ChevronLeft, Save, X,
  TrendingUp, Package, Info, AlertTriangle, BarChart3, PieChart, Activity,
  Boxes, DollarSign, Filter, SortAsc, Layers, ShieldAlert, BadgeCheck,
  Flame, BellRing, TrendingDown, ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip,
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { db } from '../../api/db';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#06b6d4'];
import Swal from 'sweetalert2';

export const Brands: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [brands, setBrands] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // UI Filter States (Task 7)
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'stock' | 'revenue' | 'inactive'>('all');
  const [sortOrder, setSortOrder] = useState<'a-z' | 'none'>('none');

  const [newBrand, setNewBrand] = useState({ name: '', description: '' });
  const [activePlan, setActivePlan] = useState<any>(null);
  const [isAtLimit, setIsAtLimit] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [brandsResp, invResp, salesResp, dashResp] = await Promise.all([
          callBackendAPI('/api/brands', null, 'GET'),
          callBackendAPI('/api/inventory', null, 'GET'),
          callBackendAPI('/api/sales', null, 'GET'),
          callBackendAPI('/api/dashboard/overview', null, 'GET')
        ]);

        setBrands(Array.isArray(brandsResp) ? brandsResp : []);
        setInventory(Array.isArray(invResp) ? invResp : []);
        setSales(Array.isArray(salesResp) ? salesResp : []);

        // Set plan limits
        if (dashResp && dashResp.plans && Array.isArray(dashResp.plans) && dashResp.plans.length > 0) {
          // Find user's current plan or default to Free Trial
          let plan = null;
          
          // Try to find by planName first (most reliable)
          if (user.planName) {
            plan = dashResp.plans.find((p: any) => 
              p.name.toLowerCase() === user.planName.toLowerCase() ||
              p.name.toLowerCase().includes(user.planName.toLowerCase())
            );
          }
          
          // If not found, use first plan (Free Trial)
          if (!plan) {
            plan = dashResp.plans[0];
          }

          setActivePlan(plan);
          if (plan && plan.limits && plan.limits.brands) {
            setIsAtLimit(brandsResp?.length >= plan.limits.brands);
          } else {
            setIsAtLimit(false);
          }
        } else {
          // Fallback: Set default Free Trial plan limits
          const defaultPlan = {
            name: 'Free Trial',
            limits: { brands: 5, inventory: 50, repairs: 20, sales: 100 }
          };
          setActivePlan(defaultPlan);
          setIsAtLimit(brandsResp?.length >= defaultPlan.limits.brands);
        }
      } catch (error) {
        console.error('Failed to load brands data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [user]);

  // BRAND INTELLIGENCE ENGINE (Tasks 1, 2, 3, 4, 5, 6)
  const intel = useMemo(() => {
    const totalGlobalUnits = inventory.reduce((acc, curr) => acc + curr.stock, 0);
    const totalGlobalRevenue = sales.reduce((acc, curr) => acc + curr.total, 0);

    let stats = brands.map(brand => {
      const brandItems = inventory.filter(i => i.brand === brand.name);
      const brandSales = sales.filter(s => {
        const item = inventory.find(i => i._id === s.productId);
        return item?.brand === brand.name;
      });

      const uniqueCategories = Array.from(new Set(brandItems.map(i => i.category))).length;
      const itemsCount = brandItems.length;
      const unitsCount = brandItems.reduce((acc, curr) => acc + curr.stock, 0);
      const stockValue = brandItems.reduce((acc, curr) => acc + (curr.price * curr.stock), 0);
      const soldUnits = brandSales.reduce((acc, curr) => acc + curr.qty, 0);
      const revenue = brandSales.reduce((acc, curr) => acc + curr.total, 0);

      let status: 'Active' | 'Stock Only' | 'Inactive' = 'Inactive';
      if (unitsCount > 0 && soldUnits > 0) status = 'Active';
      else if (unitsCount > 0) status = 'Stock Only';

      // Task 5: Brand Dependency Data
      const inventoryShare = totalGlobalUnits > 0 ? (unitsCount / totalGlobalUnits) * 100 : 0;
      const revenueShare = totalGlobalRevenue > 0 ? (revenue / totalGlobalRevenue) * 100 : 0;

      // Task 6: Risk & Restock Alert Logic
      let alert: { type: 'restock' | 'risk', msg: string } | null = null;
      if (revenueShare > 15 && unitsCount < 5) {
        alert = { type: 'restock', msg: 'High Yield Node / Low Stock' };
      } else if (inventoryShare > 30 && revenueShare < 5) {
        alert = { type: 'risk', msg: 'High Inventory / Low Liquidity' };
      }

      return {
        ...brand,
        uniqueCategories,
        itemsCount,
        unitsCount,
        stockValue,
        soldUnits,
        revenue,
        status,
        inventoryShare,
        revenueShare,
        alert
      };
    });

    const totalBrandsCount = brands.length;
    const withStock = stats.filter(s => s.unitsCount > 0).length;
    const withSales = stats.filter(s => s.soldUnits > 0).length;
    const inactiveCount = stats.filter(s => s.unitsCount === 0 && s.soldUnits === 0).length;

    // Task 4: Dead Brand Detection
    const deadBrands = stats.filter(s => s.unitsCount === 0 && s.soldUnits === 0);

    // Task 3: Sales Contribution Data
    const chartData = stats
      .filter(s => s.revenue > 0)
      .map(s => ({ name: s.name, revenue: s.revenue, units: s.soldUnits }))
      .sort((a, b) => b.revenue - a.revenue);

    // Task 7: UI Filtering Logic
    let filtered = stats.filter(b =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeFilter === 'active') filtered = filtered.filter(b => b.status === 'Active');
    if (activeFilter === 'stock') filtered = filtered.filter(b => b.status === 'Stock Only');
    if (activeFilter === 'revenue') filtered = filtered.filter(b => b.revenue > 0);
    if (activeFilter === 'inactive') filtered = filtered.filter(b => b.status === 'Inactive');

    if (sortOrder === 'a-z') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
      stats, filtered, totalBrandsCount, withStock, withSales, inactiveCount,
      deadBrands, chartData
    };
  }, [brands, inventory, sales, searchTerm, activeFilter, sortOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.name || isAtLimit || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await callBackendAPI('/api/brands', newBrand, 'POST');
      if (response) {
        setNewBrand({ name: '', description: '' });
        setShowForm(false);
        // Refresh data
        const brandsResp = await callBackendAPI('/api/brands', null, 'GET');
        setBrands(Array.isArray(brandsResp) ? brandsResp : []);
      }
    } catch (error: any) {
      if (error.limitHit) {
        Swal.fire({
          title: 'Requirement Unmet',
          text: error.upgradeMessage || 'You have reached the limit for your current plan.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Upgrade Tier',
          cancelButtonText: 'Analyze Registry',
          confirmButtonColor: '#6366f1',
          cancelButtonColor: '#94a3b8',
          background: '#ffffff',
          customClass: {
            popup: 'rounded-[1.5rem] border-2 border-indigo-50 shadow-2xl',
            title: 'text-xl font-black uppercase text-slate-800 tracking-tightest',
            htmlContainer: 'text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed',
            confirmButton: 'px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-indigo-100',
            cancelButton: 'px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[9px]'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/user/pricing');
          }
        });
      } else {
        console.error('Failed to enroll manufacturer:', error);
        alert(error.message || 'Failed to enroll manufacturer.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (window.confirm("CRITICAL: De-enroll this manufacturer from the registry?")) {
      try {
        await callBackendAPI(`/api/brands/${id}`, null, 'DELETE');
        const brandsResp = await callBackendAPI('/api/brands', null, 'GET');
        setBrands(Array.isArray(brandsResp) ? brandsResp : []);
      } catch (error) {
        console.error('Deletion failed:', error);
        alert('Failed to delete manufacturer.');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      {isLoading && (
        <div className="absolute inset-0 z-[300] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
          <Activity className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 transition-all shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Brand intelligence</h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Manufacturer Ecosystem</p>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${isAtLimit ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                {brands.length} / {activePlan?.limits.brands >= 999 ? '∞' : activePlan?.limits.brands} Quota
              </span>
              {isAtLimit && (
                <button
                  onClick={() => navigate('/user/pricing')}
                  className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md flex items-center gap-1"
                >
                  <ArrowUpRight size={12} />
                  Upgrade Tier
                </button>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            if (isAtLimit) navigate('/user/pricing');
            else setShowForm(!showForm);
          }}
          className={`${isAtLimit ? 'bg-slate-800' : 'bg-indigo-600'} text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all text-[10px] uppercase tracking-widest w-full md:w-auto`}
        >
          {isAtLimit ? <Lock size={18} /> : <Plus size={18} />}
          {isAtLimit ? 'Upgrade tier' : 'Enroll manufacturer'}
        </button>
      </div>

      {/* TASK 1: BRAND OVERVIEW SUMMARY */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Brands', val: intel.totalBrandsCount, icon: Tag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'With Inventory', val: intel.withStock, icon: Boxes, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Revenue Nodes', val: intel.withSales, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Inactive Nodes', val: intel.inactiveCount, icon: Info, color: 'text-rose-600', bg: 'bg-rose-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}><stat.icon size={22} /></div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{stat.val}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* TASK 4: DEAD BRAND DETECTION */}
      {intel.deadBrands.length > 0 && brands.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2.5rem] flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-900 uppercase">Underperforming manufacturers</h4>
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1">⚠ {intel.deadBrands.length} brands have no stock or sales activity detected in this cycle.</p>
            </div>
          </div>
          <button onClick={() => setActiveFilter('inactive')} className="px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl text-[10px] font-black uppercase hover:bg-rose-100 transition-all">Review Dead Nodes</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main List Area */}
        <div className="xl:col-span-8 space-y-8">
          {/* Add Form Section */}
          {showForm && !isAtLimit && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none rotate-12">
                <Tag size={150} />
              </div>
              <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Brand architect</h3>
                  <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Company Title</label>
                    <input
                      required
                      type="text"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold transition-all"
                      placeholder="e.g. Apple, Samsung"
                      value={newBrand.name}
                      onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Brand Brief</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold transition-all"
                      placeholder="e.g. Mobile and Tablet Manufacturer"
                      value={newBrand.description}
                      onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSubmitting ? <Activity className="animate-spin" size={16} /> : <Save size={16} />}
                    {isSubmitting ? 'Deploying...' : 'Deploy node'}
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

          {/* TASK 2 & 7: BRAND PERFORMANCE TABLE WITH FILTERS */}
          <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
            {brands.length > 0 ? (
              <>
                <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="relative flex-1 max-w-sm group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      placeholder="Query manufacturers..."
                      className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl">
                      <Filter size={14} className="text-slate-400" />
                      <select
                        value={activeFilter}
                        onChange={(e) => setActiveFilter(e.target.value as any)}
                        className="bg-transparent text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer"
                      >
                        <option value="all">All Manufacturers</option>
                        <option value="active">Active (Sales + Stock)</option>
                        <option value="stock">Stock Only</option>
                        <option value="revenue">Revenue Generating</option>
                        <option value="inactive">Inactive Nodes</option>
                      </select>
                    </div>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'a-z' ? 'none' : 'a-z')}
                      className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-all ${sortOrder === 'a-z' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}
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
                        <th className="px-10 py-6">Manufacturer Node</th>
                        <th className="px-6 py-6 text-center">Items</th>
                        <th className="px-6 py-6 text-center text-indigo-600">Stock</th>
                        <th className="px-6 py-6 text-right">Asset Value</th>
                        <th className="px-6 py-6 text-center text-emerald-600">Sold</th>
                        <th className="px-6 py-6 text-right text-emerald-600">Revenue</th>
                        <th className="px-10 py-6 text-right">Heat Index</th>
                        <th className="px-6 py-6 text-center">Status</th>
                        <th className="px-10 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {intel.filtered.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-24 text-center">
                            <Tag size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="font-black uppercase tracking-widest text-xs text-slate-400">No registry nodes identified</p>
                          </td>
                        </tr>
                      ) : (
                        intel.filtered.map((brand) => (
                          <tr key={brand._id} className="hover:bg-indigo-50/30 transition-all group">
                            <td className="px-10 py-7">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  {brand.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-black text-slate-800 text-sm tracking-tight uppercase truncate max-w-[150px]">{brand.name}</p>
                                  {/* Task 6: Soft Alerts */}
                                  {brand.alert && (
                                    <p className={`text-[8px] font-black uppercase mt-1 flex items-center gap-1 ${brand.alert.type === 'restock' ? 'text-rose-600' : 'text-amber-600'}`}>
                                      <BellRing size={10} /> {brand.alert.msg}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-7 text-center font-bold text-slate-600 text-xs">
                              {brand.itemsCount}
                            </td>
                            <td className="px-6 py-7 text-center font-black text-slate-800 text-xs">
                              {brand.unitsCount}
                            </td>
                            <td className="px-6 py-7 text-right font-black text-slate-900 text-xs">
                              {currency.symbol}{brand.stockValue.toLocaleString()}
                            </td>
                            <td className="px-6 py-7 text-center font-black text-indigo-600 text-xs">
                              {brand.soldUnits}
                            </td>
                            <td className="px-6 py-7 text-right font-black text-emerald-600 text-xs">
                              {currency.symbol}{brand.revenue.toLocaleString()}
                            </td>
                            {/* Task 5: Heat Map Indicators */}
                            <td className="px-10 py-7 text-right">
                              <div className="flex flex-col items-end gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Inventory {brand.inventoryShare.toFixed(0)}%</span>
                                  <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${brand.inventoryShare}%` }} />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Revenue {brand.revenueShare.toFixed(0)}%</span>
                                  <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${brand.revenueShare}%` }} />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-7 text-center">
                              <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${brand.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                brand.status === 'Stock Only' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                  'bg-rose-50 text-rose-700 border-rose-100'
                                }`}>
                                {brand.status}
                              </span>
                            </td>
                            <td className="px-10 py-7 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDeleteBrand(brand._id)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm">
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
              </>
            ) : (
              /* TASK 9: EMPTY STATE EDUCATION */
              <div className="py-32 px-10 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner border-2 border-dashed border-indigo-100">
                  <Tag size={40} className="animate-pulse" />
                </div>
                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Zero Manufacturer Nodes</h4>
                <p className="text-sm font-bold text-slate-500 max-w-md mx-auto mt-4 leading-relaxed uppercase tracking-tighter">
                  Brands help track performance, pricing power, and inventory risk. Add at least one brand to activate analytics.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-10 px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  Enroll First Manufacturer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Intelligence Sidebar */}
        <div className="xl:col-span-4 space-y-8">
          {/* TASK 3: BRAND SALES CONTRIBUTION GRAPH */}
          {intel.chartData.length > 0 && (
            <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm group hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                  <PieChart size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 leading-none">Revenue share</h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Manufacturer Yield audit</p>
                </div>
              </div>

              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={intel.chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={8}
                      dataKey="revenue"
                      stroke="none"
                    >
                      {intel.chartData.map((_, index) => (
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
                  <span className="text-[8px] font-black text-slate-400 uppercase">Top brand</span>
                  <span className="text-base font-black text-indigo-600 uppercase truncate max-w-[80px]">{intel.chartData[0]?.name}</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {intel.chartData.slice(0, 4).map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-[9px] font-black text-slate-500 uppercase truncate">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand Performance Bar Chart (Units) */}
          {intel.chartData.length > 0 && (
            <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm group hover:shadow-xl transition-all">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 leading-none">Units performance</h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Sales Volume by manufacturer</p>
                </div>
              </div>

              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={intel.chartData.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 900 }} />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
                    <Bar dataKey="units" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* SMART ADVISORY BOX */}
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Activity size={150} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg">
                  <BadgeCheck size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest">Protocol Insight</h4>
                  <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1">Neural Flow Engine</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                    Dependency Node: <span className="text-emerald-400 font-black">"{intel.stats.reduce((prev, current) => (prev.revenueShare > current.revenueShare) ? prev : current, intel.stats[0] || {}).name || 'None'}"</span> accounts for <span className="text-emerald-400 font-black">{intel.stats.reduce((prev, current) => (prev.revenueShare > current.revenueShare) ? prev : current, intel.stats[0] || {}).revenueShare?.toFixed(1) || '0'}%</span> of total shop liquidity.
                  </p>
                </div>
                <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                    Operational Alert: <span className="text-amber-400 font-black">{intel.stats.filter(s => s.alert?.type === 'restock').length} brands</span> show strong demand velocity but critical inventory depletion.
                  </p>
                </div>
              </div>

              <button onClick={() => navigate('/user/inventory')} className="mt-8 w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[9px] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Execute restock protocol</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};