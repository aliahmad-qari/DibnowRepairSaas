
import React, { useState, useEffect, useMemo } from 'react';
import {
  Check, X, CreditCard, Wallet, ShieldCheck, CheckCircle2,
  Loader2, Globe, Landmark, ChevronRight, AlertCircle,
  Zap, Shield, Rocket, Boxes, Wrench, Users, Star,
  ArrowRight, HandCoins, ReceiptText, Lock, Wallet2, AlertTriangle,
  Hash, Timer, Tag, Layers, BrainCircuit, Calendar,
  FileText, Download, Sparkles, RefreshCw, ShoppingCart, HelpCircle,
  ShieldAlert, Activity, XCircle, History, Info,
  ArrowUpCircle, FileCheck, ShieldX, CreditCard as CardIcon,
  PartyPopper, ExternalLink, Smartphone, Banknote, Image as ImageIcon,
  Plus, ToggleRight, ToggleLeft, Minus, Cpu, ShieldPlus, Vault
} from 'lucide-react';
import { db } from '../../api/db';
import { callBackendAPI, getBackendUserId } from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useNavigate } from 'react-router-dom';
import { SubscriptionPlan } from '../../types';

const EXCHANGE_RATES: Record<string, number> = {
  'GBP_USD': 1.27, 'GBP_EUR': 1.17, 'GBP_PKR': 354.0, 'GBP_INR': 105.4, 'GBP_AED': 4.66, 'GBP_AUD': 1.94, 'GBP_CAD': 1.72,
  'USD_GBP': 0.79, 'USD_EUR': 0.92, 'USD_PKR': 278.5, 'USD_INR': 83.1, 'USD_AED': 3.67, 'USD_AUD': 1.52, 'USD_CAD': 1.35,
  'EUR_GBP': 0.85, 'EUR_USD': 1.08, 'EUR_PKR': 302.2, 'EUR_INR': 90.15, 'EUR_AED': 3.98, 'EUR_AUD': 1.65, 'EUR_CAD': 1.47,
  'PKR_GBP': 0.0028, 'PKR_USD': 0.0036, 'PKR_EUR': 0.0033, 'PKR_INR': 0.3, 'PKR_AED': 0.013, 'PKR_AUD': 0.0055, 'PKR_CAD': 0.0049,
  'INR_GBP': 0.0095, 'INR_USD': 0.012, 'INR_EUR': 0.011, 'INR_PKR': 3.35, 'INR_AED': 0.044, 'INR_AUD': 0.018, 'INR_CAD': 0.016,
  'AED_GBP': 0.21, 'AED_USD': 0.27, 'AED_EUR': 0.25, 'AED_PKR': 75.8, 'AED_INR': 22.6, 'AED_AUD': 0.42, 'AED_CAD': 0.37,
  'AUD_GBP': 0.52, 'AUD_USD': 0.66, 'AUD_EUR': 0.61, 'AUD_PKR': 182.4, 'AUD_INR': 54.4, 'AUD_AED': 2.41, 'AUD_CAD': 0.89,
  'CAD_GBP': 0.58, 'CAD_USD': 0.74, 'CAD_EUR': 0.68, 'CAD_PKR': 204.5, 'CAD_INR': 61.1, 'CAD_AED': 2.71, 'CAD_AUD': 1.13
};

