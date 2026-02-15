import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, UserPlus, Search, Phone, Mail, MoreHorizontal, History,
  TrendingUp, UsersRound, UserMinus, ShieldCheck, DollarSign,
  ChevronLeft, Smartphone, ShoppingBag, BadgeCheck, AlertCircle,
  Clock, Package, Star, X, AlertTriangle, MessageSquare, Receipt,
  Zap, Calendar, User as UserIcon, ShieldAlert, TrendingDown,
  Trash2, Filter, UserCheck, ArrowRight,
  /* FIX: Imported missing 'Wrench' and 'ShoppingCart' icons */
  Wrench, ShoppingCart
} from 'lucide-react';
import { db } from '../../api/db';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { Loader2 } from 'lucide-react';

type CustomerFilter = 'all' | 'active' | 'inactive' | 'high_value' | 'complaints' | 'new';

export const Clients: React.FC = () => {
  const navigate = useNavigate();
  const { currency } = useCurrency();
  const [clients, setClients] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<CustomerFilter>('all');
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '' });

  // State for Task 3 Timeline
  const [selectedClientForTimeline, setSelectedClientForTimeline] = useState<any | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [clientsResp, repairsResp, salesResp, complaintsResp] = await Promise.all([
          callBackendAPI('/api/clients', null, 'GET'),
          callBackendAPI('/api/repairs', null, 'GET'),
          callBackendAPI('/api/sales', null, 'GET'),
          callBackendAPI('/api/complaints', null, 'GET') // Assuming this exists or returns []
        ]);

        setClients(clientsResp || []);
        setRepairs(repairsResp || []);
        setSales(salesResp || []);
        // Handle if complaints endpoint doesn't exist yet
        setComplaints(Array.isArray(complaintsResp) ? complaintsResp : []);
      } catch (error) {
        console.error('Failed to load CRM data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  // CUSTOMER INTELLIGENCE ENGINE (Tasks 1, 2, 4, 5, 6, 8)
  const intel = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let stats = clients.map(client => {
      const clientRepairs = repairs.filter(r => r.customerName === client.name);
      const clientSales = sales.filter(s => s.customer === client.name);
      const clientComplaints = complaints.filter(c => c.user === client.name || c.userId === client._id || c.userId === client.id);

      const repairCount = clientRepairs.length;
      const purchaseCount = clientSales.length;
      const cancelCount = clientRepairs.filter(r => r.status?.toLowerCase() === 'cancelled').length;
      const totalSpend = [...clientRepairs, ...clientSales].reduce((acc, curr) => acc + (parseFloat(curr.cost || curr.total) || 0), 0);

      const allDates = [
        ...clientRepairs.map(r => new Date(r.date)),
        ...clientSales.map(s => {
          const [d, m, y] = s.date.split('/');
          return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
        })
      ].filter(d => !isNaN(d.getTime()));

      const lastVisitDate = allDates.length > 0 ? new Date(Math.max(...allDates.map(d => d.getTime()))) : null;
      const daysSinceLastVisit = lastVisitDate ? Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 3600 * 24)) : 999;

      let loyalty: 'Loyal' | 'Occasional' | 'Dormant' = 'Dormant';
      if (repairCount + purchaseCount >= 3) loyalty = 'Loyal';
      else if (repairCount + purchaseCount >= 1) loyalty = 'Occasional';

      // Task 5: Risk Detection
      const needsSupport = clientComplaints.length >= 2 || cancelCount >= 2;

      // Task 8: Source Identification
      const sources = [];
      if (repairCount > 0) sources.push({ label: 'Repair', icon: Wrench, color: 'text-blue-600 bg-blue-50' });
      if (purchaseCount > 0) sources.push({ label: 'POS', icon: ShoppingCart, color: 'text-emerald-600 bg-emerald-50' });
      if (client.planId && client.planId !== 'starter') sources.push({ label: 'Sub', icon: Zap, color: 'text-indigo-600 bg-indigo-50' });

      return {
        ...client,
        repairCount,
        purchaseCount,
        totalSpend,
        complaintCount: clientComplaints.length,
        cancelCount,
        lastVisit: lastVisitDate ? lastVisitDate.toLocaleDateString() : 'N/A',
        daysSinceLastVisit,
        loyalty,
        needsSupport,
        sources,
        isNew: new Date(client.createdAt || Date.now()) >= sevenDaysAgo,
        // Detailed data for timeline
        rawRepairs: clientRepairs,
        rawSales: clientSales,
        rawComplaints: clientComplaints
      };
    });

    // Task 4: High Value Identification
    const topSpenders = [...stats].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5).map(c => c._id || c.id);
    const topRepairClients = [...stats].sort((a, b) => b.repairCount - a.repairCount).slice(0, 5).map(c => c._id || c.id);

    stats = stats.map(s => ({
      ...s,
      isHighValue: topSpenders.includes(s._id || s.id) || topRepairClients.includes(s._id || s.id)
    }));

    // Task 7: Filtering Logic
    let filtered = stats.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeTabFilter === 'active') filtered = filtered.filter(s => s.daysSinceLastVisit <= 30);
    if (activeTabFilter === 'inactive') filtered = filtered.filter(s => s.daysSinceLastVisit > 30);
    if (activeTabFilter === 'high_value') filtered = filtered.filter(s => s.isHighValue);
    if (activeTabFilter === 'complaints') filtered = filtered.filter(s => s.complaintCount > 0);
    if (activeTabFilter === 'new') filtered = filtered.filter(s => s.isNew);

    const total = stats.length;
    const active = stats.filter(s => s.daysSinceLastVisit <= 30).length;
    const returning = stats.filter(s => (s.repairCount + s.purchaseCount) > 1).length;
    const inactive = stats.filter(s => s.daysSinceLastVisit > 30).length;

    return { stats, filtered, total, active, returning, inactive };
  }, [clients, repairs, sales, complaints, searchTerm, activeTabFilter]);

  // Task 3: Timeline Aggregator
  const clientTimeline = useMemo(() => {
    if (!selectedClientForTimeline) return [];

    const events = [
      ...selectedClientForTimeline.rawRepairs.map((r: any) => ({
        type: 'REPAIR',
        title: `Repair Created: ${r.device}`,
        date: new Date(r.date),
        displayDate: r.date,
        val: `${currency.symbol}${r.cost}`,
        icon: Smartphone,
        color: 'bg-blue-500'
      })),
      ...selectedClientForTimeline.rawSales.map((s: any) => ({
        type: 'POS',
        title: `POS Purchase: ${s.productName}`,
        date: new Date(s.date.split('/').reverse().join('-')),
        displayDate: s.date,
        val: `${currency.symbol}${s.total}`,
        icon: ShoppingBag,
        color: 'bg-emerald-500'
      })),
      ...selectedClientForTimeline.rawComplaints.map((c: any) => ({
        type: 'COMPLAINT',
        title: `Issue Logged: ${c.subject}`,
        date: new Date(c.date),
        displayDate: c.date,
        val: c.status.toUpperCase(),
        icon: MessageSquare,
        color: 'bg-rose-500'
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return events;
  }, [selectedClientForTimeline, currency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await callBackendAPI('/api/clients', newClient, 'POST');
      setNewClient({ name: '', phone: '', email: '' });
      setShowForm(false);
      // Refresh
      const clientsResp = await callBackendAPI('/api/clients', null, 'GET');
      setClients(clientsResp || []);
    } catch (error) {
      console.error('Enrollment failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 shadow-sm transition-all">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Client CRM</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
              <Zap size={12} className="text-indigo-600" /> Retention & Growth Intelligence
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all text-[11px] uppercase tracking-widest w-full md:w-auto"
        >
          <UserPlus size={18} /> Enroll New Identity
        </button>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registry', val: intel.total, icon: UsersRound, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Active (30d)', val: intel.active, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Returning Nodes', val: intel.returning, icon: BadgeCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Dormant Segments', val: intel.inactive, icon: UserMinus, color: 'text-rose-600', bg: 'bg-rose-50' }
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

      {showForm && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-indigo-100 shadow-2xl animate-in zoom-in-95 duration-200">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Identity Enrollment</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={24} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Name</label>
                <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-sm" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Phone Uplink</label>
                <input required type="tel" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-sm" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Communication Node (Email)</label>
                <input required type="email" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-sm" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
              </div>
            </div>
            <div className="pt-4 flex gap-3">
              <button disabled={isSubmitting} type="submit" className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-[11px] disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : null}
                {isSubmitting ? 'Authorizing...' : 'Authorize Enrollment'}
              </button>
              <button disabled={isSubmitting} type="button" onClick={() => setShowForm(false)} className="px-8 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[11px]">Discard</button>
            </div>
          </form>
        </div>
      )}

      {/* CUSTOMER VALUE MODULE */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600 min-h-[400px] flex flex-col relative">
        {isLoading && (
          <div className="absolute inset-0 z-[300] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <Users className="w-12 h-12 text-indigo-600 animate-spin" />
          </div>
        )}
        {clients.length === 0 ? (
          /* TASK 9: EMPTY STATE EDUCATION */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-700">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-inner border border-indigo-100">
              <Users size={40} className="animate-pulse" />
            </div>
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Zero Identities Detected</h3>
            <p className="text-slate-500 font-bold max-w-md mx-auto mt-4 leading-relaxed uppercase tracking-tighter text-sm">
              Customers help you track revenue, loyalty, and service quality. Add your first client to unlock business analytics.
            </p>
            <button onClick={() => setShowForm(true)} className="mt-10 px-10 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
              <UserPlus size={18} /> Enroll First Client Node
            </button>
          </div>
        ) : (
          <>
            <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Task 7: Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Clients', icon: Users },
                  { id: 'active', label: 'Active', icon: UserCheck },
                  { id: 'inactive', label: 'Inactive', icon: UserMinus },
                  { id: 'high_value', label: 'High Value', icon: Star },
                  { id: 'complaints', label: 'Support Issues', icon: MessageSquare },
                  { id: 'new', label: 'New (7D)', icon: Zap },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabFilter(tab.id as CustomerFilter)}
                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${activeTabFilter === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}
                  >
                    <tab.icon size={12} /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 max-w-sm group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Query Name, Email, or Phone..."
                  className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
                  <tr>
                    <th className="px-10 py-6">Customer identity</th>
                    <th className="px-6 py-6 text-center">Protocol Source</th>
                    <th className="px-6 py-6 text-center">Settlement Node</th>
                    <th className="px-6 py-6 text-right">Total Flow</th>
                    <th className="px-6 py-6 text-center">Retention status</th>
                    <th className="px-6 py-6 text-center">Flags</th>
                    <th className="px-6 py-6 text-center">Loyalty Index</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {intel.filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-24 text-center">
                        <Users size={48} className="mx-auto mb-4 opacity-10" />
                        <p className="font-black uppercase tracking-widest text-xs text-slate-400">No identities identified in filtered registry</p>
                        <button onClick={() => { setActiveTabFilter('all'); setSearchTerm(''); }} className="mt-4 text-indigo-600 font-black uppercase text-[10px] hover:underline">Reset Search Nodes</button>
                      </td>
                    </tr>
                  ) : (
                    intel.filtered.map(client => (
                      <tr
                        key={client._id}
                        onClick={() => setSelectedClientForTimeline(client)}
                        className="hover:bg-indigo-50/30 transition-all group cursor-pointer"
                      >
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-xl text-indigo-600 shadow-sm border border-slate-50 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                              {client.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-black text-slate-800 text-sm tracking-tight uppercase block truncate">{client.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 lowercase">{client.email}</span>
                                {client.isNew && <span className="text-[7px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-widest">New Node</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Task 8: Automated Source Tagging */}
                        <td className="px-6 py-7">
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {client.sources.map((src: any, i: number) => (
                              <div key={i} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border border-transparent hover:border-slate-200 transition-all ${src.color}`}>
                                <src.icon size={10} />
                                <span className="text-[8px] font-black uppercase tracking-widest">{src.label}</span>
                              </div>
                            ))}
                            {client.sources.length === 0 && <span className="text-[8px] font-bold text-slate-300">UNIDENTIFIED</span>}
                          </div>
                        </td>
                        <td className="px-6 py-7">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black border border-blue-100">
                              <Smartphone size={10} /> {client.repairCount}
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black border border-emerald-100">
                              <ShoppingBag size={10} /> {client.purchaseCount}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-7 text-right font-black text-slate-900 text-sm">
                          {currency.symbol}{client.totalSpend.toLocaleString()}
                        </td>
                        {/* Task 6: Inactivity Signals */}
                        <td className="px-6 py-7 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">{client.lastVisit}</span>
                            <span className={`text-[8px] font-bold uppercase mt-1 px-2 py-0.5 rounded ${client.daysSinceLastVisit > 90 ? 'bg-rose-50 text-rose-600' :
                              client.daysSinceLastVisit > 30 ? 'bg-amber-50 text-amber-600' :
                                'bg-emerald-50 text-emerald-600'
                              }`}>
                              {client.daysSinceLastVisit === 999 ? 'No Visit Recorded' :
                                client.daysSinceLastVisit > 30 ? `Inactive – ${client.daysSinceLastVisit}D AGO` :
                                  `${client.daysSinceLastVisit}D AGO`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-7 text-center">
                          <div className="flex flex-wrap justify-center gap-2">
                            {client.isHighValue && (
                              <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[8px] font-black border border-amber-100 uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                <Star size={10} fill="currentColor" /> High Value
                              </div>
                            )}
                            {client.needsSupport && (
                              <div className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[8px] font-black border border-rose-100 uppercase tracking-widest flex items-center gap-1 shadow-sm">
                                <ShieldAlert size={10} /> Support Risk
                              </div>
                            )}
                            {!client.isHighValue && !client.needsSupport && <span className="text-[8px] font-bold text-slate-300 uppercase">NOMINAL</span>}
                          </div>
                        </td>
                        <td className="px-6 py-7 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center justify-center gap-2 mx-auto w-fit ${client.loyalty === 'Loyal' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            client.loyalty === 'Occasional' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              'bg-slate-50 text-slate-700 border-slate-100'
                            }`}>
                            <BadgeCheck size={10} />
                            {client.loyalty}
                          </span>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl transition-all shadow-sm"><History size={16} /></button>
                            <button className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-sm"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* TASK 3: CUSTOMER ACTIVITY TIMELINE DRAWER */}
      {selectedClientForTimeline && (
        <div className="fixed inset-0 z-[300] flex justify-end bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="fixed inset-0" onClick={() => setSelectedClientForTimeline(null)} />
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col relative z-10 overflow-hidden rounded-l-[2rem]">
            <div className="p-10 bg-slate-900 text-white flex flex-col gap-6 shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-5">
                <UserIcon size={200} />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-3xl text-indigo-600 shadow-xl">
                  {selectedClientForTimeline.name.charAt(0)}
                </div>
                <button onClick={() => setSelectedClientForTimeline(null)} className="p-3 bg-white/10 hover:bg-rose-500 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-black tracking-tight uppercase leading-none">{selectedClientForTimeline.name}</h3>
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.3em] mt-3">Entity Audit Reference: ID-{selectedClientForTimeline._id?.slice(-6) || selectedClientForTimeline.id?.slice(-6)}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 relative z-10">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">Lifetime value</p>
                  <p className="text-xl font-black">{currency.symbol}{selectedClientForTimeline.totalSpend.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">Total Repairs</p>
                  <p className="text-xl font-black">{selectedClientForTimeline.repairCount}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <p className="text-[8px] font-black text-indigo-300 uppercase tracking-widest mb-1">Protocol Risk</p>
                  <p className={`text-xl font-black ${selectedClientForTimeline.needsSupport ? 'text-rose-400' : 'text-emerald-400'}`}>{selectedClientForTimeline.needsSupport ? 'HIGH' : 'LOW'}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-slate-50/30">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2">
                  <History size={16} /> Operational Lifecycle Feed
                </h4>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Chronological Trace</span>
              </div>

              <div className="relative space-y-0 before:absolute before:left-[1.85rem] before:top-0 before:bottom-0 before:w-0.5 before:bg-slate-100">
                {clientTimeline.length === 0 ? (
                  <div className="py-20 text-center opacity-30 grayscale flex flex-col items-center gap-4">
                    <History size={48} strokeWidth={1.5} />
                    <p className="text-[10px] font-black uppercase tracking-widest">No historical node activity detected</p>
                  </div>
                ) : clientTimeline.map((event: any, idx: number) => (
                  <div key={idx} className="relative flex gap-8 group animate-in slide-in-from-right-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-14 h-14 rounded-2xl bg-white shadow-xl border-4 border-slate-50 flex items-center justify-center z-10 group-hover:scale-110 transition-transform`}>
                        <event.icon size={22} className={`${event.type === 'COMPLAINT' ? 'text-rose-600' : event.type === 'POS' ? 'text-emerald-600' : 'text-blue-600'}`} />
                      </div>
                      <div className="flex-1" />
                    </div>
                    <div className="flex-1 pb-10">
                      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-50 group-hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg bg-slate-50 text-slate-500 border border-slate-100`}>{event.type} NODE</span>
                            <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">{event.title}</h5>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">{event.displayDate}</p>
                            <p className="text-sm font-black text-slate-900 tracking-tighter">{event.val}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Authorized Logic Trace • Handshake Successful</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-white border-t border-slate-100 flex flex-col gap-4 shrink-0">
              <div className="flex items-center gap-4 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                <ShieldCheck size={24} className="text-indigo-600 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-indigo-900 uppercase leading-none">Security Clearance Verified</p>
                  <p className="text-[9px] font-bold text-indigo-600/70 uppercase tracking-tighter mt-1">This audit trail is read-only. Modification of past transactional nodes is restricted.</p>
                </div>
              </div>
              <button onClick={() => setSelectedClientForTimeline(null)} className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-black transition-all">Close Entity Audit</button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER INTELLIGENCE BANNERS */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {intel.stats.filter(s => s.needsSupport).length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[2.5rem] flex items-center justify-between gap-6 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-rose-600 text-white rounded-[2rem] flex items-center justify-center shadow-lg shadow-rose-200 animate-pulse">
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h4 className="text-base font-black text-rose-900 uppercase leading-none">Support Protocol Active</h4>
                  <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-2">⚠ {intel.stats.filter(s => s.needsSupport).length} identity nodes require immediate attention (Multiple complaints/cancellations)</p>
                </div>
              </div>
            </div>
          )}

          {intel.stats.filter(s => s.isHighValue).length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-100 p-8 rounded-[2.5rem] flex items-center justify-between gap-6 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-amber-500 text-white rounded-[2rem] flex items-center justify-center shadow-lg shadow-amber-200">
                  <Star size={32} fill="currentColor" />
                </div>
                <div>
                  <h4 className="text-base font-black text-amber-900 uppercase leading-none">High-Yield Assets Detected</h4>
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-2">⭐ {intel.stats.filter(s => s.isHighValue).length} Tier-1 clients identified by revenue density.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};