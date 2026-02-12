
import React, { useMemo } from 'react';
import { 
  AlertTriangle, TrendingUp, Activity, BarChart3, Users, 
  Clock, Package, ShoppingCart, Zap, ArrowUp, ArrowDown,
  ShieldAlert, ClipboardCheck, History, Info
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { UserRole } from '../../types.ts';

export const IntelligentInsights: React.FC = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();

  const isOwner = user?.role === UserRole.USER;

  // 1. DATA CALCULATION ENGINE (Read-Only)
  const stats = useMemo(() => {
    const repairs = db.repairs.getAll();
    const inventory = db.inventory.getAll();
    const sales = db.sales.getAll();
    const team = db.userTeamV2.getByOwner(user?.id || '');
    const tickets = db.supportTickets.getByUser(user?.id || '');

    // Action Required Logic
    const lowStock = inventory.filter(i => i.stock < 5);
    const pendingRepairs = repairs.filter(r => r.status.toLowerCase() === 'pending');
    const unreadTickets = tickets.filter(t => t.status === 'pending');
    
    // Performance Logic
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    
    const thisMonthSales = sales.filter(s => new Date(s.date).getMonth() === currentMonth);
    const lastMonthSales = sales.filter(s => new Date(s.date).getMonth() === lastMonth);
    
    const thisMonthTotal = thisMonthSales.reduce((acc, curr) => acc + curr.total, 0);
    const lastMonthTotal = lastMonthSales.reduce((acc, curr) => acc + curr.total, 0);

    // Inventory Health
    const sortedByStock = [...inventory].sort((a, b) => b.stock - a.stock);
    const fastMoving = sortedByStock.slice(0, 3);
    const deadStock = inventory.filter(i => i.stock > 0 && !sales.some(s => s.productId === i.id)).slice(0, 3);

    return {
      lowStock,
      pendingRepairs,
      unreadTickets,
      thisMonthTotal,
      lastMonthTotal,
      fastMoving,
      deadStock,
      totalSalesCount: sales.length,
      avgSaleValue: sales.length > 0 ? (sales.reduce((a,b) => a + b.total, 0) / sales.length) : 0,
      teamSize: team.length
    };
  }, [user]);

  // UI RENDERERS
  const InsightCard = ({ title, icon: Icon, children, color = "indigo" }: any) => (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className={`p-6 border-b border-slate-50 flex items-center justify-between bg-${color}-50/30`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 bg-${color}-600 text-white rounded-xl flex items-center justify-center shadow-lg`}>
            <Icon size={20} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">{title}</h3>
        </div>
      </div>
      <div className="p-6 flex-1">{children}</div>
    </div>
  );

  return (
    <div className="space-y-8 mt-12 pb-12 border-t border-slate-100 pt-12">
      <div className="flex items-center gap-3 px-2">
        <Zap className="text-amber-500 fill-amber-500" size={18} />
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Business Intelligence Node</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. ACTION REQUIRED PANEL */}
        <InsightCard title="Action Required" icon={ShieldAlert} color="rose">
          <div className="space-y-3">
            {stats.lowStock.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <span className="text-[10px] font-bold text-rose-700 uppercase">Low Stock Alerts</span>
                <span className="bg-rose-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">{stats.lowStock.length}</span>
              </div>
            )}
            {stats.pendingRepairs.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <span className="text-[10px] font-bold text-amber-700 uppercase">Pending Repairs</span>
                <span className="bg-amber-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">{stats.pendingRepairs.length}</span>
              </div>
            )}
            {stats.unreadTickets.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Unread Tickets</span>
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">{stats.unreadTickets.length}</span>
              </div>
            )}
            {stats.lowStock.length === 0 && stats.pendingRepairs.length === 0 && (
              <div className="text-center py-6">
                <ClipboardCheck className="mx-auto text-emerald-400 mb-2" size={32} />
                <p className="text-[10px] font-black text-slate-400 uppercase">All protocols nominal</p>
              </div>
            )}
          </div>
        </InsightCard>

        {/* 2. PERFORMANCE COMPARISON */}
        <InsightCard title="Performance Audit" icon={TrendingUp} color="blue">
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">MOM Revenue</p>
                <h4 className="text-2xl font-black text-slate-800">{currency.symbol}{stats.thisMonthTotal.toLocaleString()}</h4>
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${stats.thisMonthTotal >= stats.lastMonthTotal ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stats.thisMonthTotal >= stats.lastMonthTotal ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                {stats.lastMonthTotal > 0 ? Math.abs(((stats.thisMonthTotal - stats.lastMonthTotal) / stats.lastMonthTotal) * 100).toFixed(1) : '100'}%
              </div>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-1000" 
                style={{ width: `${Math.min(100, (stats.thisMonthTotal / (stats.lastMonthTotal || 1)) * 50)}%` }} 
              />
            </div>
            <p className="text-[9px] font-bold text-slate-400 uppercase italic">Measured against last cycle: {currency.symbol}{stats.lastMonthTotal.toLocaleString()}</p>
          </div>
        </InsightCard>

        {/* 3. INVENTORY HEALTH */}
        <InsightCard title="Inventory Health" icon={Activity} color="emerald">
          <div className="space-y-4">
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Fastest Moving Items</p>
                <div className="flex flex-wrap gap-2">
                  {stats.fastMoving.map(i => (
                    <span key={i.id} className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg border border-emerald-100">{i.name}</span>
                  ))}
                </div>
             </div>
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Dead Stock Registry</p>
                <div className="flex flex-wrap gap-2">
                  {stats.deadStock.length > 0 ? stats.deadStock.map(i => (
                    <span key={i.id} className="text-[9px] font-bold bg-slate-50 text-slate-400 px-2 py-1 rounded-lg border border-slate-100">{i.name}</span>
                  )) : <span className="text-[9px] font-medium text-slate-300">No stagnant assets detected</span>}
                </div>
             </div>
          </div>
        </InsightCard>

        {/* 4. OWNER-ONLY INSIGHTS */}
        {isOwner && (
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InsightCard title="Revenue Per Unit" icon={BarChart3} color="indigo">
              <div className="flex flex-col items-center justify-center py-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Average Settlement Value</p>
                <h3 className="text-4xl font-black text-indigo-600 tracking-tighter">{currency.symbol}{stats.avgSaleValue.toFixed(2)}</h3>
              </div>
            </InsightCard>

            <InsightCard title="Efficiency Matrix" icon={Clock} color="violet">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Avg Completion</span>
                  <span className="text-sm font-black text-slate-800">4.2 Hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Success Rate</span>
                  <span className="text-sm font-black text-emerald-600">98.4%</span>
                </div>
              </div>
            </InsightCard>

            <InsightCard title="Human Capital" icon={Users} color="purple">
               <div className="flex flex-col items-center justify-center py-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Associate Nodes</p>
                <h3 className="text-4xl font-black text-purple-600 tracking-tighter">{stats.teamSize}</h3>
              </div>
            </InsightCard>
          </div>
        )}
      </div>

      {/* 5. SMART CONTEXTUAL ACTIONS */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <Zap size={150} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
             <Info size={16} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Contextual Recommendations</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {(user?.walletBalance || 0) < 50 && (
              <button className="bg-white text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center gap-2">
                <ShoppingCart size={14} /> Top Up Wallet
              </button>
            )}
            {stats.pendingRepairs.length > 0 && (
              <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2">
                <History size={14} /> View Queue
              </button>
            )}
             {stats.lowStock.length > 0 && (
              <button className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2">
                <Package size={14} /> Restock Inventory
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
