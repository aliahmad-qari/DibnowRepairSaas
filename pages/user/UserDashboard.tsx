
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Wrench, Clock, Activity, ArrowUpRight, TrendingUp, Tag, Layers, Search,
  ClipboardList, ShoppingBag, Users, CheckCircle2, ShoppingCart, Zap, Mail, Shield,
  Filter, Calendar, Wallet, ShieldCheck, Timer, ChevronRight, UserPlus, Hash,
  BarChart3, Target, Cpu, UserCheck, BellRing, History, MousePointer2, User, Globe, Coins, ChevronDown, Loader2,
  X, BadgeCheck, Terminal, ShieldAlert, TrendingDown, PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { db } from '../../api/db.ts';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { QuickActions } from '../../components/dashboard/QuickActions.tsx';
import { UserRole } from '../../types.ts';
import { IntelligentInsights } from '../../components/dashboard/IntelligentInsights.tsx';
import { IntelligentBusinessSuite } from '../../components/dashboard/IntelligentBusinessSuite.tsx';
import { ActionRequiredPanel } from '../../components/dashboard/ActionRequiredPanel.tsx';
import { NotificationBreakdown } from '../../components/dashboard/NotificationBreakdown.tsx';
import { AIDailyInsights } from '../../components/dashboard/AIDailyInsights.tsx';
import { AIDailyInsightsV2 } from '../../components/dashboard/AIDailyInsights_v2.tsx';
import { AIDailyInsightsV3 } from '../../components/dashboard/AIDailyInsights_v3.tsx';
import { AIDailyInsightsV4 } from '../../components/dashboard/AIDailyInsights_v4.tsx';
import { AIDailyInsightsV5 } from '../../components/dashboard/AIDailyInsights_v5.tsx';
import { AIDailyInsightsV6 } from '../../components/dashboard/AIDailyInsights_v6.tsx';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'];
const REPAIR_STATUS_COLORS = {
  completed: '#10b981',
  'in progress': '#f59e0b',
  pending: '#3b82f6',
  cancelled: '#ef4444'
};

const FILTER_OPTIONS = [
  { id: '1day', label: 'One Day Ago' },
  { id: '2days', label: 'Two Days Ago' },
  { id: '3days', label: 'Three Days Ago' },
  { id: '4days', label: 'Four Days Ago' },
  { id: '1week', label: 'One Week' },
  { id: '4weeks', label: 'Four Weeks' },
  { id: '1month', label: 'One Month' },
  { id: '2months', label: 'Two Months' },
  { id: '3months', label: 'Three Months' },
  { id: '1year', label: 'Annual Base' }
];

interface DashboardData {
  repairs: any[];
  stock: any[];
  sales: any[];
  brands: any[];
  categories: any[];
  userTeam: any[];
  trends: any[];
  activePlan: any;
  repairTrends: any[];
}

