
import {
  Plus, Search, Smartphone, X,
  Wrench, Activity, Landmark, History,
  Package, Calendar, UserCheck,
  ListTree, Box, Briefcase, TrendingUp,
  BarChart, AlertTriangle, ShieldCheck, ChevronLeft, Save,
  ArrowRightLeft, Users, Filter, ChevronDown, CheckCircle2,
  DollarSign, User, Receipt, CreditCard, Banknote, FileText,
  ExternalLink, Printer, Download, Zap, BrainCircuit, Sparkles,
  Clock, Heart, Info, ArrowRight, Loader2, BarChart3, TrendingDown,
  Layers, AlertOctagon, UserCircle2, FileSpreadsheet,
  Mail, Phone, Image as ImageIcon, CheckSquare, Square,
  Paperclip, Upload, ArrowUpRight, Percent, Target, Trash2, FileJson, ClipboardList,
  Timer,
  Lock,
  FileDown,
  BarChart as BarChartIcon,
  XCircle,
  AlertCircle,
  TrendingDown as TrendingDownIcon,
  ArrowDownCircle,
  FileUp,
  ShieldAlert,
  ChevronRight,
  ShieldQuestion,
  Settings2,
  StickyNote,
  Terminal,
  Eye,
  QrCode,
  MapPin,
  BadgeCheck,
  Hash,
  Palette,
  ShieldPlus,
  ClipboardCheck
} from 'lucide-react';
import {
  ResponsiveContainer, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Cell, BarChart as ReBarChart, AreaChart,
  ComposedChart, Area, Line, Bar, ReferenceLine, PieChart, Pie
} from 'recharts';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { aiService } from '../../api/aiService';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e'];

