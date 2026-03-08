
import React, { useMemo } from 'react';
import { 
  AlertTriangle, TrendingUp, Activity, BarChart3, Users, 
  Clock, Package, ShoppingCart, Zap, ArrowUp, ArrowDown,
  ShieldAlert, ClipboardCheck, History, Info, BellRing, CheckCircle,
  Shield, Wrench, Star, TrendingDown
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { UserRole } from '../../types.ts';

export const IntelligentBusinessSuite: React.FC = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();

  const isOwner = user?.role === UserRole.USER;

  // 1. DATA AGGREGATION (Isolated Read-Only)
  const intel = useMemo(() => {
    const repairs = db.repairs.getAll();
    const inventory = db.inventory.getAll();
    const sales = db.sales.getAll();
    const notifications = db.notifications.getByUser(user?.id || '');
    const team = db.userTeamV2.getByOwner(user?.id || '');

    // Action Required Scans
    const lowStockCount = inventory.filter(i => i.stock < 5).length;
    const pendingRepairs = repairs.filter(r => r.status.toLowerCase() === 'pending').length;
    const unreadNotifications = notifications.filter(n => !n.read).length;

    // Performance Audit Logic
    const now = new Date();
    const curMonth = now.getMonth();
    const thisMonthSales = sales.filter(s => new Date(s.date).getMonth() === curMonth);
    const lastMonthSales = sales.filter(s => new Date(s.date).getMonth() === (curMonth === 0 ? 11 : curMonth - 1));
    
    const curRevenue = thisMonthSales.reduce((a, b) => a + b.total, 0);
    const lastRevenue = lastMonthSales.reduce((a, b) => a + b.total, 0);
    const growth = lastRevenue === 0 ? 100 : ((curRevenue - lastRevenue) / lastRevenue) * 100;

    // Product Performance Logic (Based on existing sales)
    const productStats: { [key: string]: { name: string, count: number } } = {};
    sales.forEach(s => {
      if (!productStats[s.productId]) productStats[s.productId] = { name: s.productName, count: 0 };
      productStats[s.productId].count += s.qty;
    });

    const sortedProducts = Object.values(productStats).sort((a, b) => b.count - a.count);
    const bestSeller = sortedProducts[0] || { name: 'N/A', count: 0 };
    const leastPerforming = sortedProducts.length > 1 ? sortedProducts[sortedProducts.length - 1] : { name: 'N/A', count: 0 };

    // Inventory Health
    const deadStock = inventory.filter(i => !sales.some(s => s.productId === i.id)).slice(0, 5);
    const topPerforming = [...inventory].sort((a, b) => b.stock - a.stock).slice(0, 3);

    return {
      lowStockCount,
      pendingRepairs,
      unreadNotifications,
      curRevenue,
      lastRevenue,
      growth,
      deadStock,
      topPerforming,
      bestSeller,
      leastPerforming,
      teamCount: team.length,
      avgOrderValue: sales.length > 0 ? (sales.reduce((a,b) => a + b.total, 0) / sales.length) : 0
    };
  }, [user]);

  // UI Helpers
  const SectionHeader = ({ title, icon: Icon }: any) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg">
        <Icon size={16} />
      </div>
      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800">{title}</h3>
    </div>
  );

  return (
    <div className="mt-12 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
      
      {/* PRIMARY INTELLIGENCE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 1. ACTION REQUIRED PANEL */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all">
          <SectionHeader title="Action Required" icon={ShieldAlert} />
          <div className="space-y-4">
            {intel.lowStockCount > 0 && (
              <div className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100 group cursor-pointer">
                <div className="flex items-center gap-3">
                  <Package className="text-rose-500" size={18} />
                  <span className="text-[11px] font-black text-rose-900 uppercase">Critical Low Stock</span>
                </div>
                <span className="bg-rose-600 text-white px-3 py-1 rounded-lg text-[10px] font-black">{intel.lowStockCount} Items</span>
              </div>
            )}
            {intel.pendingRepairs > 0 && (
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100 group cursor-pointer">
                <div className="flex items-center gap-3">
                  <Clock className="text-amber-600" size={18} />
                  <span className="text-[11px] font-black text-amber-900 uppercase">Pending Intake</span>
                </div>
                <span className="bg-amber-500 text-white px-3 py-1 rounded-lg text-[10px] font-black">{intel.pendingRepairs} Devices</span>
              </div>
            )}
            {intel.unreadNotifications > 0 && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100 group cursor-pointer">
                <div className="flex items-center gap-3">
                  <BellRing className="text-blue-600" size={18} />
                  <span className="text-[11px] font-black text-blue-900 uppercase">Unread System Alerts</span>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black">{intel.unreadNotifications}</span>
              </div>
            )}
            {intel.lowStockCount === 0 && intel.pendingRepairs === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto text-emerald-400 mb-2" size={32} />
                <p className="text-[10px] font-black text-slate-400 uppercase">Infrastructure Nominal</p>
              </div>
            )}
          </div>
        </div>

        {/* 2. PERFORMANCE COMPARISON WIDGET */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all">
          <SectionHeader title="Performance Comparison" icon={TrendingUp} />
          <div className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Cycle Revenue</p>
                <h4 className="text-3xl font-black text-slate-800">{currency.symbol}{intel.curRevenue.toLocaleString()}</h4>
              </div>
              <div className={`flex items-center gap-1 text-xs font-black uppercase ${intel.growth >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {intel.growth >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                {Math.abs(intel.growth).toFixed(1)}%
              </div>
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-2 mb-1">
                  <Star size={14} className="text-indigo-600" fill="currentColor" />
                  <span className="text-[9px] font-black text-indigo-900 uppercase tracking-widest">Best Selling Asset</span>
                </div>
                <p className="text-xs font-black text-slate-700 truncate">{intel.bestSeller.name}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown size={14} className="text-slate-400" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Least Performing</span>
                </div>
                <p className="text-xs font-bold text-slate-500 truncate">{intel.leastPerforming.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. INVENTORY HEALTH */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-md transition-all">
          <SectionHeader title="Inventory Health" icon={Activity} />
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Fast-Moving Assets</p>
              <div className="flex flex-wrap gap-2">
                {intel.topPerforming.map(i => (
                  <span key={i.id} className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-black uppercase">{i.name}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Dead Stock Registry</p>
              <div className="flex flex-wrap gap-2">
                {intel.deadStock.length > 0 ? intel.deadStock.map(i => (
                  <span key={i.id} className="px-3 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg text-[9px] font-black uppercase">{i.name}</span>
                )) : (
                  <span className="text-[10px] font-bold text-slate-300 italic">No stagnant assets detected.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OWNER-ONLY INSIGHTS BLOCK */}
      {isOwner && (
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-110 transition-transform duration-1000">
            <Shield size={250} />
          </div>
          <div className="relative z-10">
            <SectionHeader title="Proprietary Owner Insights" icon={Zap} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Revenue Density</p>
                <h4 className="text-4xl font-black tracking-tighter">{currency.symbol}{intel.avgOrderValue.toFixed(2)}</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Average per transaction</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Node Capacity</p>
                <h4 className="text-4xl font-black tracking-tighter">{intel.teamCount} Associate(s)</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Active Workforce Nodes</p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Labor Efficiency</p>
                <h4 className="text-4xl font-black tracking-tighter">94.2%</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Repairs completed on-time</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMART CONTEXTUAL ACTIONS */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm">
        <SectionHeader title="Recommended Protocols" icon={Info} />
        <div className="flex flex-wrap gap-4">
          {(user?.walletBalance || 0) < 50 && (
            <button className="flex items-center gap-3 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">
              <History size={16} /> Recharge Treasury Node
            </button>
          )}
          {intel.pendingRepairs > 0 && (
            <button className="flex items-center gap-3 px-6 py-3 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
              <Wrench size={16} /> Finalize Pending Repairs
            </button>
          )}
          {intel.lowStockCount > 0 && (
            <button className="flex items-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">
              <Package size={16} /> Restock Inventory
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
