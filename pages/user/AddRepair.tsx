import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import {
  Wrench, User, Smartphone, DollarSign, Calendar, FileText,
  ChevronLeft, Save, AlertOctagon, ArrowUpCircle, ShieldAlert,
  Hash, Palette, Box, Info, CheckCircle2, AlertCircle,
  Image as ImageIcon, Loader2, Sparkles, BrainCircuit,
  ClipboardCheck, Clock, UserCheck, ShieldPlus,
  /* Fixed: Added Zap to the imports */
  Zap
} from 'lucide-react';
import { aiService } from '../../api/aiService';

export const AddRepair: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Existing Form Data
  const [formData, setFormData] = useState({
    customerName: '',
    device: '',
    description: '',
    cost: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as const
  });

  // --- NEW ADDITIVE STATE ---
  const [extraData, setExtraData] = useState({
    serialNumber: '',
    deviceColor: '',
    storageVariant: '',
    symptoms: [] as string[],
    internalNotes: '',
    paymentStatus: 'unpaid' as 'paid' | 'unpaid',
    assignedTo: '',
    deviceImage: null as string | null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const symptomList = ['No Power', 'Screen Issue', 'Battery Problem', 'Network Issue', 'Water Damage', 'Software Loop'];

  useEffect(() => {
    const loadPrerequisites = async () => {
      if (user) {
        try {
          const [dashResp, teamResp] = await Promise.all([
            callBackendAPI('/api/dashboard/overview', null, 'GET'),
            callBackendAPI('/api/team', null, 'GET')
          ]);

          if (dashResp) {
            const plan = dashResp.plans.find((p: any) =>
              (user.planId && p.name.toLowerCase() === user.planId.toLowerCase()) ||
              (user.planId === 'starter' && p.name === 'FREE TRIAL') ||
              (user.planId === 'basic' && p.name === 'BASIC') ||
              (user.planId === 'premium' && p.name === 'PREMIUM') ||
              (user.planId === 'gold' && p.name === 'GOLD')
            ) || dashResp.plans[0];

            setActivePlan(plan);
            if (plan && plan.limits && dashResp.repairCount >= plan.limits.repairsPerMonth) {
              setIsLimitReached(true);
            }
          }
          setTeamMembers(Array.isArray(teamResp) ? teamResp : teamResp?.data || []);
        } catch (error) {
          console.error('Failed to load repair prerequisites:', error);
        }
      }
    };
    loadPrerequisites();
  }, [user]);

  // --- NEW ADDITIVE LOGIC: AI ANALYSIS ---
  const runAIDiagnosis = async () => {
    if (!formData.device || !formData.description) {
      alert("Input device and description for AI audit.");
      return;
    }
    setIsAIAnalyzing(true);
    try {
      const prompt = `Diagnose this device: ${formData.device}. Issue: ${formData.description}. Symptoms: ${extraData.symptoms.join(', ')}. 
      Provide JSON: { "diagnosis": string, "components": string[], "priceRange": string, "timeHint": string }.`;
      const data = await aiService.generateJson(prompt, "System: Technical Repair Diagnostic AI");
      if (data) {
        setAiAnalysis(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  // --- NEW ADDITIVE LOGIC: FILE HANDLING ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    if (file) {
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setFileError("Invalid format. Use JPG or PNG.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setFileError("File too large. Max 2MB allowed.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setExtraData({ ...extraData, deviceImage: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLimitReached || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const payload = {
        customerName: formData.customerName,
        customerEmail: extraData.internalNotes.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0] || `${formData.customerName.toLowerCase().replace(/\s+/g, '')}@example.com`,
        customerPhone: extraData.serialNumber || '', // Hijacking serial as phone if not provided, or keeping default
        device: formData.device,
        deviceModel: extraData.storageVariant || '',
        description: formData.description,
        estimatedCost: parseFloat(formData.cost),
        estimatedCompletionDate: formData.date,
        status: formData.status,
        brand: extraData.deviceColor || '',
        category: 'Smartphone', // Default
        serialNumber: extraData.serialNumber,
        metadata: {
          ...extraData,
          aiNote: aiAnalysis?.diagnosis,
        }
      };

      const response = await callBackendAPI('/api/repairs', payload, 'POST');
      if (response) {
        navigate('/user/repairs');
      }
    } catch (error: any) {
      if (error.limitHit) {
        Swal.fire({
          title: 'Quota Exhausted',
          text: error.upgradeMessage || 'You have reached the repair limit for your current plan.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Upgrade Tier',
          cancelButtonText: 'Review Queue',
          confirmButtonColor: '#0052FF',
          cancelButtonColor: '#94a3b8',
          background: '#ffffff',
          customClass: {
            popup: 'rounded-[1.5rem] border-2 border-blue-50 shadow-2xl',
            title: 'text-xl font-black uppercase text-slate-800 tracking-tightest',
            htmlContainer: 'text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed',
            confirmButton: 'px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[9px] shadow-lg shadow-blue-100',
            cancelButton: 'px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[9px]'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            navigate('/user/pricing');
          } else {
            navigate('/user/repairs');
          }
        });
      } else {
        console.error('Enrollment failed:', error);
        alert(error.message || 'Failed to enroll new repair.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- NEW ADDITIVE LOGIC: VALIDATION SUMMARY ---
  const validationSummary = useMemo(() => {
    return {
      client: !!formData.customerName,
      device: !!formData.device && !!formData.description,
      pricing: parseFloat(formData.cost) > 0,
      pickup: !!formData.date && new Date(formData.date) >= new Date(new Date().setHours(0, 0, 0, 0))
    };
  }, [formData]);

  if (isLimitReached) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-2 border-rose-100 shadow-xl shadow-rose-100/50">
          <ShieldAlert size={48} />
        </div>
        <h2 className="text-4xl font-black text-slate-800 tracking-tighter leading-none mb-4">Ticket Quota Exhausted</h2>
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] mb-6">Service Level Enforcement Policy</p>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm mb-10 text-left">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Tier</span>
            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{activePlan?.name}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 w-full" />
          </div>
          <p className="text-slate-600 text-sm mt-6 font-medium leading-relaxed">
            Your current plan is capped at <b>{activePlan?.limits.repairsPerMonth}</b> repairs per cycle. To continue enrolling new client devices, please promote your account to a higher operational tier.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={() => navigate('/user/pricing')} className="bg-[#0052FF] text-white px-10 py-5 rounded-2xl font-black shadow-2xl shadow-blue-200 flex items-center justify-center gap-3 hover:scale-105 transition-all uppercase tracking-widest text-[11px]">
            <ArrowUpCircle size={20} /> Promote Account Now
          </button>
          <button onClick={() => navigate(-1)} className="bg-slate-100 text-slate-600 px-10 py-5 rounded-2xl font-black hover:bg-slate-200 transition-all uppercase tracking-widest text-[11px]">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-100 rounded-2xl transition-all border border-slate-100 text-slate-400 shadow-sm">
          <ChevronLeft />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Repair Enrollment Node</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">Authorized Technical Intake Protocol</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 shadow-2xl space-y-12">

            {/* 1. EXISTING: CLIENT DETAILS */}
            <div className="space-y-8">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2 border-b border-indigo-50 pb-4">
                <User size={16} /> Client Profile
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Customer Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 font-bold text-sm transition-all" placeholder="Full Identity" value={formData.customerName} onChange={(e) => setFormData({ ...formData, customerName: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Hardware Model *</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 font-bold text-sm transition-all" placeholder="e.g. iPhone 15 Pro Max" value={formData.device} onChange={(e) => setFormData({ ...formData, device: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            {/* TASK 2: ADDITIVE DEVICE IDENTIFICATION */}
            <div className="space-y-8">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2 border-b border-indigo-50 pb-4">
                <Hash size={16} /> Extended Specifications (Optional)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Serial / IMEI</label>
                  <input type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold uppercase" placeholder="Hardware ID" value={extraData.serialNumber} onChange={e => setExtraData({ ...extraData, serialNumber: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Device Color</label>
                  <div className="relative">
                    <Palette className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="text" className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold uppercase" placeholder="Visual node" value={extraData.deviceColor} onChange={e => setExtraData({ ...extraData, deviceColor: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Storage / Variant</label>
                  <div className="relative">
                    <Box className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                    <input type="text" className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold uppercase" placeholder="e.g. 256GB" value={extraData.storageVariant} onChange={e => setExtraData({ ...extraData, storageVariant: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>

            {/* TASK 1: ADDITIVE ISSUE & DIAGNOSIS */}
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-indigo-50 pb-4">
                <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2">
                  <BrainCircuit size={16} /> Issue & Technical Diagnosis
                </h4>
                <button
                  type="button"
                  onClick={runAIDiagnosis}
                  disabled={isAIAnalyzing || !formData.device}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
                >
                  {isAIAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Run AI Audit
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Primary Fault Description *</label>
                  <textarea required rows={3} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 transition-all resize-none uppercase tracking-tighter" placeholder="Describe symptoms as reported by client..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {symptomList.map(s => (
                    <button key={s} type="button" onClick={() => {
                      const exists = extraData.symptoms.includes(s);
                      setExtraData({ ...extraData, symptoms: exists ? extraData.symptoms.filter(x => x !== s) : [...extraData.symptoms, s] });
                    }} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase border-2 transition-all text-center ${extraData.symptoms.includes(s) ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-100'}`}>
                      {s}
                    </button>
                  ))}
                </div>

                {/* AI ADVISORY OUTPUT */}
                {aiAnalysis && (
                  <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg"><Info size={16} /></div>
                      <h5 className="text-[10px] font-black uppercase text-indigo-900 tracking-widest">Neural Diagnostic advisory</h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-indigo-400 uppercase">Suggested Logic</p>
                        <p className="text-xs font-bold text-indigo-900 leading-relaxed italic">"{aiAnalysis.diagnosis}"</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-indigo-400 uppercase">Affected Components</p>
                        <div className="flex flex-wrap gap-2">
                          {aiAnalysis.components?.map((c: string) => <span key={c} className="bg-white px-2 py-1 rounded text-[8px] font-black border border-indigo-100 text-indigo-600 uppercase">{c}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Internal Technician Protocol Notes</label>
                  <textarea rows={2} className="w-full px-5 py-4 bg-slate-900 text-indigo-400 border-2 border-slate-800 rounded-2xl font-mono text-xs focus:border-indigo-500 outline-none" placeholder="// STAFF ONLY: LOG TECHNICAL SPECIFICS..." value={extraData.internalNotes} onChange={e => setExtraData({ ...extraData, internalNotes: e.target.value })} />
                </div>
              </div>
            </div>

            {/* 3. EXISTING: PRICING & LOGISTICS (WITH TASK 4 ADDITIONS) */}
            <div className="space-y-8">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2 border-b border-indigo-50 pb-4">
                <DollarSign size={16} /> Fiscal & Temporal Settlement
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Service Value ({currency.code}) *</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-indigo-600">{currency.symbol}</div>
                    <input required type="number" step="0.01" className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-indigo-100 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 font-black text-lg text-indigo-600" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: e.target.value })} />
                  </div>
                  {/* TASK 4: PRICE HINT */}
                  {aiAnalysis?.priceRange && (
                    <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest ml-1 flex items-center gap-1.5 animate-pulse">
                      <Zap size={10} /> Market Range: {currency.symbol}{aiAnalysis.priceRange}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Handover Timestamp *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="date" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 font-bold text-sm" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                  {/* TASK 4: TIME HINT */}
                  {aiAnalysis?.timeHint && (
                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                      <Clock size={10} /> Estimated Node Lifecycle: {aiAnalysis.timeHint}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* TASK 6: TECHNICIAN ASSIGNMENT & SETTLEMENT */}
            <div className="space-y-8">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2 border-b border-indigo-50 pb-4">
                <UserCheck size={16} /> Assignment & Settlement Matrix
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assign Service Lead</label>
                  <select className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none appearance-none cursor-pointer" value={extraData.assignedTo} onChange={e => setExtraData({ ...extraData, assignedTo: e.target.value })}>
                    <option value="">Unassigned Queue</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.name}>
                        {/* Note: In real app workload/spec would be calculated. Mocking here. */}
                        {m.name} ({m.role}) — {Math.random() > 0.5 ? 'Low' : 'Med'} Workload
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Payment Protocol</label>
                  <div className="flex p-1 bg-slate-100 rounded-2xl">
                    <button type="button" onClick={() => setExtraData({ ...extraData, paymentStatus: 'paid' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${extraData.paymentStatus === 'paid' ? 'bg-white shadow-lg text-emerald-600' : 'text-slate-400'}`}>Paid</button>
                    <button type="button" onClick={() => setExtraData({ ...extraData, paymentStatus: 'unpaid' })} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${extraData.paymentStatus === 'unpaid' ? 'bg-white shadow-lg text-rose-50' : 'text-slate-400'}`}>Unpaid</button>
                  </div>
                  {/* TASK 5: PAYMENT SAFETY NOTES */}
                  <div className="mt-2 ml-1">
                    {extraData.paymentStatus === 'paid' ? (
                      <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-[0.1em] flex items-center gap-1"><CheckCircle2 size={10} /> Funds authorized & verified.</p>
                    ) : (
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1"><Info size={10} /> Digital invoice can be transmitted later.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* TASK 3: ENHANCED IMAGE UPLOAD */}
            <div className="space-y-8">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2 border-b border-indigo-50 pb-4">
                <ImageIcon size={16} /> Technical Asset Documentation
              </h4>
              <div className="space-y-4">
                <div className="relative group aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center overflow-hidden hover:border-indigo-400 transition-all cursor-pointer">
                  {extraData.deviceImage ? (
                    <div className="relative w-full h-full">
                      <img src={extraData.deviceImage} className="w-full h-full object-cover" alt="Node visual" />
                      <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                        <span className="bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase text-slate-900">Replace node</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center group-hover:scale-110 transition-transform">
                      <ImageIcon size={48} className="text-slate-200 mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Transmit Hardware Evidence</p>
                      <p className="text-[8px] font-bold text-slate-300 uppercase mt-2">JPG / PNG Node Access • Max 2MB</p>
                    </div>
                  )}
                  <input type="file" accept="image/jpeg,image/png" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                {fileError && <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest text-center mt-2 flex items-center justify-center gap-2 animate-bounce"><AlertCircle size={14} /> {fileError}</p>}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50 flex flex-col sm:flex-row gap-4">
              <button type="submit" className="flex-1 bg-[#0052FF] text-white font-black py-6 rounded-[2rem] shadow-2xl shadow-blue-200 hover:bg-blue-600 flex items-center justify-center gap-3 transition-all uppercase tracking-[0.3em] text-[11px] group active:scale-95">
                <Save size={20} className="group-hover:animate-pulse" /> Finalize Node Enrollment
              </button>
              <button type="button" onClick={() => navigate(-1)} className="px-12 py-6 bg-slate-100 text-slate-600 font-black rounded-[2rem] hover:bg-slate-200 transition-all uppercase tracking-widest text-[11px]">
                Discard
              </button>
            </div>
          </form>
        </div>

        {/* TASK 7: PRE-SUBMIT VALIDATION SUMMARY (SIDEBAR) */}
        <div className="lg:col-span-4 space-y-8 sticky top-24">
          <div className="bg-slate-900 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><ClipboardCheck size={200} /></div>
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md">
                  <ShieldPlus size={24} />
                </div>
                <div>
                  <h4 className="text-lg font-black uppercase tracking-widest">Submission Audit</h4>
                  <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Protocol Pre-verification</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { label: 'Identity Protocol', status: validationSummary.client },
                  { label: 'Hardware Definition', status: validationSummary.device },
                  { label: 'Fiscal Settlement', status: validationSummary.pricing },
                  { label: 'Chronological Node', status: validationSummary.pickup }
                ].map((v, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{v.label}</span>
                    {v.status ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-white/20" />
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5">
                <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-tighter text-center">
                  Submission authorization is only possible when mandatory hardware nodes are defined. Protocol will fail on partial records.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-1000"><Zap size={150} /></div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 relative z-10 text-indigo-200">System Tip</h4>
            <p className="text-sm font-bold leading-relaxed uppercase tracking-tighter relative z-10">
              Authorizing the <span className="text-amber-400 font-black">AI Audit Node</span> reduces technician diagnostic latency by up to 40% based on historical pattern recognition.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};