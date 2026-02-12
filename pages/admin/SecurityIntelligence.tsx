import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, ShieldCheck, Eye, Search, Filter, 
  Activity, Lock, CreditCard, Wrench, Package, 
  Rocket, Wallet, Terminal, AlertTriangle, 
  AlertCircle, ChevronRight, Hash, Clock, 
  User, Database, Download, FileJson, BrainCircuit,
  Zap, Shield, Globe, MapPin, Fingerprint, Timer,
  ShieldPlus, Key, Info, RefreshCw, Layers, Sparkles,
  TrendingDown, Scale, HardDrive, BarChart3, Loader2,
  TrendingUp, ShoppingCart, AlertOctagon, XCircle,
  Calendar, PieChart as PieIcon, Flame,
  Users, DollarSign
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

export const SecurityIntelligence: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  
  // AI Insight Engine State
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [aiInsights, setAiInsights] = useState<any[] | null>(null);

  // 1. DATA HARVESTING (READ-ONLY FORENSIC SCAN)
  const suspiciousActivities = useMemo(() => {
    const activity = db.activity.getAll();
    const transactions = db.wallet.getTransactions();
    const audit = db.audit.getAll();
    const repairs = db.repairs.getAll();

    const flags: any[] = [];

    // Pattern A: Login Volatility (Authentication Scrutiny)
    const loginLogs = activity.filter(a => a.actionType.includes('Login'));
    const loginCounts: Record<string, number> = {};
    loginLogs.forEach(log => {
      loginCounts[log.userId] = (loginCounts[log.userId] || 0) + 1;
      if (loginCounts[log.userId] > 5) {
        flags.push({
          id: `SEC-AUTH-${log.id}`,
          entity: log.userName,
          entityType: log.userRole === 'ADMIN' ? 'Admin' : 'User',
          activity: 'Login',
          risk: 'Warning',
          reason: 'High-frequency authentication handshakes (Potential Brute Force / Account Sharing)',
          timestamp: log.timestamp,
          refId: log.userId,
          icon: Lock,
          color: 'text-amber-600 bg-amber-50 border-amber-100',
          type: 'AUTH'
        });
      }
    });

    // Pattern B: High-Value Fiscal Movement (> 1000) (Wallet Scrutiny)
    transactions.filter(t => t.amount > 1000).forEach(tx => {
      flags.push({
        id: `SEC-PAY-${tx.id}`,
        entity: 'Internal Treasury',
        entityType: 'System',
        activity: 'Wallet',
        risk: 'Critical',
        reason: 'Out-of-band high-value capital deployment detected',
        timestamp: tx.date,
        refId: tx.id,
        icon: Wallet,
        color: 'text-rose-600 bg-rose-50 border-rose-100',
        type: 'PAYMENT'
      });
    });

    // Pattern C: Manual System Overrides (Plan/Audit Scrutiny)
    audit.filter(a => a.actionType.includes('Update') || a.actionType.includes('Regen')).forEach(log => {
      flags.push({
        id: `SEC-SYS-${log.id}`,
        entity: log.adminRole || 'Authorized Lead',
        entityType: 'Admin',
        activity: 'Plan',
        risk: 'Info',
        reason: `Infrastructure mutation via ${log.actionType}: ${log.details}`,
        timestamp: log.timestamp,
        refId: log.id,
        icon: Terminal,
        color: 'text-blue-600 bg-blue-50 border-blue-100',
        type: 'OVERRIDE'
      });
    });

    // Pattern D: Operational Margin Leakage (Repair Scrutiny)
    repairs.filter(r => (parseFloat(r.partsCost) || 0) + (parseFloat(r.technicianCost) || 0) > r.cost).forEach(r => {
      flags.push({
        id: `SEC-RPR-${r.id}`,
        entity: r.customerName,
        entityType: 'User',
        activity: 'Repair',
        risk: 'Warning',
        reason: 'Negative repair margin identified (Revenue < Resource Cost)',
        timestamp: r.createdAt || r.date,
        refId: r.trackingId || r.id,
        icon: Wrench,
        color: 'text-amber-600 bg-amber-50 border-amber-100',
        type: 'MARGIN'
      });
    });

    // Pattern E: Rapid Inventory Enrollment (Stock Scrutiny)
    const stockActivity = activity.filter(a => a.actionType === 'Stock Item Added');
    if (stockActivity.length > 20) {
      flags.push({
        id: `SEC-STK-${Date.now()}`,
        entity: 'Warehouse Node',
        entityType: 'System',
        activity: 'Stock',
        risk: 'Info',
        reason: 'Rapid inventory SKU enrollment surge detected in current cycle',
        timestamp: new Date().toISOString(),
        refId: 'INV-BATCH',
        icon: Package,
        color: 'text-blue-600 bg-blue-50 border-blue-100',
        type: 'INVENTORY'
      });
    }

    return flags.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  // RISK SUMMARY DASHBOARD LOGIC (TASK 3 & 4)
  const riskDashboard = useMemo(() => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const critical24h = suspiciousActivities.filter(f => f.risk === 'Critical' && new Date(f.timestamp) >= twentyFourHoursAgo).length;
    const critical7d = suspiciousActivities.filter(f => f.risk === 'Critical' && new Date(f.timestamp) >= sevenDaysAgo).length;
    
    const highRiskUsers = Array.from(new Set(suspiciousActivities.filter(f => f.risk === 'Critical' && f.entityType === 'User').map(f => f.entity))).length;
    const highRiskTx = suspiciousActivities.filter(f => f.risk === 'Critical' && f.type === 'PAYMENT').length;

    const typeCounts: Record<string, number> = {};
    suspiciousActivities.forEach(f => {
      typeCounts[f.type] = (typeCounts[f.type] || 0) + 1;
    });
    const commonAnomaly = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'NONE';

    return { critical24h, critical7d, highRiskUsers, highRiskTx, commonAnomaly };
  }, [suspiciousActivities]);

  const filteredFlags = useMemo(() => {
    return suspiciousActivities.filter(f => {
      const matchSearch = searchTerm === '' || 
        f.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(f.refId).toLowerCase().includes(searchTerm.toLowerCase());
      const matchRisk = riskFilter === 'all' || f.risk.toLowerCase() === riskFilter.toLowerCase();
      return matchSearch && matchRisk;
    });
  }, [suspiciousActivities, searchTerm, riskFilter]);

  // AI INSIGHT ENGINE (ADVISORY ONLY)
  const invokeAiAudit = async () => {
    setIsAiRunning(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const repairs = db.repairs.getAll();
      const inventory = db.inventory.getAll();
      const activity = db.activity.getAll();
      const audit = db.audit.getAll();

      const negativeMargins = repairs.filter(r => (parseFloat(r.partsCost) || 0) + (parseFloat(r.technicianCost) || 0) > r.cost).length;
      
      const prompt = `
        You are a Senior SaaS Security Auditor. Interrogate the following read-only system snapshots:
        - Repair Margin Leakage: ${negativeMargins} cases.
        - Inventory Inconsistencies: ${inventory.filter(i => i.stock < 0).length} negative nodes.
        - System Overrides: ${audit.filter(a => a.actionType.includes('Update')).length} events.
        - Failed Handshakes: ${activity.filter(a => a.status === 'Failed').length} entries.

        Analyze these for: Payment abuse, Login failures, Negative margins, Inventory inconsistencies, Manual overrides.
        Output a technical report in JSON format:
        {
          "report": [
            {
              "type": "PAYMENT|AUTH|MARGIN|INVENTORY|OVERRIDE",
              "severity": "Low|Medium|High",
              "title": "Advisory Title",
              "observation": "Forensic description",
              "advisory": "Strategic non-mutable advice"
            }
          ]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text || '{}');
      setAiInsights(data.report || []);
    } catch (error) {
      console.error("AI Node Failure:", error);
    } finally {
      setIsAiRunning(false);
    }
  };

  const getInsightIcon = (type: string) => {
    switch(type) {
      case 'PAYMENT': return <CreditCard size={20} className="text-emerald-500" />;
      case 'AUTH': return <Lock size={20} className="text-amber-500" />;
      case 'MARGIN': return <TrendingDown size={20} className="text-rose-500" />;
      case 'INVENTORY': return <Package size={20} className="text-blue-500" />;
      case 'OVERRIDE': return <Terminal size={20} className="text-indigo-500" />;
      default: return <Info size={20} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto pb-24 px-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-900 text-indigo-400 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Security Intelligence</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
              <Terminal size={12} className="text-indigo-600" />
              Forensic Hub • Admin Only Infrastructure
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Download size={18} /> Export Forensic Audit
          </button>
        </div>
      </div>

      {/* RISK SUMMARY DASHBOARD (NEW COMPONENT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all border-b-4 border-b-rose-600">
            <div className="flex items-center justify-between">
               <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Flame size={24} />
               </div>
               <div className="text-right">
                  <p className="text-[8px] font-black text-rose-400 uppercase tracking-[0.2em]">Last 24h / 7d</p>
                  <p className="text-xs font-black text-rose-600 uppercase tracking-tighter">{riskDashboard.critical24h} / {riskDashboard.critical7d}</p>
               </div>
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Critical Alerts</p>
               <h4 className="text-3xl font-black text-slate-800 tracking-tighter mt-1">Audit Flux</h4>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all border-b-4 border-b-indigo-600">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
               <Users size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High-Risk Users</p>
               <h4 className="text-3xl font-black text-slate-800 tracking-tighter mt-1">{riskDashboard.highRiskUsers}</h4>
               <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Identity Anomalies Detected</p>
            </div>
         </div>

         <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all border-b-4 border-b-emerald-600">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
               <DollarSign size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High-Risk Transactions</p>
               <h4 className="text-3xl font-black text-slate-800 tracking-tighter mt-1">{riskDashboard.highRiskTx}</h4>
               <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Large Out-of-Band Flux</p>
            </div>
         </div>

         <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl flex flex-col gap-4 group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Activity size={100} className="text-white" /></div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md text-indigo-400">
               <AlertOctagon size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Common Anomaly Type</p>
               <h4 className="text-2xl font-black text-white tracking-tighter mt-1 uppercase">{riskDashboard.commonAnomaly}</h4>
               <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Principal Deficit Node</p>
            </div>
         </div>
      </div>

      {/* SUSPICIOUS ACTIVITY MONITOR (TASK COMPONENT) */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-rose-600">
        <div className="p-8 md:p-10 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/20">
           <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                 <Activity size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Suspicious Activity Monitor</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Autonomous Anomaly Recognition Ledger</p>
              </div>
           </div>
           
           <div className="flex flex-wrap items-center gap-4">
              <div className="relative group">
                 <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-600 transition-colors" size={20} />
                 <input 
                   type="text" 
                   placeholder="Trace Identity or Ref..." 
                   className="pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-rose-500/5 focus:border-rose-500 text-sm font-bold shadow-sm transition-all"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="flex items-center gap-2 px-4 py-3.5 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                 <Filter size={14} className="text-slate-400" />
                 <select 
                   className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                   value={riskFilter}
                   onChange={e => setRiskFilter(e.target.value)}
                 >
                    <option value="all">Global Risk</option>
                    <option value="critical">Critical (Red)</option>
                    <option value="warning">Warning (Yellow)</option>
                    <option value="info">Info (Blue)</option>
                 </select>
              </div>
           </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
           <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
                 <tr>
                    <th className="px-10 py-6">Entity Identity</th>
                    <th className="px-6 py-6">Protocol Type</th>
                    <th className="px-6 py-6 text-center">Severity Level</th>
                    <th className="px-10 py-6">Detection Forensic Reason</th>
                    <th className="px-6 py-6 text-center">Timestamp</th>
                    <th className="px-10 py-6 text-right">Auth Reference</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {filteredFlags.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="py-40 text-center">
                        <div className="flex flex-col items-center justify-center opacity-20 grayscale">
                           <ShieldCheck size={80} strokeWidth={1} />
                           <p className="text-lg font-black uppercase mt-6 tracking-[0.3em]">System Environment Nominal</p>
                           <p className="text-[10px] font-bold mt-2 uppercase">No suspicious nodes identified in this audit cycle.</p>
                        </div>
                     </td>
                   </tr>
                 ) : (
                   filteredFlags.map((flag) => (
                     <tr key={flag.id} className="hover:bg-rose-50/30 transition-all group cursor-default h-24">
                        <td className="px-10">
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm border ${flag.entityType === 'Admin' ? 'bg-slate-900 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                 {flag.entity?.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                 <p className="font-black text-slate-800 text-sm tracking-tight uppercase truncate max-w-[150px] leading-none">{flag.entity}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">Identity: {flag.entityType}</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-6">
                           <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${flag.color}`}>
                                 <flag.icon size={16} />
                              </div>
                              <span className="text-xs font-black text-slate-700 uppercase tracking-tighter">{flag.activity}</span>
                           </div>
                        </td>
                        {/* SEVERITY CLASSIFICATION (TASK 4) */}
                        <td className="px-6 text-center">
                           <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-2 ${
                              flag.risk === 'Critical' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                              flag.risk === 'Warning' ? 'bg-amber-50 text-amber-700 border-amber-100' : 
                              'bg-blue-50 text-blue-700 border-blue-100'
                           }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                flag.risk === 'Critical' ? 'bg-rose-500 animate-pulse' : 
                                flag.risk === 'Warning' ? 'bg-amber-500' : 
                                'bg-blue-500'
                              }`} />
                              {flag.risk}
                           </span>
                        </td>
                        <td className="px-10">
                           <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tighter italic">"{flag.reason}"</p>
                        </td>
                        <td className="px-6 text-center">
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-slate-800 uppercase leading-none">{new Date(flag.timestamp).toLocaleDateString()}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-tighter">{new Date(flag.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                           </div>
                        </td>
                        <td className="px-10 text-right">
                           <div className="flex items-center justify-end gap-2">
                              <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">#{String(flag.refId).slice(-8)}</span>
                              <button className="p-2.5 bg-white border border-slate-200 text-slate-300 hover:text-indigo-600 rounded-xl transition-all shadow-sm">
                                 <Eye size={16} />
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

      {/* AI INSIGHT ENGINE (ADVISORY) */}
      <div className="bg-slate-900 rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden border-b-8 border-b-indigo-600">
         <div className="p-8 md:p-12 bg-white/5 border-b border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-900/50">
                  <BrainCircuit size={40} className="text-white" />
               </div>
               <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">AI Insight Engine</h2>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mt-1 italic">Read-Only Forensic Scrutiny Node</p>
               </div>
            </div>
            <button 
              onClick={invokeAiAudit}
              disabled={isAiRunning}
              className="px-10 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
               {isAiRunning ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
               {isAiRunning ? "Scanning Ledger..." : "Invoke Neural Audit"}
            </button>
         </div>

         <div className="p-8 md:p-12">
            {!aiInsights && !isAiRunning ? (
               <div className="py-12 flex flex-col items-center text-center space-y-4 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                  <Activity size={48} className="text-indigo-400" />
                  <p className="text-xs font-black uppercase tracking-widest text-white">Neural Node Standby</p>
               </div>
            ) : isAiRunning ? (
               <div className="py-12 flex flex-col items-center gap-4 animate-pulse">
                  <div className="flex gap-2">
                     <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                     <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-indigo-400">Interrogating Global Data Points...</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95">
                  {aiInsights.map((insight, idx) => (
                     <div key={idx} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex flex-col gap-6 group hover:border-indigo-500/50 transition-all">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                 {getInsightIcon(insight.type)}
                              </div>
                              <h4 className="text-base font-black text-white uppercase tracking-tight leading-none">{insight.title}</h4>
                           </div>
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                             insight.severity === 'High' ? 'bg-rose-50/10 text-rose-400 border-rose-500/20' : 
                             insight.severity === 'Medium' ? 'bg-amber-50/10 text-amber-400 border-amber-500/20' : 
                             'bg-blue-50/10 text-blue-400 border-blue-500/20'
                           }`}>{insight.severity} Priority</span>
                        </div>
                        <p className="text-sm font-bold text-slate-300 leading-relaxed uppercase tracking-tighter italic">"{insight.observation}"</p>
                        <div className="pt-4 border-t border-white/5">
                           <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-tighter">Advisory: {insight.advisory}</p>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>

      {/* READ-ONLY DISCLAIMER */}
      <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] text-center">
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
            This infrastructure node is read-only. Identity de-authorization or node lockdowns must be executed via the Identity Registry or System Configurations modules.
         </p>
      </div>
    </div>
  );
};
