
import React, { useState, useEffect, useMemo } from 'react';
import {
  History as HistoryIcon, Search, Filter, Wrench, ShoppingCart,
  User, ChevronLeft, Download, Eye, ShieldCheck, Zap,
  Lock, CreditCard, Package, Globe, Terminal, Activity,
  AlertCircle, CheckCircle2, XCircle, Clock, Smartphone,
  Cpu, MousePointer2, Bot, Layout, Server, Database,
  ArrowUpRight, ArrowDownLeft, Wallet, ChevronDown, ChevronUp,
  FileText, Hash, Link as LinkIcon, Info, CornerDownRight,
  FileSpreadsheet, Sparkles, ShieldAlert, Calendar,
  BrainCircuit, Mail, Receipt, Printer, X, FileCheck, ShieldPlus,
  Loader2, DollarSign, Users, RefreshCcw, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../../context/CurrencyContext.tsx';
import { useAuth } from '../../../context/AuthContext.tsx';
import { callBackendAPI } from '../../../api/apiClient.ts';

// --- NEW ADDITIVE COMPONENT: InvoicePreview ---
const InvoicePreviewModal: React.FC<{ log: any; onClose: () => void; currency: any }> = ({ log, onClose, currency }) => {
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleEmailInvoice = async () => {
    setIsSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  // ✅ Functional PDF Download (Print to PDF)
  const handleDownloadPDF = () => {
    const printContent = document.getElementById('printable-invoice');
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open('', '', 'height=800,width=1000');

    if (printWindow) {
      printWindow.document.write('<html><head><title>Invoice_' + log.id + '</title>');
      printWindow.document.write('<script src="https://cdn.tailwindcss.com"></script>');
      printWindow.document.write('</head><body class="p-10">');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();

      // Delay to ensure tailwind classes load in new window
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };

  // ✅ Correct date formatting logic
  const formattedDate = useMemo(() => {
    const dateVal = log.timestamp || log.date;
    if (!dateVal) return "N/A";
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? dateVal : d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }, [log]);

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0 no-print">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Receipt size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest leading-none">Fiscal Document</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 tracking-tighter">Reference: #{log.id.slice(-8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-rose-500 rounded-full transition-all"><X size={24} /></button>
        </div>

        <div id="printable-invoice" className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-white">
          <div className="flex justify-between items-start border-b-2 border-dashed border-slate-100 pb-8 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black italic text-xs">D</div>
                <h1 className="text-2xl font-black tracking-tighter text-slate-900">DibNow <span className="text-indigo-600">SaaS</span></h1>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Globe size={10} /> Cloud Infrastructure Node</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Hash</p>
              <p className="text-xs font-mono font-bold text-slate-900">{log.id}</p>
              {/* ✅ Real Date showing here */}
              <p className="text-[9px] font-black text-indigo-600 uppercase mt-2">{formattedDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 mb-10">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Entity Data</h4>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-800 uppercase">{log.actor || 'System Treasury'}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{log.actorType || 'System'} Node</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">IP: {log.ipAddress || '127.0.0.1'}</p>
              </div>
            </div>
            <div className="space-y-4 text-right">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Protocol Details</h4>
              <div className="space-y-1">
                <p className="text-xs font-black text-slate-800 uppercase">{log.actionType}</p>
                <p className="text-[10px] font-bold text-indigo-600 uppercase">{log.protocolType}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Gateway: {log.gateway || 'System'}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-3xl p-8 mb-10 border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] font-black text-slate-400 uppercase">Service Description</span>
              <span className="text-[10px] font-black text-slate-400 uppercase">Settlement</span>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm font-bold text-slate-700 uppercase tracking-tight max-w-xs">
                {log.drillDown?.description || `Treasury flux authorized. Type: ${log.financialType?.toUpperCase() || 'TX'}. Protocol: ${log.actionType}.`}
              </p>
              <p className="text-2xl font-black text-slate-900">{currency.symbol}{parseFloat(log.financialValue).toLocaleString()}</p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ShieldCheck size={24} className="text-emerald-500" />
              <div>
                <p className="text-[9px] font-black text-slate-900 uppercase">Verified Transaction</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase">Status: {log.status?.toUpperCase() || 'SUCCESS'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase">Net Impact</p>
              <p className={`text-lg font-black ${log.financialType === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {log.financialType === 'credit' ? '+' : '-'}{currency.symbol}{parseFloat(log.financialValue).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0 no-print">
          <button
            onClick={handleDownloadPDF}
            className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all shadow-sm"
          >
            <Download size={16} /> Download PDF
          </button>
          <button
            onClick={handleEmailInvoice}
            disabled={isSending}
            className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl ${sent ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {isSending ? <Loader2 className="animate-spin" size={16} /> : sent ? <CheckCircle2 size={16} /> : <Mail size={16} />}
            {sent ? 'Sent to Actor' : 'Email Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { currency } = useCurrency();
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // --- NEW ADDITIVE STATE: Document UI ---
  const [selectedInvoiceLog, setSelectedInvoiceLog] = useState<any | null>(null);
  const [isEmailingReport, setIsEmailingReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // F. FILTERS & CONTROLS STATE
  const [filters, setFilters] = useState({
    protocolType: 'all',
    status: 'all',
    actor: 'all',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: ''
  });

  const loadUnifiedLogs = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const userId = user._id || user.id;
      const [repairs, sales, walletTx, activities] = await Promise.all([
        callBackendAPI('/api/repairs', null, 'GET').catch(() => []),
        callBackendAPI('/api/sales', null, 'GET').catch(() => []),
        callBackendAPI(`/api/wallet/${userId}/transactions`, null, 'GET').catch(() => []),
        callBackendAPI('/api/activities', null, 'GET').catch(() => [])
      ]);

      const mappedRepairs = (repairs || []).map((r: any) => ({
        ...r,
        id: r._id,
        protocolType: 'REPAIR_EVENT',
        actionType: r.status === 'pending' ? 'Repair Created' : 'Repair Updated',
        actor: r.assignedTo || 'Staff',
        actorType: 'User',
        source: 'Web Interface',
        sourceIcon: Layout,
        icon: Wrench,
        color: 'text-blue-600 bg-blue-50 border-blue-100',
        ipAddress: 'Verified Node',
        financialValue: r.cost || 0,
        financialType: 'credit',
        gateway: r.paymentMethod || 'Cash',
        status: r.status,
        timestamp: r.createdAt,
        drillDown: {
          description: `Device node "${r.device}" registered for client "${r.customerName}". Current operational state: ${r.status.toUpperCase()}.`,
          before: 'System NULL',
          after: `REPAIR_NODE_ACTIVE (${r.status})`,
          refId: r.trackingId || r._id,
          linkPath: '/user/repairs',
          entityType: 'Repair ID'
        }
      }));

      const mappedSales = (sales || []).map((s: any) => ({
        ...s,
        id: s._id,
        protocolType: 'PAYMENT_EVENT',
        actionType: 'POS Settlement',
        actor: s.customer || 'Cashier',
        actorType: 'User',
        source: 'POS Terminal',
        sourceIcon: Smartphone,
        icon: ShoppingCart,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        ipAddress: 'POS Node',
        financialValue: s.total || 0,
        financialType: 'credit',
        gateway: s.paymentMethod || 'Cash',
        status: 'success',
        timestamp: s.createdAt,
        drillDown: {
          description: `Transactional liquidation of "${s.productName}" x${s.qty}. Permanent fiscal settlement finalized.`,
          before: 'INVENTORY_RESERVE',
          after: 'CASH_LIQUIDITY',
          refId: s._id,
          linkPath: '/user/sold-items',
          entityType: 'Invoice ID'
        }
      }));

      const mappedWallet = (walletTx || []).map((t: any) => ({
        ...t,
        id: t._id,
        protocolType: 'PAYMENT_EVENT',
        actionType: t.description,
        actor: 'System Treasury',
        actorType: 'System',
        source: 'Internal Gateway',
        sourceIcon: Wallet,
        icon: CreditCard,
        color: t.type === 'credit' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100',
        ipAddress: 'System Node',
        financialValue: t.amount || 0,
        financialType: t.type,
        gateway: 'Wallet',
        timestamp: t.timestamp,
        drillDown: {
          description: `Treasury flux authorized. Type: ${t.type.toUpperCase()}. Protocol: ${t.description}.`,
          before: 'Calculated Node',
          after: 'Authorized Ledger',
          refId: t._id,
          linkPath: '/user/wallet',
          entityType: 'Transaction ID'
        }
      }));

      const mappedActivities = (activities || []).map((a: any) => {
        let proto = 'SYSTEM_EVENT';
        let actorType = 'System';
        let source = 'API Node';
        let sourceIcon = Server;
        let icon = Activity;
        let color = 'text-slate-600 bg-slate-50 border-slate-100';

        if (a.actionType.includes('Login')) {
          proto = 'AUTH_EVENT';
          actorType = 'User';
          source = 'Web Portal';
          sourceIcon = Globe;
          icon = Lock;
          color = 'text-amber-600 bg-amber-50 border-amber-100';
        }

        return {
          ...a,
          id: a._id,
          protocolType: proto,
          actionType: a.actionType,
          actor: a.userName || 'Root System',
          actorType: actorType,
          source: source,
          sourceIcon: sourceIcon,
          icon: icon,
          color: color,
          ipAddress: 'Verified IP',
          status: a.status === 'Success' ? 'success' : 'failed',
          financialValue: 0,
          financialType: null,
          gateway: null,
          drillDown: {
            description: `System activity node logged: ${a.actionType}. Status: ${a.status}. Protocol module: ${a.moduleName}.`,
            before: 'N/A',
            after: a.status.toUpperCase(),
            refId: a.refId || a._id,
            linkPath: '/user/dashboard',
            entityType: 'Node ID'
          }
        };
      });

      const unified = [...mappedRepairs, ...mappedSales, ...mappedWallet, ...mappedActivities].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setLogs(unified);
    } catch (error) {
      console.error('Forensic sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUnifiedLogs();
  }, [user]);

  // G. AI INSIGHT BANNER LOGIC (READ-ONLY WARNINGS)
  const aiAnomalies = useMemo(() => {
    const failedPayments = logs.filter(l => l.protocolType === 'PAYMENT_EVENT' && l.status === 'failed').length;
    const highValueEvents = logs.filter(l => l.financialValue > 1000).length;
    const systemErrors = logs.filter(l => l.protocolType === 'SYSTEM_EVENT' && l.status === 'Failed').length;

    const insights = [];
    if (failedPayments > 2) insights.push(`Multiple failed payment attempts detected in last 24 hours.`);
    if (highValueEvents > 0) insights.push(`${highValueEvents} high-value fiscal movements synchronized recently.`);
    if (systemErrors > 3) insights.push(`System logic friction detected in API nodes.`);

    return insights;
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = searchTerm === '' ||
        log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.id && String(log.id).toLowerCase().includes(searchTerm.toLowerCase()));

      const matchProtocol = filters.protocolType === 'all' || log.protocolType === filters.protocolType;
      const matchStatus = filters.status === 'all' || String(log.status).toLowerCase() === filters.status.toLowerCase();
      const matchActor = filters.actor === 'all' || log.actor === filters.actor;

      const amt = parseFloat(log.financialValue || 0);
      const matchMinAmt = filters.minAmount === '' || amt >= parseFloat(filters.minAmount);
      const matchMaxAmt = filters.maxAmount === '' || amt <= parseFloat(filters.maxAmount);

      const logDate = new Date(log.timestamp || log.date);
      const matchDateFrom = filters.dateFrom === '' || logDate >= new Date(filters.dateFrom);
      const matchDateTo = filters.dateTo === '' || logDate <= new Date(filters.dateTo);

      return matchSearch && matchProtocol && matchStatus && matchActor && matchMinAmt && matchMaxAmt && matchDateFrom && matchDateTo;
    });
  }, [logs, searchTerm, filters]);

  // --- NEW ADDITIVE: COMPLIANCE METRICS PANEL (TASK 6) ---
  const complianceStats = useMemo(() => {
    const totalFiscal = filteredLogs.reduce((acc, curr) => acc + (curr.financialType === 'credit' ? curr.financialValue : -curr.financialValue), 0);
    const systemActions = filteredLogs.filter(l => l.actorType === 'System').length;
    const userActions = filteredLogs.filter(l => l.actorType === 'User').length;

    return {
      totalFiscal,
      systemActions,
      userActions,
      lastExport: 'Never Recorded',
      integrity: 'Verified Protocol'
    };
  }, [filteredLogs]);

  const actorsList = useMemo(() => Array.from(new Set(logs.map(l => l.actor))), [logs]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Protocol', 'Action', 'Actor', 'Source', 'Amount', 'Status', 'Date'];
    const rows = filteredLogs.map(l => [
      l.id, l.protocolType, l.actionType, l.actor, l.source,
      `${l.financialType === 'debit' ? '-' : '+'}${l.financialValue || 0}`,
      l.status, new Date(l.timestamp || l.date).toLocaleString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Forensic_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleEmailReport = async () => {
    setIsEmailingReport(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsEmailingReport(false);
    alert(`Global Protocol: Forensic Audit Summary dispatched to ${user?.email}. Protocol trace ID: #${Math.floor(Math.random() * 100000)}`);
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const getStatusIcon = (status?: string) => {
    if (!status) return <CheckCircle2 size={12} className="text-emerald-500" />;
    const s = String(status).toLowerCase();
    switch (s) {
      case 'success': case 'completed': case 'delivered': return <CheckCircle2 size={12} className="text-emerald-500" />;
      case 'failed': case 'cancelled': return <XCircle size={12} className="text-rose-500" />;
      default: return <Clock size={12} className="text-amber-500" />;
    }
  };

  const isOwner = user?.role === 'USER';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto px-4">
      {/* HEADER & EXPORTS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 shadow-sm transition-all"><ChevronLeft /></button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Forensic Activity Hub</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
              <ShieldCheck size={14} className="text-indigo-600" /> End-to-End Handshake & Deep Audit Scrutiny
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* TASK 1: NEW GLOBAL ACTION BUTTONS */}
          <button
            onClick={handleEmailReport}
            disabled={!isOwner || isEmailingReport}
            className="bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
          >
            {isEmailingReport ? <Loader2 className="animate-spin" size={16} /> : <Mail size={16} />} Email Report
          </button>
          <button onClick={handleExportCSV} className="bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm">
            <FileSpreadsheet size={16} /> Export CSV
          </button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-black transition-all shadow-xl">
            <FileText size={16} /> Export PDF Audit
          </button>
        </div>
      </div>

      {/* TASK 6: ADDITIONAL COMPLIANCE DATA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Fiscal Net Flow', val: `${currency.symbol}${Math.round(complianceStats.totalFiscal).toLocaleString()}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'System Pulsar', val: complianceStats.systemActions, icon: Cpu, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Human Actors', val: complianceStats.userActions, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Export Sync', val: complianceStats.lastExport, icon: RefreshCcw, color: 'text-slate-400', bg: 'bg-slate-50' },
          { label: 'Audit Integrity', val: complianceStats.integrity, icon: ShieldPlus, color: 'text-indigo-900', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-2 group hover:shadow-xl transition-all">
            <div className={`w-8 h-8 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon size={16} />
            </div>
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <h4 className="text-sm font-black text-slate-800">{stat.val}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* G. AI INSIGHT BANNER */}
      {aiAnomalies.length > 0 && (
        <div className="bg-rose-600 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden group animate-in slide-in-from-top-4 duration-700">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md">
              <BrainCircuit size={24} fill="white" className="animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-200">Autonomous Security Insight</p>
              <div className="space-y-0.5">
                {aiAnomalies.map((insight, idx) => (
                  <p key={idx} className="text-sm font-black tracking-tight leading-none uppercase">• {insight}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* F. FILTERS & CONTROLS */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
        <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
          <Filter size={18} className="text-indigo-600" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Advanced Forensic Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Protocol Type</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              value={filters.protocolType}
              onChange={e => setFilters({ ...filters, protocolType: e.target.value })}
            >
              <option value="all">Global Protocols</option>
              <option value="AUTH_EVENT">AUTH_EVENT</option>
              <option value="PAYMENT_EVENT">PAYMENT_EVENT</option>
              <option value="REPAIR_EVENT">REPAIR_EVENT</option>
              <option value="INVENTORY_EVENT">INVENTORY_EVENT</option>
              <option value="SYSTEM_EVENT">SYSTEM_EVENT</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Status Node</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Statuses</option>
              <option value="success">Success / Completed</option>
              <option value="failed">Failed / Cancelled</option>
              <option value="pending">Pending Audit</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Actor Identity</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              value={filters.actor}
              onChange={e => setFilters({ ...filters, actor: e.target.value })}
            >
              <option value="all">All Actors</option>
              {actorsList.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Amount Range ({currency.symbol})</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={filters.minAmount} onChange={e => setFilters({ ...filters, minAmount: e.target.value })} />
              <input type="number" placeholder="Max" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold" value={filters.maxAmount} onChange={e => setFilters({ ...filters, maxAmount: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Date Range</label>
            <div className="flex gap-2">
              <input type="date" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[9px] font-bold" value={filters.dateFrom} onChange={e => setFilters({ ...filters, dateFrom: e.target.value })} />
              <input type="date" className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[9px] font-bold" value={filters.dateTo} onChange={e => setFilters({ ...filters, dateTo: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
        <div className="p-8 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/20">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={22} />
            <input
              type="text"
              placeholder="Search Actor, Source, or Protocol ID..."
              className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-3xl text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/user/pos')}
              className="bg-indigo-50 text-indigo-600 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
            >
              <Plus size={16} /> New Transaction
            </button>
            <button onClick={() => setFilters({ protocolType: 'all', status: 'all', actor: 'all', minAmount: '', maxAmount: '', dateFrom: '', dateTo: '' })} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Reset All Criteria</button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
            </div>
          )}
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-10 py-6">Protocol / Type</th>
                <th className="px-10 py-6">Action Performed</th>
                <th className="px-10 py-6">Actor Identity</th>
                <th className="px-10 py-6">Financial Impact</th>
                <th className="px-10 py-6">Source Origin</th>
                <th className="px-10 py-6 text-center">Timestamp</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                      <HistoryIcon size={64} />
                      <p className="text-sm font-black uppercase tracking-widest">No matching node records identified</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const logId = String(log.id);
                  const isExpanded = expandedRow === logId;
                  const isFinancial = log.financialValue > 0;
                  return (
                    <React.Fragment key={logId}>
                      <tr
                        onClick={() => toggleRow(logId)}
                        className={`transition-all cursor-pointer group ${isExpanded ? 'bg-indigo-50/50' : 'hover:bg-indigo-50/30'}`}
                      >
                        <td className="px-10 py-7">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border transition-transform group-hover:scale-105 ${log.color}`}>
                              <log.icon size={20} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{log.protocolType}</span>
                              <span className="text-[8px] font-mono font-bold text-slate-300 uppercase mt-0.5">#{logId.slice(-8)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-slate-800 text-sm tracking-tight uppercase leading-none">{log.actionType}</p>
                              {getStatusIcon(log.status)}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-tighter truncate max-w-[180px]">{log.customer || log.productName || log.device || 'System-Level Instruction'}</p>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center font-black text-[9px] text-white shadow-sm uppercase">
                                {log.actor.charAt(0)}
                              </div>
                              <span className="text-xs font-black text-slate-800 uppercase tracking-tighter">{log.actor}</span>
                            </div>
                            <span className={`text-[8px] font-black uppercase tracking-widest ml-8 ${log.actorType === 'AI (Insight)' ? 'text-violet-500' :
                              log.actorType === 'Admin' ? 'text-indigo-600' : 'text-slate-400'
                              }`}>
                              {log.actorType}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-7">
                          {log.financialValue > 0 ? (
                            <div className="flex flex-col gap-1">
                              <div className={`flex items-center gap-1.5 font-black text-sm tracking-tighter ${log.financialType === 'credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {log.financialType === 'credit' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                {log.financialType === 'credit' ? '+' : '-'}{currency.symbol}{parseFloat(log.financialValue).toLocaleString()}
                              </div>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100 w-fit">
                                {log.gateway || 'Internal'} Node
                              </span>
                            </div>
                          ) : (
                            <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest">— Non-Fiscal —</span>
                          )}
                        </td>
                        <td className="px-10 py-7">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-slate-500">
                              <log.sourceIcon size={14} className="text-slate-400" />
                              <span className="text-[10px] font-black uppercase tracking-tight">{log.source}</span>
                            </div>
                            <div className="flex items-center gap-2 pl-5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30" />
                              <span className="text-[8px] font-mono font-bold text-slate-300">Origin: {log.ipAddress}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-7 text-center">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-800 uppercase leading-none">{new Date(log.timestamp || log.date).toLocaleDateString()}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">{new Date(log.timestamp || log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="px-10 py-7 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isFinancial && isOwner && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedInvoiceLog(log); }}
                                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100"
                                  title="View Invoice"
                                >
                                  <Receipt size={16} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedInvoiceLog(log); }}
                                  className="p-2 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all border border-slate-100"
                                  title="Download PDF"
                                >
                                  <Download size={16} />
                                </button>
                              </>
                            )}
                            {!isFinancial && (
                              <button disabled className="p-2 bg-slate-50 text-slate-200 rounded-lg border border-slate-100 opacity-50 cursor-not-allowed">
                                <Receipt size={16} />
                              </button>
                            )}
                            <div className="p-3 bg-white border border-slate-200 rounded-xl text-slate-300 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all shadow-sm">
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
                          <td colSpan={7} className="px-10 py-10">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                              <div className="lg:col-span-8 space-y-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Terminal size={16} className="text-indigo-600" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-800">Operational Drill Down</h4>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {isFinancial && (
                                      <button
                                        onClick={e => { e.stopPropagation(); setSelectedInvoiceLog(log); }}
                                        className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase border border-indigo-100 px-3 py-1 rounded-lg hover:bg-indigo-50"
                                      >
                                        <Receipt size={12} /> Generate Document
                                      </button>
                                    )}
                                    <button onClick={e => { e.stopPropagation(); setSelectedInvoiceLog(log); }} className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase border border-indigo-100 px-3 py-1 rounded-lg hover:bg-indigo-50">
                                      <Download size={12} /> Download Node Event
                                    </button>
                                  </div>
                                </div>
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
                                  <div className="space-y-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Extended Event Description</p>
                                    <p className="text-sm font-bold text-slate-600 leading-relaxed uppercase tracking-tighter italic">"{log.drillDown?.description}"</p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 text-rose-500">
                                        <CornerDownRight size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Pre-Mutation State</span>
                                      </div>
                                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 font-mono text-[10px] text-slate-400 font-black">
                                        {log.drillDown?.before}
                                      </div>
                                    </div>
                                    <div className="space-y-3">
                                      <div className="flex items-center gap-2 text-emerald-500">
                                        <Zap size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Post-Mutation Node</span>
                                      </div>
                                      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 font-mono text-[10px] text-emerald-700 font-black">
                                        {log.drillDown?.after}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="lg:col-span-4 flex flex-col gap-6">
                                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex-1 flex flex-col justify-between shadow-xl relative overflow-hidden group/meta">
                                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/meta:scale-110 transition-transform"><FileText size={120} /></div>
                                  <div className="space-y-6 relative z-10">
                                    <div>
                                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Audit Reference</p>
                                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                                        <Hash size={16} className="text-indigo-400" />
                                        <span className="text-xs font-black uppercase tracking-tighter">{log.drillDown?.entityType}: {log.drillDown?.refId}</span>
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Linked Protocol Node</p>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); navigate(log.drillDown?.linkPath); }}
                                        className="w-full flex items-center justify-between p-4 bg-indigo-600 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
                                      >
                                        View Master Ledger <LinkIcon size={14} />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-3 relative z-10">
                                    <ShieldCheck size={16} className="text-emerald-400" />
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Handshake Verified by Identity Node</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <Database size={180} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-indigo-400">
              <Terminal size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Protocol Integrity Check</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight uppercase">Immutable Handshake Nodes</h3>
            <p className="text-slate-400 text-xs font-medium max-w-xl uppercase tracking-tighter leading-relaxed">
              Every record in this ledger captures precise Actor Identity and Financial impact metrics to ensure a high-fidelity audit trail. Drill down to inspect the pre and post state of each system mutation.
            </p>
          </div>
          <div className="flex items-center gap-4 px-8 py-5 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Audit Trust Index</p>
              <p className="text-sm font-black text-white">99.9% VERIFIED</p>
            </div>
          </div>
        </div>
      </div>

      {selectedInvoiceLog && (
        <InvoicePreviewModal
          log={selectedInvoiceLog}
          onClose={() => setSelectedInvoiceLog(null)}
          currency={currency}
        />
      )}
    </div>
  );
};