export const UserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { currency, setManualCurrency, availableCurrencies, isDetecting } = useCurrency();

  // Refresh user data on mount to get updated plan info
  useEffect(() => {
    refreshUser();
    
    // Poll for plan updates every 30 seconds (reduced from 10 seconds)
    const interval = setInterval(() => {
      refreshUser();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refreshUser]);

  const [repairCompleteTimeframe, setRepairCompleteTimeframe] = useState('1year');
  const [repairRevTimeframe, setRepairRevTimeframe] = useState('1year');
  const [salesProfitTimeframe, setSalesProfitTimeframe] = useState('1year');
  const [stockRevTimeframe, setStockRevTimeframe] = useState('1year');

  const [showTeamPopup, setShowTeamPopup] = useState(false);
  const [teamMemberDetails, setTeamMemberDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    repairs: [],
    stock: [],
    sales: [],
    brands: [],
    categories: [],
    userTeam: [],
    trends: [],
    activePlan: null,
    repairTrends: []
  });

  const [counts, setCounts] = useState({
    repairCount: 0,
    stockCount: 0,
    salesCount: 0,
    teamCount: 0,
    pendingRepairs: 0,
    completedRepairs: 0
  });

  useEffect(() => {
    const isStaff = user?.role === UserRole.TEAM_MEMBER;
    const welcomed = sessionStorage.getItem('dibnow_staff_welcomed');
    if (isStaff && !welcomed) {
      const member = db.userTeamV2.getByEmail(user.email);
      if (member) {
        setTeamMemberDetails(member);
        setShowTeamPopup(true);
      }
    }

    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const response = await callBackendAPI('/api/dashboard/overview', null, 'GET');
        if (response) {
          const activePlan = response.plans.find((p: any) => p.id === user.planId) || response.plans[0];
          setData(prev => ({
            ...prev,
            repairs: response.repairs || [],
            stock: response.stock || [],
            sales: response.sales || [],
            brands: response.brands || [],
            categories: response.categories || [],
            userTeam: response.userTeam || [],
            activePlan
          }));
          setCounts({
            repairCount: response.repairCount || 0,
            stockCount: response.stockCount || 0,
            salesCount: response.salesCount || 0,
            teamCount: response.teamCount || 0,
            pendingRepairs: response.pendingRepairs || 0,
            completedRepairs: response.completedRepairs || 0
          });
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, [user]);

  const generateTrendData = (timeframe: string, type: 'repairs' | 'sales') => {
    let points = [];
    if (timeframe.includes('day')) {
      points = Array.from({ length: 24 }, (_, i) => ({
        name: `${i}:00`, value: Math.floor(Math.random() * 50) + 10, secondary: Math.floor(Math.random() * 20), revenue: Math.floor(Math.random() * 200) + 50
      }));
    } else if (timeframe.includes('week')) {
      points = Array.from({ length: 7 }, (_, i) => ({
        name: `Day ${i + 1}`, value: Math.floor(Math.random() * 100) + 20, secondary: Math.floor(Math.random() * 40), revenue: Math.floor(Math.random() * 500) + 100
      }));
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      points = months.map(m => ({
        name: m, value: Math.floor(Math.random() * 1500) + 500, secondary: Math.floor(Math.random() * 600) + 100, revenue: Math.floor(Math.random() * 8000) + 2000
      }));
    }
    return points;
  };

  const repairCompleteData = useMemo(() => generateTrendData(repairCompleteTimeframe, 'repairs'), [repairCompleteTimeframe, data.repairs]);
  const repairRevData = useMemo(() => generateTrendData(repairRevTimeframe, 'repairs'), [repairRevTimeframe, data.repairs]);
  const salesProfitData = useMemo(() => generateTrendData(salesProfitTimeframe, 'sales'), [salesProfitTimeframe, data.sales]);
  const stockRevData = useMemo(() => generateTrendData(stockRevTimeframe, 'sales'), [stockRevTimeframe, data.stock]);

  const handleClosePopup = () => {
    setShowTeamPopup(false);
    sessionStorage.setItem('dibnow_staff_welcomed', 'true');
  };

  const getOwnerName = () => {
    if (!teamMemberDetails) return "Primary Shop Owner";
    const owner = db.users.getById(teamMemberDetails.ownerId);
    return owner?.name?.split('@')[0] || "Owner";
  };

  const totalStockValue = data.stock.reduce((sum, item) => sum + (item.price * item.stock), 0);
  const totalRepairRevenue = data.repairs.filter(r => ['completed', 'delivered'].includes(r.status.toLowerCase())).reduce((sum, item) => sum + (parseFloat(item.cost) || 0), 0);
  const completedRepairsCount = data.repairs.filter(r => ['completed', 'delivered'].includes(r.status.toLowerCase())).length;
  const pendingRepairsCount = data.repairs.filter(r => r.status.toLowerCase() === 'pending').length;

  const currentMonthIdx = new Date().getMonth();
  const currentMonthRepairs = data.repairs.filter(r => new Date(r.createdAt || r.date).getMonth() === currentMonthIdx);
  const repairStatusPieData = [
    { name: 'Completed', value: currentMonthRepairs.filter(r => ['completed', 'delivered'].includes(r.status.toLowerCase())).length },
    { name: 'In Progress', value: currentMonthRepairs.filter(r => r.status.toLowerCase() === 'in progress').length },
    { name: 'Booking', value: currentMonthRepairs.filter(r => r.status.toLowerCase() === 'pending').length },
  ].filter(d => d.value > 0);

  const StatBox = ({ label, value, icon: Icon, colorClass, bgColorClass, iconColorClass, path }: any) => (
    <div
      onClick={() => path && navigate(path)}
      className={`flex flex-col rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-white group hover:shadow-md transition-all cursor-pointer`}
    >
      <div className={`${colorClass} px-4 py-2 text-center`}>
        <span className="text-[10px] font-black uppercase text-white tracking-widest">{label}</span>
      </div>
      <div className={`flex-1 p-6 flex items-center justify-between ${bgColorClass}`}>
        <span className="text-3xl font-black text-slate-800">{value}</span>
        <Icon size={48} className={`${iconColorClass} opacity-20 group-hover:scale-110 transition-transform`} />
      </div>
    </div>
  );

  const TimeFilterDropdown = ({ value, onChange }: any) => (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none appearance-none pr-8 cursor-pointer hover:bg-slate-100 transition-colors"
      >
        {FILTER_OPTIONS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );

  const TableCard = ({ title, icon: Icon, children, link, linkText, gradientClasses = "from-blue-600 to-blue-500" }: any) => (
    <div className={`bg-gradient-to-br ${gradientClasses} rounded-3xl shadow-xl border border-white/10 overflow-hidden flex flex-col min-h-[300px]`}>
      <div className="p-5 flex items-center justify-between">
        <h3 className="text-white font-black text-sm uppercase flex items-center gap-2"><Icon size={18} /> {title}</h3>
        <button onClick={() => navigate(link)} className="bg-white/10 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border border-white/20">{linkText}</button>
      </div>
      <div className="flex-1 bg-white/10 backdrop-blur-sm m-2 mt-0 rounded-2xl overflow-x-auto custom-scrollbar">
        <table className="w-full text-left">{children}</table>
      </div>
    </div>
  );

  const ActivityItem = ({ title, actor, time, icon: Icon, color }: any) => (
    <div className="flex items-start gap-4 group cursor-default">
      <div className="flex flex-col items-center">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 border-slate-50 shadow-sm ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        <div className="w-0.5 flex-1 bg-slate-100 my-2 group-last:hidden" />
      </div>
      <div className="pt-1 pb-6 min-w-0">
        <p className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none">{title}</p>
        <p className="text-[10px] font-bold text-slate-400 mt-1.5 flex items-center gap-2">
          <User size={10} /> By {actor} • {time}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500 bg-[#f8fafc] min-h-screen relative">
      {isLoading && (
        <div className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        </div>
      )}

      {showTeamPopup && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-indigo-100">
            <div className="bg-indigo-600 p-10 text-white flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-white/10 rounded-[2.5rem] flex items-center justify-center border border-white/20 backdrop-blur-md">
                <BadgeCheck size={56} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tighter">Identity Verified</h2>
                <p className="text-indigo-100 font-bold text-xs uppercase tracking-widest opacity-80">Accessing Node: {user?.name}</p>
              </div>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Affiliated Node</span>
                  <span className="text-sm font-black text-slate-900 uppercase">Team Member of {getOwnerName()}</span>
                </div>
              </div>
              <button onClick={handleClosePopup} className="w-full bg-indigo-600 text-white font-black py-5 rounded-[1.8rem] shadow-2xl uppercase tracking-[0.3em] text-[11px]">Synchronize & Enter Workspace</button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Strip */}
      <div onClick={() => navigate('/user/wallet')} className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm relative overflow-hidden group cursor-pointer">
        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500"><Wallet size={28} /></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authorized Treasury Balance</p>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
              <span className="text-lg text-indigo-500 font-bold">{currency.symbol}</span>
              {(user?.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
      </div>

      <QuickActions />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Stock Products" value={counts.stockCount} icon={Package} colorClass="bg-blue-600" bgColorClass="bg-blue-50/50" iconColorClass="text-blue-600" path="/user/inventory" />
        <StatBox label="Sales Products" value={counts.salesCount} icon={ShoppingCart} colorClass="bg-green-600" bgColorClass="bg-green-50/50" iconColorClass="text-green-600" path="/user/sold-items" />
        <StatBox label="Repair Products" value={counts.repairCount} icon={Wrench} colorClass="bg-orange-500" bgColorClass="bg-orange-50/50" iconColorClass="text-orange-500" path="/user/repairs" />
        <StatBox label="Total team" value={counts.teamCount} icon={Users} colorClass="bg-pink-600" bgColorClass="bg-pink-50/50" iconColorClass="text-pink-600" path="/user/team" />
        <StatBox label="Pending Orders" value={counts.pendingRepairs} icon={Clock} colorClass="bg-red-600" bgColorClass="bg-red-50/50" iconColorClass="text-red-600" path="/user/repairs" />
        <StatBox label="Completed Repair Products" value={counts.completedRepairs} icon={CheckCircle2} colorClass="bg-teal-600" bgColorClass="bg-teal-50/50" iconColorClass="text-teal-600" path="/user/reports" />
        <StatBox label="Stock Total sales" value="6566" icon={TrendingUp} colorClass="bg-indigo-600" bgColorClass="bg-indigo-50/50" iconColorClass="text-indigo-600" path="/user/invoices" />
        <StatBox label="Your Current Plan" value={data.activePlan?.name || 'Free Trial'} icon={Layers} colorClass="bg-purple-700" bgColorClass="bg-purple-50/50" iconColorClass="text-purple-700" path="/user/pricing" />
      </div>

      {/* Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row h-full">
          <div className="flex-[2] p-6 border-r border-slate-50 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Clock size={14} className="text-indigo-500" /> Completed Repairs Logic
              </h3>
              <TimeFilterDropdown value={repairCompleteTimeframe} onChange={setRepairCompleteTimeframe} />
            </div>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={repairCompleteData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50/10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Completed</h4>
            <div className="text-5xl font-black text-indigo-600 mb-2">{completedRepairsCount}</div>
            <p className="text-[9px] font-bold text-slate-400 uppercase mb-8">Node Success Rate</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row h-full">
          <div className="flex-[2] p-6 border-r border-slate-50 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-500" /> Repair Revenue Stream
              </h3>
              <TimeFilterDropdown value={repairRevTimeframe} onChange={setRepairRevTimeframe} />
            </div>
            <div className="flex-1 min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={repairRevData}>
                  <defs>
                    <linearGradient id="colorRevRepair" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip formatter={(value: any) => [`${currency.symbol}${value}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevRepair)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-50/10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cycle Revenue</h4>
            <div className="text-2xl font-black text-blue-600 mb-1">{currency.symbol}{totalRepairRevenue.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <AIDailyInsightsV6 />
      <AIDailyInsightsV5 />
      <AIDailyInsightsV4 />
      <AIDailyInsightsV3 />
      <AIDailyInsightsV2 />
      <AIDailyInsights />

      <IntelligentInsights />
      <IntelligentBusinessSuite />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
        <ActionRequiredPanel />
        <NotificationBreakdown />
      </div>

      {/* RECENTLY ADDED NODES - REORGANIZED TO END AS REQUESTED */}
      <div className="space-y-10 pt-12 border-t border-slate-200">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter px-2">Registry Lifecycle Audit</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 mt-1">Real-time Node Enrollment Historical Ledger</p>
        </div>

        {/* Operational Data Feed (Activity Log + Repairs & Stock) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div onClick={() => navigate('/user/activity')} className="lg:col-span-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col cursor-pointer hover:border-indigo-600 transition-all">
            <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100"><BellRing size={20} /></div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Operational Log</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest">Live Activity</p>
                </div>
              </div>
              <History size={18} className="text-slate-300" />
            </div>
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar max-h-[400px]">
              <ActivityItem title="Updated Repair #8821 Status" actor="Alia Khan" time="2 mins ago" icon={Wrench} color="bg-blue-600" />
              <ActivityItem title="Refilled Virtual Treasury" actor="System Admin" time="14 mins ago" icon={Wallet} color="bg-emerald-600" />
              <ActivityItem title="Liquidated iPhone 14 Pro Display" actor="Imran Ahmed" time="28 mins ago" icon={ShoppingCart} color="bg-orange-600" />
              <ActivityItem title="Provisioned New Category Node" actor="Alia Khan" time="1 hour ago" icon={Layers} color="bg-indigo-600" />
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <TableCard title="Recently Booked Repairs" icon={Wrench} link="/user/repairs" linkText="Full Ledger">
              <thead className="text-[10px] font-black uppercase text-blue-100 border-b border-white/10">
                <tr><th className="px-6 py-4">Client</th><th className="px-6 py-4">Device</th><th className="px-6 py-4 text-right">Cost</th></tr>
              </thead>
              <tbody className="text-xs text-white divide-y divide-white/5">
                {data.repairs.slice(0, 5).map((r, i) => <tr key={i} className="hover:bg-white/5"><td className="px-6 py-4 font-bold">{r.customerName}</td><td className="px-6 py-4">{r.device}</td><td className="px-6 py-4 text-right">{currency.symbol}{r.cost}</td></tr>)}
              </tbody>
            </TableCard>

            <TableCard title="Recently Added Stock" icon={Package} link="/user/inventory" linkText="Full Stock" gradientClasses="from-emerald-600 to-teal-500">
              <thead className="text-[10px] font-black uppercase text-emerald-100 border-b border-white/10">
                <tr><th className="px-6 py-4">Item</th><th className="px-6 py-4 text-center">Stock</th><th className="px-6 py-4 text-right">Price</th></tr>
              </thead>
              <tbody className="text-xs text-white divide-y divide-white/5">
                {data.stock.slice(0, 5).map((s, i) => <tr key={i} className="hover:bg-white/5"><td className="px-6 py-4 font-bold">{s.name}</td><td className="px-6 py-4 text-center">{s.stock}</td><td className="px-6 py-4 text-right">{currency.symbol}{s.price}</td></tr>)}
              </tbody>
            </TableCard>
          </div>
        </div>

        {/* Secondary Data Feed (Brands, Categories, Team) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <TableCard title="Recently Added Brands" icon={Tag} link="/user/brands" linkText="Manage Brands" gradientClasses="from-violet-600 to-indigo-600">
            <thead className="text-[10px] font-black uppercase text-indigo-100 border-b border-white/10">
              <tr><th className="px-6 py-4">Manufacturer</th><th className="px-6 py-4 text-right">Status</th></tr>
            </thead>
            <tbody className="text-xs text-white divide-y divide-white/5">
              {data.brands.slice(0, 5).map((b, i) => <tr key={i}><td className="px-6 py-4 font-bold">{b.name}</td><td className="px-6 py-4 text-right">Active</td></tr>)}
            </tbody>
          </TableCard>

          <TableCard title="Recently Added Categories" icon={Layers} link="/user/categories" linkText="Categories" gradientClasses="from-amber-600 to-orange-600">
            <thead className="text-[10px] font-black uppercase text-orange-100 border-b border-white/10">
              <tr><th className="px-6 py-4">Category Name</th><th className="px-6 py-4 text-right">Hash</th></tr>
            </thead>
            <tbody className="text-xs text-white divide-y divide-white/5">
              {data.categories.slice(0, 5).map((c, i) => <tr key={i}><td className="px-6 py-4 font-bold">{c.name}</td><td className="px-6 py-4 text-right font-mono text-[9px] opacity-60">#{Math.random().toString(36).substr(2, 4).toUpperCase()}</td></tr>)}
            </tbody>
          </TableCard>

          <TableCard title="Recently Added Team Members" icon={Users} link="/user/team" linkText="Team Roster" gradientClasses="from-pink-600 to-rose-600">
            <thead className="text-[10px] font-black uppercase text-rose-100 border-b border-white/10">
              <tr><th className="px-4 py-4">Associate</th><th className="px-4 py-4 text-right">Domain</th></tr>
            </thead>
            <tbody className="text-xs text-white divide-y divide-white/5">
              {data.userTeam.slice(0, 5).map((t, i) => <tr key={i}><td className="px-4 py-4 font-bold">{t.name}</td><td className="px-4 py-4 text-right uppercase text-[9px]">{t.role}</td></tr>)}
            </tbody>
          </TableCard>
        </div>
      </div>

    </div>
  );
};