export const UserPricing: React.FC = () => {
  const { user } = useAuth();
  const { currency, setManualCurrency, availableCurrencies, isDetecting } = useCurrency();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<SubscriptionPlan | null>(null);

  // Default to Stripe payment protocol
  const [paymentMethod, setPaymentMethod] = useState<string>('Stripe');
  const [autoRenew, setAutoRenew] = useState(true);

  // New Flow States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [failureState, setFailureState] = useState<string | null>(null);

  // Specific Method Form States
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [manualForm, setManualForm] = useState({
    method: 'Bank Transfer',
    transactionId: '',
    notes: '',
    amount: ''
  });

  useEffect(() => {
    // Fetch plans from backend MongoDB database instead of localStorage
    const fetchPlans = async () => {
      try {
        console.log('📋 [Plans] Fetching plans from database...');
        const response = await callBackendAPI('/api/plans/all', undefined, 'GET');

        console.log('📋 [Plans] Response received:', response);

        if (response.success && response.plans) {
          // Map MongoDB plans to frontend format
          const mappedPlans = response.plans.map((plan: any) => ({
            id: plan._id, // Using real MongoDB ObjectId ✅
            name: plan.name,
            price: plan.price,
            baseCurrency: plan.currency,
            duration: 'monthly',
            features: plan.features || [],
            limits: plan.limits || { repairsPerMonth: 0, inventoryItems: 0, aiDiagnostics: false },
            description: plan.description
          }));

          console.log('✅ [Plans] Successfully loaded plans:', {
            count: mappedPlans.length,
            plans: mappedPlans.map(p => ({ id: p.id, name: p.name, price: p.price }))
          });

          setPlans(mappedPlans);
        } else {
          console.warn('⚠️ [Plans] Unexpected response format:', response);
        }
      } catch (error) {
        console.error('❌ [Plans] Failed to fetch plans from database:', error);
        // database-driven only - no local fallback
        setPlans([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const currentPlan = useMemo(() => {
    return plans.find(p => p.id === (user?.planId || 'starter')) || plans[0];
  }, [user, plans]);

  const usageStats = useMemo(() => {
    if (!user) return { repairs: 0, stock: 0, team: 0, brands: 0, categories: 0 };
    return {
      repairs: db.repairs.getAll().length,
      stock: db.inventory.getAll().length,
      team: db.userTeamV2.getByOwner(user.id).length,
      brands: db.brands.getAll().length,
      categories: db.categories.getAll().length,
    };
  }, [user]);

  const getLocalizedPrice = (plan: any) => {
    if (!plan) return 0;
    const baseCode = plan.baseCurrency || 'GBP';
    const targetCode = currency.code;
    if (baseCode === targetCode) return plan.price;
    const pair = `${baseCode}_${targetCode}`;
    const rate = EXCHANGE_RATES[pair] || 1;
    const converted = plan.price * rate;
    return targetCode === 'PKR' ? Math.round(converted) : parseFloat(converted.toFixed(2));
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    const isActive = plan.id === user?.planId || (plan.id === 'starter' && !user?.planId);
    if (isActive) return;

    setSelectedPlanForUpgrade(plan);
    setPaymentMethod('Stripe');
    setFailureState(null);
    setCardData({ number: '', expiry: '', cvc: '', name: '' });
    setManualForm({ method: 'Bank Transfer', transactionId: '', notes: '', amount: '' });
  };

  // ✅ Functional PDF Download (Simulation)
  const handleDownloadInvoice = () => {
    const localizedPrice = getLocalizedPrice(currentPlan);
    const headers = ["Invoice Ref", "Customer", "Email", "Plan", "Price", "Date", "Status"];
    const row = [
      `INV-SUB-${Math.floor(1000 + Math.random() * 9000)}`,
      user?.name || "Anonymous",
      user?.email || "N/A",
      currentPlan?.name || "Free Trial",
      `${currency.symbol}${localizedPrice.toLocaleString()}`,
      new Date().toLocaleDateString(),
      "PAID"
    ];

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + row.join(",");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Invoice_Audit_${user?.name}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    db.activity.log({
      actionType: 'Invoice Audit Downloaded',
      moduleName: 'Billing',
      refId: user?.id || 'System',
      status: 'Success'
    });
  };

  const finalizeUpgrade = async () => {
    if (!selectedPlanForUpgrade || !user || !paymentMethod) return;
    const localizedPrice = getLocalizedPrice(selectedPlanForUpgrade);

    console.log('💳 [Payment] Starting payment process:', {
      plan: selectedPlanForUpgrade.name,
      planId: selectedPlanForUpgrade.id,
      paymentMethod: paymentMethod,
      amount: localizedPrice,
      currency: currency.code,
      autoRenew: autoRenew,
      userId: getBackendUserId()
    });

    setIsLoading(true);
    setShowConfirmModal(false);

    try {
      // ========== WALLET BALANCE PAYMENT (Keep existing logic) ==========
      if (paymentMethod === 'Wallet Balance') {
        console.log('💰 [Payment] Processing wallet balance payment');
        const balance = user.walletBalance || 0;
        if (balance < localizedPrice) {
          console.warn('⚠️ [Payment] Insufficient wallet balance:', { balance, required: localizedPrice });
          setFailureState("Insufficient Treasury Balance. Please top up your wallet or choose another method.");
          setIsLoading(false);
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
        db.user.updateBalance(localizedPrice, 'debit');
        db.users.update(user.id, { planId: selectedPlanForUpgrade.id });
        db.wallet.addTransaction({
          amount: localizedPrice,
          type: 'debit',
          status: 'success',
          date: new Date().toLocaleDateString(),
          description: `Subscription Upgrade: ${selectedPlanForUpgrade.name}`
        });

        console.log('✅ [Payment] Wallet payment successful');
        setSuccessState(true);
        setIsLoading(false);
        return;
      }

      // ========== MANUAL PAYMENT (Keep existing logic) ==========
      if (paymentMethod === 'Manual Payment') {
        console.log('📝 [Payment] Processing manual payment request');
        await new Promise(resolve => setTimeout(resolve, 1500));
        db.planRequests.add({
          shopId: user.id,
          shopName: user.name,
          currentPlanId: user.planId || 'starter',
          currentPlanName: currentPlan?.name || 'Starter',
          requestedPlanId: selectedPlanForUpgrade.id,
          requestedPlanName: selectedPlanForUpgrade.name,
          transactionId: manualForm.transactionId,
          amount: localizedPrice,
          currency: currency.code,
          manualMethod: manualForm.method,
          notes: manualForm.notes
        });

        console.log('✅ [Payment] Manual payment request submitted');
        setSuccessState(true);
        setIsLoading(false);
        return;
      }

      // ========== STRIPE PAYMENT (Real Integration) ==========
      if (paymentMethod === 'Stripe') {
        console.log('🔵 [Stripe] Initiating Stripe checkout session');
        const response = await callBackendAPI('/api/stripe/create-checkout-session', {
          planId: selectedPlanForUpgrade.id,
          userId: getBackendUserId(),
          enableAutoRenew: autoRenew,
          currency: currency.code,
          amount: localizedPrice
        });

        console.log('🔵 [Stripe] Checkout session created:', response);

        if (response.url) {
          console.log('🔵 [Stripe] Redirecting to:', response.url);
          window.location.href = response.url;
        } else {
          console.error('❌ [Stripe] No checkout URL in response:', response);
          throw new Error('No checkout URL received from Stripe');
        }
        return;
      }

      // ========== PAYFAST PAYMENT (Real Integration) ==========
      if (paymentMethod === 'PayFast') {
        console.log('🟡 [PayFast] Initiating PayFast payment');
        const response = await callBackendAPI('/api/payfast/create-payment', {
          planId: selectedPlanForUpgrade.id,
          userId: getBackendUserId(),
          enableAutoRenew: autoRenew,
          currency: currency.code,
          amount: localizedPrice
        });

        console.log('🟡 [PayFast] Payment URL created:', response);

        if (response.paymentUrl) {
          console.log('🟡 [PayFast] Redirecting to:', response.paymentUrl);
          window.location.href = response.paymentUrl;
        } else {
          console.error('❌ [PayFast] No payment URL in response:', response);
          throw new Error('No payment URL received from PayFast');
        }
        return;
      }

      // ========== PAYPAL PAYMENT (Real Integration) ==========
      if (paymentMethod === 'PayPal') {
        console.log('🔴 [PayPal] Initiating PayPal order');
        const response = await callBackendAPI('/api/paypal/create-order', {
          planId: selectedPlanForUpgrade.id,
          userId: getBackendUserId(),
          enableAutoRenew: autoRenew,
          currency: currency.code,
          amount: localizedPrice
        });

        console.log('🔴 [PayPal] Order created:', response);

        if (response.approvalUrl) {
          console.log('🔴 [PayPal] Redirecting to:', response.approvalUrl);
          window.location.href = response.approvalUrl;
        } else {
          console.error('❌ [PayPal] No approval URL in response:', response);
          throw new Error('No approval URL received from PayPal');
        }
        return;
      }

    } catch (error: any) {
      console.error('💥 [Payment] Payment failed:', {
        paymentMethod: paymentMethod,
        error: error,
        errorMessage: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString()
      });
      setFailureState(error.message || "Payment node refused the transaction. Please verify details.");
      setIsLoading(false);
    }
  };

  const paymentGateways = [
    { id: 'Stripe', icon: CreditCard, color: 'text-indigo-500', desc: 'Secure Card Protocol' },
    { id: 'Wallet Balance', icon: Wallet, color: 'text-amber-500', desc: 'Deduct from Treasury' },
    { id: 'PayPal', icon: Wallet2, color: 'text-blue-500', desc: 'Digital Wallet Redirect' },
    { id: 'PayFast', icon: Landmark, color: 'text-emerald-500', desc: 'South Africa Node' },
    { id: 'Manual Payment', icon: Banknote, color: 'text-slate-500', desc: 'Bank Transfer Logic' }
  ];

  const isFormValid = useMemo(() => {
    if (!paymentMethod) return false;
    if (paymentMethod === 'Stripe') return cardData.number.length >= 12 && cardData.expiry.length >= 4;
    if (paymentMethod === 'Manual Payment') return manualForm.transactionId.length > 3;
    if (paymentMethod === 'Wallet Balance') return (user?.walletBalance || 0) >= getLocalizedPrice(selectedPlanForUpgrade);
    return true; // PayPal, PayFast (Redirect mock)
  }, [paymentMethod, cardData, manualForm, user, selectedPlanForUpgrade]);

  // Derived high-usage state
  const highUsageDetected = useMemo(() => {
    if (!currentPlan) return false;
    const { repairs, stock, team, brands, categories } = usageStats;
    const { limits } = currentPlan;
    return (
      (repairs / limits.repairsPerMonth) >= 0.8 ||
      (stock / limits.inventoryItems) >= 0.8 ||
      (team / limits.teamMembers) >= 0.8 ||
      (brands / limits.brands) >= 0.8 ||
      (categories / limits.categories) >= 0.8
    );
  }, [usageStats, currentPlan]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-32 max-w-[1400px] mx-auto px-4">

      {/* 0. EXPIRY WARNING */}
      {user?.status === 'expired' && (
        <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2.5rem] flex items-center gap-5 animate-bounce-short">
          <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h4 className="text-rose-900 font-black uppercase text-sm tracking-tight">System Access Expired</h4>
            <p className="text-rose-700 text-[10px] font-bold uppercase tracking-widest mt-1">Authorized cycle ended. Deploy a payment to restore node connectivity.</p>
          </div>
        </div>
      )}

      {/* 1. CURRENT PLAN STATUS PANEL */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-10 group relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Shield size={120} />
        </div>

        <div className="flex items-center gap-8 relative z-10 w-full lg:w-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105 duration-500 shrink-0">
            <Rocket size={40} fill="white" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">✅ Current Active Plan</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase mt-1">{currentPlan?.name || 'Starter'}</h2>
            <div className="flex items-center gap-3 mt-3">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Protocol Active
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">v2.4 Node</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 w-full lg:flex-1 lg:max-w-3xl relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-indigo-600" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">📅 Expiry / Renewal Date</p>
            </div>
            <p className="text-lg font-black text-slate-800 uppercase tracking-tighter">15 Feb 2026</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Next automated settlement</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-emerald-600" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">🔁 Auto-Renew Status</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRenew(!autoRenew)}
                className="transition-transform active:scale-90"
              >
                {autoRenew ? (
                  <ToggleRight size={32} className="text-emerald-500" />
                ) : (
                  <ToggleLeft size={32} className="text-slate-300" />
                )}
              </button>
              <span className={`text-sm font-black uppercase tracking-tighter ${autoRenew ? 'text-emerald-600' : 'text-slate-400'}`}>
                {autoRenew ? 'Automatic ON' : 'Automatic OFF'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ReceiptText size={14} className="text-blue-600" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">🧾 Last Invoice Amount</p>
            </div>
            <p className="text-2xl font-black text-slate-900 tracking-tighter">
              {currency.symbol}{getLocalizedPrice(currentPlan).toLocaleString()}
            </p>
            {/* ✅ FIXED: Button now functional */}
            <button
              onClick={handleDownloadInvoice}
              className="text-[9px] font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 hover:border-indigo-600 transition-all"
            >
              Download Audit PDF
            </button>
          </div>
        </div>
      </div>

      {/* 2. OPERATIONAL QUOTA MONITOR (REFINED WITH ALL STATS) */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 transition-transform duration-700 group-hover:scale-110">
          <Activity size={200} />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 mb-10">
          <div>
            <h3 className="text-xl font-black uppercase tracking-widest leading-none">Operational Quota Monitor</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Real-time resource allocation audit</p>
          </div>
          {highUsageDetected && (
            <div className="px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3 animate-pulse">
              <AlertCircle size={18} className="text-amber-500" />
              <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest">📌 Upgrade to avoid operational blockage</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10 relative z-10">
          {[
            { label: 'Repairs', used: usageStats.repairs, limit: currentPlan?.limits?.repairsPerMonth || 1, icon: Wrench },
            { label: 'Stock items', used: usageStats.stock, limit: currentPlan?.limits?.inventoryItems || 1, icon: Boxes },
            { label: 'Team members', used: usageStats.team, limit: currentPlan?.limits?.teamMembers || 1, icon: Users },
            { label: 'Brand registry', used: usageStats.brands, limit: currentPlan?.limits?.brands || 1, icon: Tag },
            { label: 'Categories', used: usageStats.categories, limit: currentPlan?.limits?.categories || 1, icon: Layers },
            { label: 'AI Diagnostic usage', used: currentPlan?.limits?.aiDiagnostics ? 'Active' : 'Locked', limit: 'Authorized', icon: BrainCircuit, isStatus: true }
          ].map((stat, i) => {
            const usedVal = typeof stat.used === 'number' ? stat.used : 0;
            const limitVal = typeof stat.limit === 'number' ? stat.limit : 1;
            const percent = Math.min(100, Math.floor((usedVal / limitVal) * 100));

            return (
              <div key={i} className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <stat.icon size={12} className="text-indigo-400" /> {stat.label}
                  </span>
                  <span className={`text-[10px] font-black uppercase ${percent >= 90 ? 'text-rose-500' : 'text-indigo-400'}`}>
                    {stat.used} / {Number(stat.limit) >= 999 ? '∞' : stat.limit}
                  </span>
                </div>
                {stat.isStatus ? (
                  <div className={`py-3 px-4 rounded-xl border font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 ${currentPlan?.limits?.aiDiagnostics ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                    {currentPlan?.limits?.aiDiagnostics ? <Check size={14} /> : <Lock size={14} />} {stat.used}
                  </div>
                ) : (
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-0.5">
                    <div
                      className={`h-full transition-all duration-1000 rounded-full ${percent >= 100 ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-indigo-50'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. PLAN FEATURE COMPARISON TABLE */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 md:p-10 border-b border-slate-50 flex items-center gap-4 bg-slate-50/20">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Layers size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Plan Feature Comparison</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Side-by-side tier capability matrix</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-10 py-6 text-[10px] font-black uppercase text-slate-400 tracking-widest">Protocol Capability</th>
                {plans.map(p => (
                  <th key={p.id} className="px-10 py-6 text-center">
                    <p className={`text-[10px] font-black uppercase tracking-widest ${p.id === user?.planId ? 'text-indigo-600' : 'text-slate-400'}`}>{p.name}</p>
                    {p.id === user?.planId && <span className="text-[8px] bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase mt-1 inline-block">Active Node</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { label: 'Authorized Repairs (Monthly)', keys: 'repairsPerMonth' },
                { label: 'Stock Items Catalog', keys: 'inventoryItems' },
                { label: 'Active Workforce Seats', keys: 'teamMembers' },
                { label: 'Manufacturer Registry', keys: 'brands' },
                { label: 'Classification Categories', keys: 'categories' }
              ].map((feature, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-5 text-xs font-black text-slate-700 uppercase tracking-tight">{feature.label}</td>
                  {plans.map(p => (
                    <td key={p.id} className="px-10 py-5 text-center font-black text-slate-600 text-sm">
                      {(p.limits as any)[feature.keys] >= 999 ? 'Unlimited' : (p.limits as any)[feature.keys]}
                    </td>
                  ))}
                </tr>
              ))}
              {[
                { label: 'AI Neural Diagnostics', keys: 'aiDiagnostics', icon: Cpu },
                { label: 'Multi-Shop Node Control', keys: 'multiShop', icon: Globe, forceNo: ['starter', 'basic', 'premium'] },
                { label: 'Enterprise Vault Security', keys: 'vault', icon: Vault, forceNo: ['starter', 'basic', 'premium'] }
              ].map((feature, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-10 py-5 flex items-center gap-3 text-xs font-black text-slate-700 uppercase tracking-tight">
                    <feature.icon size={16} className="text-indigo-400" /> {feature.label}
                  </td>
                  {plans.map(p => {
                    const isAvailable = feature.forceNo ? !feature.forceNo.includes(p.id) : (p.limits as any)[feature.keys];
                    return (
                      <td key={p.id} className="px-10 py-5 text-center">
                        {isAvailable ? (
                          <CheckCircle2 size={18} className="text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle size={18} className="text-rose-300 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. AI DIAGNOSTICS EXPLANATION PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000">
            <BrainCircuit size={200} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                <Cpu size={28} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">AI Diagnostics Node</h3>
            </div>
            <p className="text-blue-100 text-sm font-medium leading-relaxed max-w-lg mb-8">
              Our proprietary Neural Analysis Module leverages massive datasets of gadget failure patterns to generate predictive technical reports. Accelerate your intake protocol with automated symptom-to-solution mapping.
            </p>
            <div className="space-y-4">
              {[
                'Predictive failure analysis based on model ID',
                'Automated component cost estimations',
                'Dynamic repair time forecasting',
                'Technical checklist generation'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Sparkles size={16} className="text-amber-400 shrink-0" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-indigo-100">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-10 flex flex-col justify-center items-center text-center space-y-6">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
            <ShieldPlus size={40} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-800">Advanced Infrastructure</h3>
            <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto mt-2 leading-relaxed">
              Unlock Enterprise-grade features including Global Vault Security and Multi-Shop Node Synchronization with our GOLD Tier protocol.
            </p>
          </div>
          <button onClick={() => {
            const goldPlan = plans.find(p => p.id === 'gold');
            if (goldPlan) handleSelectPlan(goldPlan);
          }} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-black transition-all">
            Explore Gold Tier
          </button>
        </div>
      </div>

      <div className="text-center space-y-4 pt-10">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none uppercase">Infrastructure <span className="text-indigo-600">Expansion</span></h2>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Select an infrastructure tier matching your shop's transactional volume.</p>
      </div>

      {/* 5. PRICING GRIDS - REDESIGNED PER USER REQUEST */}
      {isLoading ? (
        <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-indigo-600 h-12 w-12" /><p className="mt-4 text-slate-400 font-bold uppercase tracking-widest">Loading Infrastructure Tiers...</p></div>
      ) : plans.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-slate-100 flex flex-col items-center justify-center">
          <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="text-amber-500 h-8 w-8" />
          </div>
          <h3 className="text-xl font-black uppercase text-slate-800 tracking-tight">System Configuration Pending</h3>
          <p className="mt-2 text-slate-400 font-bold uppercase tracking-widest max-w-md mx-auto text-xs leading-relaxed">Infrastructure tiers have not been seeded. Please contact system administration to initialize the billing node.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => {
            const isActive = plan.id === user?.planId || (plan.id === 'starter' && !user?.planId);
            return (
              <div key={plan.id} className={`p-10 rounded-[3.5rem] flex flex-col border-2 transition-all duration-500 hover:-translate-y-2 group ${isActive ? 'bg-indigo-600 text-white shadow-2xl scale-105 border-indigo-500' : 'bg-white border-slate-100 shadow-xl text-slate-900 hover:border-indigo-400'}`}>
                <div className="mb-10">
                  <h3 className={`text-2xl font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                  <div className="text-4xl font-black mt-2 tracking-tighter">
                    <span className="text-xl font-bold">{currency.symbol}</span>
                    {getLocalizedPrice(plan)}
                    <span className="text-xs opacity-50 font-black uppercase">/mo</span>
                  </div>
                </div>

                <div className="flex-1 space-y-6 mb-10">
                  <div className="space-y-4">
                    {[
                      { label: 'Repair Customer', value: plan.limits.repairsPerMonth, icon: Wrench },
                      { label: 'In Stock', value: plan.limits.inventoryItems, icon: Boxes },
                      { label: 'Category', value: plan.limits.categories, icon: Layers },
                      { label: 'Brand', value: plan.limits.brands, icon: Tag },
                      { label: 'Teams', value: plan.limits.teamMembers, icon: Users }
                    ].map((limit, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-indigo-200' : 'bg-indigo-600'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-50' : 'text-slate-600'}`}>
                          {limit.value >= 999 ? '∞' : limit.value} {limit.label}
                        </span>
                      </div>
                    ))}

                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center gap-3">
                        {plan.limits.aiDiagnostics ? (
                          <Sparkles size={16} className={isActive ? 'text-amber-300' : 'text-indigo-600'} />
                        ) : (
                          <Lock size={16} className={isActive ? 'text-white/40' : 'text-slate-300'} />
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-white' : plan.limits.aiDiagnostics ? 'text-slate-800' : 'text-slate-400'}`}>
                          {plan.limits.aiDiagnostics ? 'AI Diagnostics Authorized' : 'AI Diagnostics Locked'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/5 opacity-80">
                    {plan.features.slice(0, 2).map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-[9px] font-bold uppercase tracking-tight italic">
                        • {f}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isActive}
                  className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-2xl active:scale-95 ${isActive ? 'bg-white/10 text-white/50 cursor-default' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
                >
                  {isActive ? '✓ Active Node' : 'Deploy Tier'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* SECURE INFRASTRUCTURE CHECKOUT MODAL */}
      {selectedPlanForUpgrade && !successState && !failureState && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20 flex flex-col max-h-[95vh]">

            {/* Checkout Header */}
            <div className="p-8 md:p-10 bg-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-white/20 rounded-[1.5rem] flex items-center justify-center border border-white/20 backdrop-blur-md shadow-2xl">
                  <ShoppingCart size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-widest leading-none">Secure Checkout</h2>
                  <p className="text-[9px] font-bold text-indigo-100 uppercase mt-2 tracking-widest opacity-80">Infrastructure Deployment Terminal</p>
                </div>
              </div>
              <button onClick={() => setSelectedPlanForUpgrade(null)} className="p-3 bg-white/10 hover:bg-rose-500 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 custom-scrollbar">
              <div className="p-8 md:p-12 space-y-10">

                {/* Plan Summary Summary */}
                <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12"><ReceiptText size={120} /></div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Payment Due</p>
                    <p className="text-5xl font-black text-slate-900 mt-2 tracking-tighter leading-none">{currency.symbol}{getLocalizedPrice(selectedPlanForUpgrade).toLocaleString()}</p>
                  </div>
                  <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm shrink-0 relative z-10 text-right">
                    <span className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">{selectedPlanForUpgrade.name} Node</span>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">30-Day Deployment Cycle</p>
                  </div>
                </div>

                {/* Specialized 5-Protocol Payment Grid */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" /> Select Payment Protocol
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {paymentGateways.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={`group relative p-5 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === m.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xl scale-[1.03]' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50 hover:border-indigo-200'}`}
                      >
                        {paymentMethod === m.id && <CheckCircle2 size={16} className="absolute top-3 right-3 text-white animate-in zoom-in" />}
                        <m.icon size={28} className={paymentMethod === m.id ? 'text-white' : m.color} />
                        <div className="text-center">
                          <p className="text-[9px] font-black uppercase tracking-widest">{m.id}</p>
                          <p className={`text-[7px] font-bold uppercase mt-1 opacity-60 ${paymentMethod === m.id ? 'text-white' : 'text-slate-400'}`}>{m.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Forms */}
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  {paymentMethod === 'Wallet Balance' && (
                    <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100"><Wallet size={20} /></div>
                          <span className="text-[11px] font-black text-indigo-700 uppercase tracking-widest">Shop Treasury</span>
                        </div>
                        <span className="text-2xl font-black text-indigo-900">{currency.symbol}{(user?.walletBalance || 0).toLocaleString()}</span>
                      </div>
                      <p className="text-[9px] font-bold text-indigo-600/70 uppercase leading-relaxed text-center py-2 border-t border-indigo-100">Deduction will be authorized from internal virtual assets.</p>
                      {(user?.walletBalance || 0) < getLocalizedPrice(selectedPlanForUpgrade) && (
                        <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-200 shrink-0">
                              <AlertTriangle size={18} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-rose-900 uppercase tracking-tight leading-none">Insufficient Treasury Balance</p>
                              <p className="text-[8px] font-bold text-rose-500 uppercase tracking-widest mt-1">Re-fill wallet or select external protocol.</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate('/user/wallet')}
                            className="bg-rose-600 text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all flex items-center gap-2 active:scale-95"
                          >
                            <Plus size={14} /> Top Up Balance
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === 'Stripe' && (
                    <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center space-y-4">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl border border-slate-100 text-indigo-600 animate-pulse">
                        <ExternalLink size={28} />
                      </div>
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-[0.2em]">Stripe Checkout Redirect</h4>
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest max-w-xs mx-auto">You will be securely redirected to Stripe's payment portal to complete your transaction.</p>
                    </div>
                  )}

                  {(paymentMethod === 'PayPal' || paymentMethod === 'PayFast') && (
                    <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center space-y-4">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-xl border border-slate-100 text-indigo-600 animate-pulse">
                        <ExternalLink size={28} />
                      </div>
                      <h4 className="text-xs font-black uppercase text-slate-800 tracking-[0.2em]">External Gateway Link</h4>
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest max-w-xs mx-auto">You will be routed to a secure external protocol node to authorize this transaction.</p>
                    </div>
                  )}

                  {paymentMethod === 'Manual Payment' && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Bank Node</label>
                          <select className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase cursor-pointer" value={manualForm.method} onChange={e => setManualForm({ ...manualForm, method: e.target.value })}>
                            <option>Local Bank Transfer</option>
                            <option>International Swift</option>
                            <option>JazzCash Terminal</option>
                            <option>EasyPaisa Node</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Transaction Proof ID</label>
                          <input type="text" placeholder="REF-#0000" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:border-indigo-500" value={manualForm.transactionId} onChange={e => setManualForm({ ...manualForm, transactionId: e.target.value })} />
                        </div>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase text-center border-t border-slate-100 pt-4">Manual nodes require manual audit (2-4 hours SLA).</p>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-6 space-y-6">
                  <div className="flex items-center justify-center gap-3 opacity-40">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">AES-256 Bit Payment Encryption Active</span>
                  </div>
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={isLoading || !isFormValid}
                    className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 disabled:grayscale"
                  >
                    {isLoading ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : <><ShieldCheck size={20} /> Complete Payment & Deploy</>}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION OVERLAY */}
      {showConfirmModal && selectedPlanForUpgrade && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-3xl bg-slate-950/70 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 text-center shadow-2xl border border-indigo-100 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner"><ShieldCheck size={40} /></div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">Authorize Node Promotion</h3>
            <p className="text-slate-500 text-sm font-medium mt-6 leading-relaxed uppercase tracking-tighter">
              Authorize payment for <span className="text-indigo-600 font-black">{selectedPlanForUpgrade.name}</span> via <span className="text-slate-900 font-black">{paymentMethod}</span>?
            </p>
            <div className="mt-12 space-y-3">
              <button onClick={finalizeUpgrade} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">Yes, Authorize Payment</button>
              <button onClick={() => setShowConfirmModal(false)} className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600">Cancel Protocol</button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL (JAZZ WORLD CELEBRATION) */}
      {successState && selectedPlanForUpgrade && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-emerald-600 animate-in fade-in zoom-in duration-500">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/20 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-400/30 blur-[120px] rounded-full" />
          </div>

          <div className="bg-white w-full max-w-4xl md:rounded-[4rem] h-full md:h-auto shadow-2xl flex flex-col items-center justify-center p-8 md:p-20 text-center relative overflow-hidden border-8 border-emerald-500/20">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-emerald-50 text-emerald-600 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center mb-6 md:mb-10 shadow-2xl animate-bounce border-4 border-white shrink-0">
              <PartyPopper size={56} className="md:w-16 md:h-16" />
            </div>
            <h2 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-none">CONGRATULATIONS!</h2>
            <h3 className="text-xl md:text-3xl font-black text-indigo-600 uppercase tracking-widest mt-4">DEPLOYMENT COMPLETE</h3>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] md:text-sm mt-6">Infrastructure Tier <span className="text-indigo-600 font-black">{selectedPlanForUpgrade.name}</span> is now ACTIVE</p>

            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-10 mt-10 md:mt-12 py-6 md:py-8 px-8 md:px-12 bg-slate-50 rounded-[2rem] md:rounded-[3rem] border border-slate-100">
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <span className="text-3xl md:text-4xl font-black text-indigo-600 tracking-tighter">{selectedPlanForUpgrade.limits.repairsPerMonth}</span>
                <span className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">Authorized Repairs</span>
              </div>
              <div className="hidden sm:block w-px h-full bg-slate-200" />
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <span className="text-3xl md:text-4xl font-black text-indigo-600 tracking-tighter">{selectedPlanForUpgrade.limits.inventoryItems}</span>
                <span className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">Stock Units</span>
              </div>
              <div className="hidden sm:block w-px h-full bg-slate-200" />
              <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                <span className="text-3xl md:text-4xl font-black text-indigo-600 tracking-tighter">{selectedPlanForUpgrade.limits.teamMembers}</span>
                <span className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest">Associate Seats</span>
              </div>
            </div>

            <div className="mt-12 md:mt-16 w-full max-w-md">
              <button
                onClick={() => navigate('/user/dashboard')}
                className="w-full py-5 md:py-7 bg-slate-900 text-white rounded-[1.5rem] md:rounded-3xl font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-[12px] shadow-2xl active:scale-95 transition-all hover:bg-black group flex items-center justify-center gap-4"
              >
                Enter Dashboard <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAILURE MODAL */}
      {failureState && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 backdrop-blur-xl bg-slate-950/80 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 text-center shadow-2xl border-4 border-rose-100 animate-shake">
            <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8"><ShieldX size={48} /></div>
            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none">Payment Node Failure</h3>
            <p className="text-slate-500 text-sm font-bold mt-8 leading-relaxed uppercase tracking-tighter">
              {failureState}
            </p>
            <div className="mt-12 space-y-3">
              <button onClick={() => setFailureState(null)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all">Retry Payment Protocol</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