export const Repairs: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { currency } = useCurrency();
  const navigate = useNavigate();
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [brands, setBrands] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals State
  const [selectedTimelineRepair, setSelectedTimelineRepair] = useState<any | null>(null);
  const [selectedInvoiceRepair, setSelectedInvoiceRepair] = useState<any | null>(null);
  const [selectedClientProfile, setSelectedClientProfile] = useState<any | null>(null);

  // AI Diagnostic State
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Status Dropdown State
  const [activeStatusPicker, setActiveStatusPicker] = useState<string | null>(null);
  const statusPickerRef = useRef<HTMLDivElement>(null);

  // Advanced Filter State
  const [timeFilter, setTimeFilter] = useState('Last 30 Days');
  const [customRange, setCustomRange] = useState({ from: '', to: '' });

  // Enrollment Form State
  const [formData, setFormData] = useState({
    customerName: '', mobile: '', email: '', brand: '',
    device: '', description: '', cost: '', status: 'pending',
    date: new Date().toISOString().split('T')[0],
    assignedTo: '', deviceImage: null as string | null,
    symptoms: [] as string[],
    internalNotes: '',
    estimatedTime: 'Same Day',
    estimatedPickupDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'unpaid',
    paymentMethod: 'cash',
    partsCost: '0',
    technicianCost: '0',
    attachments: [] as any[],
    aiDiagnosis: null as string | null,
    aiConfidence: null as number | null,
    aiEstimatedCost: null as string | null,
    aiEstimatedTime: null as string | null,
    // Task 2: New Optional Additions
    serialNumber: '',
    deviceColor: '',
    storageVariant: '',
    fileError: null as string | null
  });

  const symptomList = ['No Power', 'Screen Issue', 'Battery Problem', 'Network Issue', 'Water Damage', 'Software Loop'];

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [repairsResp, brandsResp, teamResp, planResp] = await Promise.all([
          callBackendAPI('/api/repairs', null, 'GET'),
          callBackendAPI('/api/brands', null, 'GET'),
          callBackendAPI('/api/team', null, 'GET'),
          callBackendAPI('/api/pricing/plans/' + (user.planId || 'starter'), null, 'GET')
        ]);

        setRepairs(Array.isArray(repairsResp) ? repairsResp : repairsResp?.repairs || []);
        setBrands(brandsResp || []);
        setTeamMembers(teamResp || []);
        setActivePlan(planResp);
      } catch (error) {
        console.error('Failed to load infrastructure data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    const handleClickOutside = (e: MouseEvent) => {
      if (statusPickerRef.current && !statusPickerRef.current.contains(e.target as Node)) {
        setActiveStatusPicker(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);

  // KPI ENGINE
  const repairKPIs = useMemo(() => {
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthRepairs = repairs.filter(r => new Date(r.createdAt || r.date) >= firstDayMonth);
    const pending = repairs.filter(r => r.status?.toLowerCase() === 'pending').length;
    const inProgress = repairs.filter(r => r.status?.toLowerCase() === 'in progress').length;
    const completed = repairs.filter(r => ['completed', 'delivered'].includes(r.status?.toLowerCase() || '')).length;
    const revenue = repairs.filter(r => ['completed', 'delivered'].includes(r.status?.toLowerCase() || '')).reduce((acc, curr) => acc + (parseFloat(curr.cost) || 0), 0);
    return { totalThisMonth: monthRepairs.length, pending, inProgress, completed, revenue, avgTime: "4.2h" };
  }, [repairs]);

  // ANALYTICS ENGINE (Graph Data)
  const analyticsData = useMemo(() => {
    const dailyMap: { [key: string]: { revenue: number, count: number, profit: number } } = {};
    const statusMap: { [key: string]: number } = { pending: 0, 'in progress': 0, completed: 0, delivered: 0 };

    repairs.forEach(r => {
      const date = new Date(r.createdAt || r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      if (!dailyMap[date]) dailyMap[date] = { revenue: 0, count: 0, profit: 0 };

      const rev = parseFloat(r.cost) || 0;
      const pCost = parseFloat(r.partsCost) || 0;
      const tCost = parseFloat(r.technicianCost) || 0;
      const totalCost = pCost + tCost;

      dailyMap[date].revenue += rev;
      dailyMap[date].count += 1;
      dailyMap[date].profit += (rev - totalCost);

      const status = r.status?.toLowerCase();
      if (statusMap.hasOwnProperty(status)) statusMap[status]++;
    });

    const revenueChart = Object.entries(dailyMap).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      volume: data.count,
      delta: data.profit
    })).slice(-7);

    const statusChart = Object.entries(statusMap).map(([name, value]) => ({ name: name.toUpperCase(), value }));

    return { revenueChart, statusChart };
  }, [repairs]);

  // BUSINESS INTELLIGENCE ENGINE (Technician Performance)
  const businessIntelligence = useMemo(() => {
    const techStats: any = {};
    const losses: any[] = [];

    repairs.forEach(r => {
      const revenue = parseFloat(r.cost) || 0;
      const pCost = parseFloat(r.partsCost) || 0;
      const tCost = parseFloat(r.technicianCost) || 0;
      const totalCost = pCost + tCost;
      const netProfit = revenue - totalCost;

      if (r.assignedTo) {
        if (!techStats[r.assignedTo]) techStats[r.assignedTo] = { name: r.assignedTo, repairs: 0, revenue: 0, cost: 0, profit: 0, avgTime: '4.1h', spec: 'General' };
        techStats[r.assignedTo].repairs++;
        techStats[r.assignedTo].revenue += revenue;
        techStats[r.assignedTo].cost += totalCost;
        techStats[r.assignedTo].profit += netProfit;
        // Task 6 additions
        techStats[r.assignedTo].load = techStats[r.assignedTo].repairs > 5 ? 'High' : techStats[r.assignedTo].repairs > 2 ? 'Medium' : 'Light';
      }
      if (netProfit < 0) {
        losses.push({ id: r.trackingId || r.id, reason: pCost > revenue ? 'High Parts Cost' : 'Operational Deficit', lossAmount: Math.abs(netProfit), raw: r });
      }
    });
    return { technicians: Object.values(techStats), losses };
  }, [repairs]);

  // Task 7: Validation Summary
  const validationSummary = useMemo(() => ({
    client: !!formData.customerName && !!formData.mobile,
    device: !!formData.device && !!formData.description,
    pricing: parseFloat(formData.cost) > 0,
    pickup: !!formData.estimatedPickupDate && new Date(formData.estimatedPickupDate) >= new Date(new Date().setHours(0, 0, 0, 0))
  }), [formData]);

  const runAIDiagnostic = async () => {
    if (!formData.device || formData.symptoms.length === 0) { alert("Identify device and symptoms for AI analysis."); return; }
    setIsAIProcessing(true);
    try {
      const prompt = `You are a technical repair assistant. Diagnose this device: ${formData.device}. Reported Symptoms: ${formData.symptoms.join(', ')}. Output ONLY a JSON: { "diagnosis": string, "confidence": number, "est_cost": string, "est_time": string, "affected_components": string[] }.`;
      const data = await aiService.generateJson(prompt, "System: Technical Repair Assistant Diagnostic");
      if (data) {
        setAiResult(data);
        setFormData(prev => ({ ...prev, aiDiagnosis: data.diagnosis, aiConfidence: data.confidence, aiEstimatedCost: data.est_cost, aiEstimatedTime: data.est_time }));
      }
    } catch (error) { alert("AI Neural Link Failed."); } finally { setIsAIProcessing(false); }
  };

  const filteredData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    return repairs.filter(r => {
      const rawDateStr = r.createdAt || r.date;
      const rDate = new Date(rawDateStr);
      let matchesTime = true;
      switch (timeFilter) {
        case 'Today': matchesTime = rDate.toISOString().split('T')[0] === todayStr; break;
        case 'Yesterday':
          const yest = new Date(startOfToday); yest.setDate(yest.getDate() - 1);
          matchesTime = rDate.toISOString().split('T')[0] === yest.toISOString().split('T')[0];
          break;
        case 'Last 7 Days': matchesTime = rDate >= new Date(startOfToday.getTime() - 7 * 86400000); break;
        case 'Last 30 Days': matchesTime = rDate >= new Date(startOfToday.getTime() - 30 * 86400000); break;
      }
      const statusMatch = statusFilter === 'all' || r.status?.toLowerCase() === statusFilter.toLowerCase();
      const query = searchTerm.toLowerCase();
      const searchMatch = !searchTerm || r.customerName?.toLowerCase().includes(query) || r.device?.toLowerCase().includes(query) || (r.trackingId && r.trackingId.toLowerCase().includes(query));
      return matchesTime && statusMatch && searchMatch;
    });
  }, [repairs, timeFilter, customRange, statusFilter, searchTerm]);

  const handleEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (parseFloat(formData.cost) <= 0) { alert("Estimated Repair Price must be greater than 0."); return; }
    if (repairs.length >= (activePlan?.limits?.repairsPerMonth || 0)) { alert("Plan limit reached."); return; }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName: formData.customerName,
        customerEmail: formData.email,
        customerPhone: formData.mobile,
        device: formData.device,
        brand: formData.brand,
        serialNumber: formData.serialNumber,
        description: formData.description,
        estimatedCost: parseFloat(formData.cost),
        estimatedCompletionDate: formData.estimatedPickupDate,
        assignedTo: formData.assignedTo || undefined,
        paymentStatus: formData.paymentStatus,
        metadata: {
          deviceColor: formData.deviceColor,
          storageVariant: formData.storageVariant,
          symptoms: formData.symptoms,
          internalNotes: formData.internalNotes,
          estimatedTime: formData.estimatedTime,
          partsCost: formData.partsCost,
          technicianCost: formData.technicianCost
        }
      };

      await callBackendAPI('/api/repairs', payload, 'POST');

      const repairsResp = await callBackendAPI('/api/repairs', null, 'GET');
      setRepairs(Array.isArray(repairsResp) ? repairsResp : repairsResp?.repairs || []);

      setShowBookingForm(false);
      setAiResult(null);
      setFormData({ customerName: '', mobile: '', email: '', brand: '', device: '', description: '', cost: '', status: 'pending', date: new Date().toISOString().split('T')[0], assignedTo: '', deviceImage: null, symptoms: [], internalNotes: '', estimatedTime: 'Same Day', estimatedPickupDate: new Date().toISOString().split('T')[0], paymentStatus: 'unpaid', paymentMethod: 'cash', attachments: [], partsCost: '0', technicianCost: '0', aiDiagnosis: null, aiConfidence: null, aiEstimatedCost: null, aiEstimatedTime: null, serialNumber: '', deviceColor: '', storageVariant: '', fileError: null });
    } catch (error) {
      console.error('Enrollment failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, nextStatus: string) => {
    try {
      await callBackendAPI(`/api/repairs/${id}/status`, { status: nextStatus, note: `Protocol state migrated to ${nextStatus.toUpperCase()}` }, 'PUT');
      const repairsResp = await callBackendAPI('/api/repairs', null, 'GET');
      setRepairs(Array.isArray(repairsResp) ? repairsResp : repairsResp?.repairs || []);
      setActiveStatusPicker(null);
    } catch (error) {
      console.error('Status migration failed:', error);
    }
  };

  const handleDeleteRepair = async (id: string) => {
    if (window.confirm("CRITICAL: Decommission this repair node permanently?")) {
      try {
        await callBackendAPI(`/api/repairs/${id}`, null, 'DELETE');
        const repairsResp = await callBackendAPI('/api/repairs', null, 'GET');
        setRepairs(Array.isArray(repairsResp) ? repairsResp : repairsResp?.repairs || []);
      } catch (error) {
        console.error('Decommission failed:', error);
      }
    }
  };

  const handleEmailInvoice = (repair: any) => {
    alert(`E-Invoice handshaking for ${repair.customerName} via relay ${repair.email || 'customer_node'}... Transmitted!`);
  };

  const handleDownloadInvoicePDF = (repair: any) => {
    const printContent = document.getElementById('repair-invoice-printable');
    if (!printContent) return;

    // Create an invisible iframe for high-fidelity printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.top = '-10000px';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.write(`
        <html>
          <head>
            <title>Invoice_Repair_${repair.trackingId}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print { .no-print { display: none; } }
              body { font-family: sans-serif; background: white; color: black; }
            </style>
          </head>
          <body class="p-10">
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      iframeDoc.close();

      // Wait for TailWind CDN and content to settle
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
      }, 800);
    }
  };

  const handleOpenClientProfile = (customerName: string) => {
    const clientRepairs = repairs.filter(r => r.customerName === customerName);
    setSelectedClientProfile({ name: customerName, contact: clientRepairs[0]?.mobile || 'N/A', totalRepairs: clientRepairs.length, totalSpend: clientRepairs.reduce((a, c) => a + parseFloat(c.cost), 0), lastVisit: clientRepairs[0]?.date || 'N/A' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setFormData(prev => ({ ...prev, fileError: 'Invalid format. Use JPG/PNG.' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormData(prev => ({ ...prev, fileError: 'File exceeds 5MB threshold.' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, deviceImage: reader.result as string, fileError: null }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">Repair Infrastructure</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2"><ShieldCheck size={14} className="text-indigo-600" /> Node Architecture & Fiscal Ledger</p>
          </div>
          <div className="bg-white border border-slate-200 px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-sm">
            <div className={`w-2 h-2 rounded-full ${repairs.length >= (activePlan?.limits?.repairsPerMonth || 0) ? 'bg-rose-500 animate-pulse' : 'bg-emerald-50'}`} />
            <div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Operational Quota</p>
              <p className="text-sm font-black text-slate-800 mt-1">{repairs.length} / {activePlan?.limits?.repairsPerMonth >= 999 ? '∞' : (activePlan?.limits?.repairsPerMonth || 0)} <span className="text-[10px] text-slate-400 font-bold ml-1 uppercase">Units</span></p>
            </div>
          </div>
        </div>
        <button onClick={() => setShowBookingForm(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all text-[10px] uppercase tracking-widest"><Plus size={18} /> New Enrollment</button>
      </div>

      {/* KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total (This Month)', value: repairKPIs.totalThisMonth, icon: Wrench, color: 'text-indigo-600', bg: 'bg-indigo-50', filter: 'all' },
          { label: 'Pending Repairs', value: repairKPIs.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', filter: 'pending' },
          { label: 'In-Progress', value: repairKPIs.inProgress, icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', filter: 'in progress' },
          { label: 'Completed Repairs', value: repairKPIs.completed, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', filter: 'completed' },
          { label: 'Total Revenue', value: `${currency.symbol}${repairKPIs.revenue.toLocaleString()}`, icon: DollarSign, color: 'text-slate-800', bg: 'bg-slate-100', filter: 'all' },
          { label: 'Avg Completion', value: repairKPIs.avgTime, icon: Timer, color: 'text-purple-600', bg: 'bg-purple-50', filter: 'all' },
        ].map((kpi, idx) => (
          <div key={idx} onClick={() => setStatusFilter(kpi.filter)} className={`p-5 rounded-[2rem] border shadow-sm flex flex-col items-center text-center group cursor-pointer transition-all active:scale-95 ${statusFilter === kpi.filter ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
            <div className={`w-10 h-10 ${statusFilter === kpi.filter ? 'bg-white/20 text-white' : kpi.bg + ' ' + kpi.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}><kpi.icon size={20} /></div>
            <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${statusFilter === kpi.filter ? 'text-indigo-100' : 'text-slate-400'}`}>{kpi.label}</p>
            <h4 className={`text-xl font-black tracking-tighter ${statusFilter === kpi.filter ? 'text-white' : 'text-slate-800'}`}>{kpi.value}</h4>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/20">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
            <input type="text" placeholder="Trace Audit Record (ID, Device, Customer)..." className="w-full pl-14 pr-6 py-5 bg-white border-2 border-slate-100 rounded-3xl text-sm font-bold focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 shadow-sm transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => { const headers = ['Ref', 'Customer', 'Device', 'Status', 'Cost']; const rows = filteredData.map(r => [r.trackingId || r.id, r.customerName, r.device, r.status, r.cost]); const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n"); const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", `audit_repairs_${new Date().toISOString().split('T')[0]}.csv`); link.click(); }} className="bg-white border border-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 shadow-sm shrink-0 transition-all">
            <Download size={20} /> Liquidate Ledger
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-10 py-6">Operational Entity</th>
                <th className="px-10 py-6">Hardware model</th>
                <th className="px-10 py-6 text-center">Technician</th>
                <th className="px-10 py-6 text-center">Protocol Status</th>
                <th className="px-10 py-6 text-right">Settlement value</th>
                <th className="px-10 py-6 text-center">Protocol Date</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map(r => (
                <tr key={r.id} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">{r.customerName.charAt(0)}</div>
                      <div onClick={() => handleOpenClientProfile(r.customerName)} className="cursor-pointer">
                        <p className="font-black text-slate-800 text-base tracking-tight uppercase leading-none hover:text-indigo-600 transition-colors">{r.customerName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Ref: {r.trackingId || r.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-3 text-sm font-bold text-slate-600 uppercase"><Smartphone size={16} className="text-slate-300" />{r.device}</div>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-black uppercase ${r.assignedTo ? 'text-indigo-600' : 'text-slate-300'}`}>
                        {r.assignedTo || 'Unassigned'}
                      </span>
                      {r.assignedTo ? (
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter mt-1 flex items-center gap-1">
                          <UserCheck size={8} /> Active Lead
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter mt-1">Pending Node</span>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-7 text-center relative">
                    <div onClick={(e) => { e.stopPropagation(); if (hasPermission('manage_repairs')) setActiveStatusPicker(activeStatusPicker === r._id ? null : r._id); }} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 ${r.status === 'completed' || r.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'completed' || r.status === 'delivered' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />{r.status}
                      {hasPermission('manage_repairs') && <ChevronDown size={12} className={`transition-transform ${activeStatusPicker === r._id ? 'rotate-180' : ''}`} />}
                    </div>
                    {activeStatusPicker === r._id && (
                      <div ref={statusPickerRef} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] p-2 animate-in fade-in slide-in-from-top-2">
                        {['pending', 'diagnosing', 'in_progress', 'parts_ordered', 'completed', 'ready', 'delivered', 'cancelled', 'refunded'].map(opt => (
                          <button key={opt} onClick={(e) => { e.stopPropagation(); handleUpdateStatus(r._id, opt); }} className={`w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 rounded-xl transition-all uppercase text-[10px] font-black ${r.status === opt ? 'bg-slate-50 text-indigo-600' : 'text-slate-600'}`}>{opt}</button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-10 py-7 text-right">
                    <p className="font-black text-slate-900 text-lg tracking-tighter">{currency.symbol}{parseFloat(r.estimatedCost || r.cost).toLocaleString()}</p>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{r.date}</p>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleEmailInvoice(r); }} className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Email Invoice"><Mail size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedInvoiceRepair(r); }} className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="Quick QR Protocol"><QrCode size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedInvoiceRepair(r); }} className="p-2.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Repair Invoice Document"><FileDown size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setSelectedTimelineRepair(r); }} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm" title="History"><History size={16} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteRepair(r._id); }} className="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPAIR INVOICE MODAL */}
      {selectedInvoiceRepair && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20">
            <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0 no-print">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"><Receipt size={24} /></div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-widest leading-none">Repair Audit Document</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5">Ref: {selectedInvoiceRepair.trackingId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleEmailInvoice(selectedInvoiceRepair)} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all" title="Email Document"><Mail size={20} /></button>
                <button onClick={() => handleDownloadInvoicePDF(selectedInvoiceRepair)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl"><Printer size={16} /> Print / PDF</button>
                <button onClick={() => setSelectedInvoiceRepair(null)} className="p-3 hover:bg-rose-500 rounded-full transition-all"><X size={20} /></button>
              </div>
            </div>

            <div id="repair-invoice-printable" className="flex-1 overflow-y-auto custom-scrollbar p-10 md:p-16 bg-white text-slate-900">
              <div className="flex justify-between items-start border-b-2 border-slate-100 pb-12 mb-12">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black italic text-white text-lg shadow-lg">D</div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase">DibNow <span className="text-indigo-600">Repairs</span></h1>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Authorized Workshop</p>
                    <p className="text-sm font-bold text-slate-800 uppercase">Primary Infrastructure Node: Multan, PK</p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-xl flex flex-col items-center">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`https://dibnow.system/track/${selectedInvoiceRepair.trackingId}`)}`} className="w-24 h-24 rounded-lg" alt="Tracking QR" />
                    <p className="text-[7px] font-black text-slate-400 uppercase mt-2">Scan to Track Lifecycle</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-12">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50 pb-2">Client Identity Node</h4>
                  <div className="space-y-1">
                    <p className="text-lg font-black text-slate-900 uppercase">{selectedInvoiceRepair.customerName}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase">Uplink: {selectedInvoiceRepair.mobile || 'N/A'}</p>
                  </div>
                </div>
                <div className="space-y-4 text-right">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-b border-slate-50 pb-2">Audit Timestamp</h4>
                  <div className="space-y-1">
                    <p className="text-sm font-black text-slate-800 uppercase">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Protocol: #{selectedInvoiceRepair.trackingId}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-12 border border-slate-100">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hardware Model</p>
                    <p className="text-base font-black text-slate-900 uppercase">{selectedInvoiceRepair.device}</p>
                  </div>
                  <div className="space-y-2 text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Brand Mapping</p>
                    <p className="text-base font-black text-slate-900 uppercase">{selectedInvoiceRepair.brand}</p>
                  </div>
                </div>
              </div>

              <table className="w-full text-left">
                <thead className="border-b-2 border-slate-900">
                  <tr className="text-[10px] font-black uppercase tracking-widest">
                    <th className="py-4">Service Description</th>
                    <th className="py-4 text-right">Settlement Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="text-xs font-bold">
                    <td className="py-6 uppercase">Technical Labor & Circuit Forensics</td>
                    <td className="py-6 text-right font-black">{currency.symbol}{selectedInvoiceRepair.cost.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex justify-end pt-10 border-t-2 border-dashed border-slate-100 mt-10">
                <div className="text-right">
                  <span className="text-sm font-black uppercase tracking-widest">Authorized Total</span>
                  <span className="text-4xl font-black text-slate-900 tracking-tighter block mt-2">{currency.symbol}{selectedInvoiceRepair.cost.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW ENROLLMENT MODAL */}
      {showBookingForm && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col relative border border-white/20 max-h-[90vh]">
            <div className="bg-indigo-600 p-8 md:p-10 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/20 rounded-[1.5rem] flex items-center justify-center border border-white/20 backdrop-blur-md"><Wrench size={28} /></div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-widest leading-none">New Enrollment</h3>
                  <p className="text-[10px] font-bold text-indigo-100 uppercase mt-2 tracking-widest opacity-80">Technical Intake Protocol</p>
                </div>
              </div>
              <button onClick={() => setShowBookingForm(false)} className="p-3 bg-white/10 hover:bg-rose-500 rounded-full transition-all duration-300"><X size={24} /></button>
            </div>
            <div className="overflow-y-auto flex-1 custom-scrollbar p-10 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <form onSubmit={handleEnrollment} className="lg:col-span-8 space-y-12">
                  {/* Client Details */}
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2 border-b border-indigo-50 pb-4"><User size={16} /> Client Profile</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Client Full Name *</label>
                        <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 font-bold text-sm transition-all" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mobile Uplink *</label>
                        <input required type="tel" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 font-bold text-sm transition-all" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Node</label>
                        <input type="email" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 font-bold text-sm transition-all" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Device Details */}
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2 border-b border-indigo-50 pb-4"><Smartphone size={16} /> Technical Specifications</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Model Node *</label>
                            <input required type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={formData.device} onChange={e => setFormData({ ...formData, device: e.target.value })} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Brand Mapping *</label>
                            <select required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm appearance-none cursor-pointer" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })}>
                              <option value="">Select Brand</option>
                              {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                            </select>
                          </div>
                        </div>
                        {/* Task 2: Optional Device Identifiers */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Serial / IMEI</label>
                            <div className="relative">
                              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                              <input type="text" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold uppercase" placeholder="Logic ID" value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Device Color</label>
                            <div className="relative">
                              <Palette className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                              <input type="text" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold uppercase" placeholder="Shell" value={formData.deviceColor} onChange={e => setFormData({ ...formData, deviceColor: e.target.value })} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Storage Node</label>
                            <div className="relative">
                              <Box className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                              <input type="text" className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold uppercase" placeholder="e.g 256GB" value={formData.storageVariant} onChange={e => setFormData({ ...formData, storageVariant: e.target.value })} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="h-48 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center relative group hover:border-indigo-400 transition-all cursor-pointer overflow-hidden">
                        {formData.deviceImage ? (
                          <img src={formData.deviceImage} className="w-full h-full object-cover" alt="Node Visual" />
                        ) : (
                          <div className="text-center group-hover:scale-110 transition-transform">
                            <ImageIcon size={40} className="text-slate-200 mx-auto" />
                            <p className="text-[10px] font-black text-slate-400 uppercase mt-4 tracking-widest">Transmit Evidence</p>
                            <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">JPG/PNG Access</p>
                          </div>
                        )}
                        <input type="file" accept="image/jpeg,image/png" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                      </div>
                    </div>
                    {formData.fileError && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest text-center animate-pulse">{formData.fileError}</p>}
                  </div>

                  {/* Task 1: Issue & Diagnosis Node */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-indigo-50 pb-4">
                      <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2"><BrainCircuit size={16} /> Issue & Technical Audit</h4>
                      <button type="button" disabled={isAIProcessing || !formData.device} onClick={runAIDiagnostic} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 disabled:opacity-50 hover:bg-indigo-700 transition-all active:scale-95 group">
                        {isAIProcessing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="group-hover:animate-pulse" />}
                        Initialize AI Audit
                      </button>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Reported Technical Fault *</label>
                        <textarea required rows={3} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-sm outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all resize-none" placeholder="Supply detailed client fault report..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {symptomList.map(s => (
                          <button key={s} type="button" onClick={() => setFormData(p => ({ ...p, symptoms: p.symptoms.includes(s) ? p.symptoms.filter(x => x !== s) : [...p.symptoms, s] }))} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase border-2 transition-all flex items-center gap-2 ${formData.symptoms.includes(s) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'}`}>
                            {formData.symptoms.includes(s) ? <CheckSquare size={14} /> : <Square size={14} />} {s}
                          </button>
                        ))}
                      </div>
                      {aiResult && (
                        <div className="p-6 bg-indigo-50 border-2 border-indigo-100 rounded-[2.5rem] animate-in zoom-in-95 duration-300">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg"><Info size={16} /></div>
                            <h5 className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Neural Advisory node</h5>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-indigo-400 uppercase">Forensic logic</p>
                              <p className="text-xs font-bold text-indigo-950 italic">"{aiResult.diagnosis}"</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[9px] font-black text-indigo-400 uppercase">Node Confidence</p>
                              <div className="flex items-center gap-3">
                                <span className="text-xl font-black text-indigo-600">{aiResult.confidence}%</span>
                                <div className="flex-1 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500" style={{ width: `${aiResult.confidence}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Internal Protocol Ledger (Staff Only)</label>
                        <textarea rows={2} className="w-full px-5 py-4 bg-slate-900 text-indigo-400 border-2 border-slate-800 rounded-2xl font-mono text-xs focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all" placeholder="// LOG TECHNICAL SPECIFICS..." value={formData.internalNotes} onChange={e => setFormData({ ...formData, internalNotes: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Estimation Section */}
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2 border-b border-indigo-50 pb-4"><BarChartIcon size={16} /> Repair Estimation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Estimated Repair Price ({currency.symbol}) *</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-indigo-600">{currency.symbol}</div>
                          <input required type="number" step="0.01" min="0.01" className="w-full pl-11 pr-5 py-4 bg-slate-50 border-2 border-indigo-100 rounded-2xl font-black text-lg text-indigo-600" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} />
                        </div>
                        {/* Task 4: Price Hint */}
                        {aiResult?.est_cost && <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest mt-1 animate-pulse">Neural Indicator: {aiResult.est_cost}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Repair Time Frame</label>
                        <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <select className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none cursor-pointer" value={formData.estimatedTime} onChange={e => setFormData({ ...formData, estimatedTime: e.target.value })}>
                            <option value="Same Day">Same Day</option>
                            <option value="1–2 Days">1–2 Days</option>
                            <option value="3–5 Days">3–5 Days</option>
                          </select>
                        </div>
                        {/* Task 4: Time Hint */}
                        {aiResult?.est_time && <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Average Node Cycle: {aiResult.est_time}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Est. Recovery Timestamp *</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input required type="date" min={new Date().toISOString().split('T')[0]} className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm" value={formData.estimatedPickupDate} onChange={e => setFormData({ ...formData, estimatedPickupDate: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FISCAL ARCHITECTURE */}
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2 border-b border-indigo-50 pb-4">
                      <DollarSign size={16} /> Fiscal Architecture
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Component Cost ({currency.symbol})</label>
                        <input type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.partsCost} onChange={e => setFormData({ ...formData, partsCost: e.target.value })} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Labor Payout ({currency.symbol})</label>
                        <input type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold" value={formData.technicianCost} onChange={e => setFormData({ ...formData, technicianCost: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* ASSIGNMENT */}
                  <div className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2 border-b border-indigo-50 pb-4">
                      <Briefcase size={16} /> Assignment & Settlement
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assign Service Speciallist</label>
                        <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm appearance-none cursor-pointer" value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}>
                          <option value="">Unassigned Queue</option>
                          {teamMembers.map(m => {
                            const member = m as { name: string; id: string; role: string };
                            const tStat = businessIntelligence.technicians.find((t: any) => t.name === member.name) as { load?: string } || { load: 'Light' };
                            return <option key={member.id} value={member.name}>{member.name} ({member.role}) — {tStat.load} Workload</option>;
                          })}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payment Status</label>
                        <div className="flex bg-slate-50 p-1 rounded-2xl border-2 border-slate-100">
                          <button type="button" onClick={() => setFormData({ ...formData, paymentStatus: 'paid' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.paymentStatus === 'paid' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Paid</button>
                          <button type="button" onClick={() => setFormData({ ...formData, paymentStatus: 'unpaid' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.paymentStatus === 'unpaid' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Unpaid</button>
                        </div>
                        {/* Task 5: Safety Reminder */}
                        <div className="mt-2 ml-1 flex items-center gap-1.5">
                          {formData.paymentStatus === 'paid' ? (
                            <><CheckCircle2 size={12} className="text-emerald-500" /><span className="text-[8px] font-black uppercase text-emerald-600">Handshake authorized</span></>
                          ) : (
                            <><Info size={12} className="text-slate-400" /><span className="text-[8px] font-black uppercase text-slate-400">Ledger invoice available later</span></>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Settlement Method</label>
                        <div className="bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl flex items-center justify-center gap-3">
                          <Banknote size={18} className="text-emerald-600" />
                          <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Received By Cash</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row gap-4"><button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-6 rounded-3xl shadow-2xl hover:bg-indigo-700 transition-all uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 group active:scale-95"><ShieldCheck size={20} className="group-hover:animate-pulse" /> Authorize Enrollment Protocol</button><button type="button" onClick={() => setShowBookingForm(false)} className="px-12 py-6 bg-slate-100 text-slate-600 font-black rounded-3xl hover:bg-slate-200 transition-all uppercase tracking-widest text-[11px]">Discard</button></div>
                </form>

                {/* Task 7: Pre-submit Sidebar Summary */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700"><ClipboardCheck size={180} /></div>
                    <div className="relative z-10 space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shadow-xl"><ShieldPlus size={24} /></div>
                        <div>
                          <h4 className="text-lg font-black uppercase tracking-widest">Submission Audit</h4>
                          <p className="text-[9px] font-bold text-indigo-400 uppercase mt-1">Pre-handshake validation</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {[
                          { label: 'Identity Protocol', status: validationSummary.client },
                          { label: 'Hardware Registry', status: validationSummary.device },
                          { label: 'Fiscal Settlement', status: validationSummary.pricing },
                          { label: 'Chronology node', status: validationSummary.pickup }
                        ].map((v, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{v.label}</span>
                            {v.status ? <CheckCircle2 size={18} className="text-emerald-400" /> : <div className="w-4 h-4 rounded-full border-2 border-white/20" />}
                          </div>
                        ))}
                      </div>

                      <div className="pt-6 border-t border-white/5 text-center">
                        <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed">System allows partial nodes, but verified handshakes reduce technical friction by 90%.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><Sparkles size={120} /></div>
                    <div className="relative z-10">
                      <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><BrainCircuit size={16} /> AI Tip</h4>
                      <p className="text-sm font-bold mt-4 leading-relaxed uppercase tracking-tighter italic">"Providing a Serial/IMEI node allows for 100% accurate historical lifecycle tracking in the warehouse ledger."</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Modal */}
      {selectedTimelineRepair && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-white/20 max-h-[90vh]">
            <div className="bg-slate-900 p-8 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4"><div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10"><Terminal size={24} /></div><div><h3 className="text-xl font-black uppercase tracking-widest leading-none">Trace Audit Record</h3><p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 tracking-widest opacity-80">Ref: {selectedTimelineRepair.trackingId}</p></div></div>
              <button onClick={() => setSelectedTimelineRepair(null)} className="p-3 hover:bg-rose-500 rounded-full transition-all"><X size={20} /></button>
            </div>
            <div className="p-10 overflow-y-auto custom-scrollbar flex-1 bg-slate-50/50">
              <div className="relative space-y-12 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(selectedTimelineRepair.events || [{ type: 'Repair Created', timestamp: selectedTimelineRepair.createdAt || selectedTimelineRepair.date, description: 'Technician logged intake protocol.', actor: 'System' }]).map((event: any, idx: number) => (
                  <div key={idx} className="relative flex items-start gap-8 animate-in slide-in-from-left-4" style={{ animationDelay: `${idx * 100}ms` }}>
                    <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center z-10 border-4 border-white shadow-xl ${idx === 0 ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600'}`}><Activity size={18} /></div>
                    <div className="min-w-0 flex-1 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100"><div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2"><h4 className="text-sm font-black uppercase tracking-widest text-slate-800">{event.type}</h4><span className="text-[9px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-lg">{new Date(event.timestamp).toLocaleString()}</span></div><p className="text-xs font-bold text-slate-500 leading-relaxed uppercase tracking-tighter">{event.description}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Profile Sidebar */}
      {selectedClientProfile && (
        <div className="fixed inset-0 z-[450] flex justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col border-l border-slate-100">
            <div className="p-10 flex-1 overflow-y-auto custom-scrollbar">
              <button onClick={() => setSelectedClientProfile(null)} className="mb-10 p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all"><X size={20} /></button>
              <div className="flex flex-col items-center text-center mb-12">
                <div className="w-28 h-28 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center font-black text-4xl shadow-xl border-4 border-white mb-6">{selectedClientProfile.name.charAt(0)}</div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">{selectedClientProfile.name}</h3>
              </div>
              <div className="space-y-8">
                <div className="space-y-3"><h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-2"><Phone size={14} /> Contact Node</h4><div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 text-sm">{selectedClientProfile.contact}</div></div>
                <div className="grid grid-cols-2 gap-4"><div className="p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl"><p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Repairs</p><p className="text-2xl font-black mt-2">{selectedClientProfile.totalRepairs}</p></div><div className="p-6 bg-emerald-600 text-white rounded-[2rem] shadow-xl"><p className="text-[9px] font-black text-emerald-100 uppercase tracking-widest">LTV Spend</p><p className="text-2xl font-black mt-2">{currency.symbol}{selectedClientProfile.totalSpend.toLocaleString()}</p></div></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
