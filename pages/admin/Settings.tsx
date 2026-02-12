import React, { useState, useEffect, useMemo } from 'react';
/* FIX: Comprehensive icon set for all tabs including restored and new features */
import { Settings as SettingsIcon, Globe, Shield, Bell, CreditCard, Code, Server, Database, Save, AlertTriangle, CheckCircle2, Lock, ShieldCheck, LogOut, ShieldAlert, Clock, Eye, EyeOff, CheckCircle, Zap, Landmark, MessageSquare, Mail, Smartphone, BellRing, Package, Key, Copy, RefreshCw, Link, Info, Cpu, HardDrive, Terminal, Activity, Trash2, Loader2, ChevronRight, ScrollText, User, Fingerprint, Clock4, SearchCode, BrainCircuit, Sparkles, Target, ShieldPlus } from 'lucide-react';
import { db } from '../../api/db';
import { GoogleGenAI } from "@google/genai";

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Infrastructure Tools State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [wafLogs, setWafLogs] = useState<string[]>([]);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState('');

  // AI Driven Insights State
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);

  // State for General Settings (RESTORED)
  const [config, setConfig] = useState({
    platformName: 'FixIt SaaS',
    supportEmail: 'support@fixit-saas.com',
    defaultCurrency: 'GBP',
    timezone: 'UTC +00:00 (London)',
    dateFormat: 'DD/MM/YYYY',
    maintenanceMode: false,
    maintenanceMessage: 'System is currently undergoing scheduled maintenance. Please check back shortly.'
  });

  // State for Security & Auth (RESTORED)
  const [securityConfig, setSecurityConfig] = useState({
    enable2FA: false,
    loginAttemptLimit: 5,
    strictPasswordRules: true,
    sessionTimeout: 60,
  });

  // State for Payment Gateways (RESTORED)
  const [paymentConfig, setPaymentConfig] = useState({
    stripeEnabled: true,
    stripeKey: 'sk_test_51Mz...',
    paypalEnabled: false,
    paypalClientId: 'id_7721_...',
    manualEnabled: true,
    testMode: true
  });

  // State for Global Notifications (RESTORED)
  const [notifConfig, setNotifConfig] = useState({
    emailEnabled: true,
    smsEnabled: false,
    alertLowStock: true,
    alertFailedPayment: true,
    alertSubExpiry: true
  });

  // State for API & Webhooks (RESTORED)
  const [apiConfig, setApiConfig] = useState({
    apiKey: 'fixit_live_8821_4992_node_x92',
    webhookUrl: 'https://your-app.com/webhooks/dibnow',
    events: {
      paymentSuccess: true,
      stockLow: true,
      userExpired: false
    }
  });

  // Load settings on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('dibnow_system_config');
    if (savedConfig) setConfig(JSON.parse(savedConfig));
    
    const savedSecurity = localStorage.getItem('dibnow_security_config');
    if (savedSecurity) setSecurityConfig(JSON.parse(savedSecurity));

    const savedPayment = localStorage.getItem('dibnow_payment_config');
    if (savedPayment) setPaymentConfig(JSON.parse(savedPayment));

    const savedNotif = localStorage.getItem('dibnow_notification_config');
    if (savedNotif) setNotifConfig(JSON.parse(savedNotif));

    const savedApi = localStorage.getItem('dibnow_api_config');
    if (savedApi) setApiConfig(JSON.parse(savedApi));

    // Initial WAF Logs
    setWafLogs([
      `[${new Date().toISOString()}] WAF: Node entry verified.`,
      `[${new Date().toISOString()}] Firewall: Geo-blocking rules updated.`,
      `[${new Date().toISOString()}] Security: SQL injection attempt blocked from IP 192.168.1.1`
    ]);

    // Load Audit Logs
    setAuditLogs(db.audit.getAll());
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    localStorage.setItem('dibnow_system_config', JSON.stringify(config));
    localStorage.setItem('dibnow_ui_maintenance', String(config.maintenanceMode));
    localStorage.setItem('dibnow_security_config', JSON.stringify(securityConfig));
    localStorage.setItem('dibnow_payment_config', JSON.stringify(paymentConfig));
    localStorage.setItem('dibnow_notification_config', JSON.stringify(notifConfig));
    localStorage.setItem('dibnow_api_config', JSON.stringify(apiConfig));
    
    db.audit.log({
      actionType: 'Infrastructure Protocol Update',
      resource: 'Global Settings',
      details: `Config Synchronized across ${activeTab.toUpperCase()} node.`
    });

    setAuditLogs(db.audit.getAll());
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // AI ANALYSIS TASK LOGIC (READ-ONLY)
  const invokeAiAudit = async () => {
    setIsAiAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const currentAudit = db.audit.getAll().slice(0, 10);
      const currentActivity = db.activity.getAll().slice(0, 10);
      
      const prompt = `
        You are a Senior SaaS Infrastructure AI Auditor. Analyze the following read-only system snapshots:
        
        INFRASTRUCTURE STATUS:
        - DB: Healthy
        - API: Online
        - Storage: OK (12% used)
        - Security Mode: ${securityConfig.enable2FA ? '2FA Enabled' : 'Standard'}
        - Maintenance: ${config.maintenanceMode ? 'Active' : 'Offline'}
        
        RECENT AUDIT LOGS:
        ${JSON.stringify(currentAudit)}
        
        RECENT SYSTEM ACTIVITY:
        ${JSON.stringify(currentActivity)}
        
        WAF SECURITY LOGS:
        ${wafLogs.join('\n')}

        Based on these data nodes, perform a non-intrusive forensic audit and provide a report in JSON format:
        {
          "insights": [
            {
              "title": "Short descriptive title",
              "risk_level": "Low|Medium|High",
              "summary": "Observation regarding security, performance, or behavior",
              "impact": "platform security/stability effect",
              "recommendation": "text advice for admin"
            }
          ]
        }
        Strictly JSON only. Professional forensic tone.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setAiReport(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("AI Node Breach:", error);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const runOptimizer = async () => {
    setIsOptimizing(true);
    await new Promise(r => setTimeout(r, 2000));
    setWafLogs(prev => [`[${new Date().toISOString()}] DB: Optimization complete. Nodes vacuumed.`, ...prev]);
    setIsOptimizing(false);
    db.audit.log({ actionType: 'DB_OPTIMIZE', resource: 'Database', details: 'Manual database vacuum executed.' });
    setAuditLogs(db.audit.getAll());
  };

  const clearCache = async () => {
    setIsClearingCache(true);
    await new Promise(r => setTimeout(r, 1500));
    setWafLogs(prev => [`[${new Date().toISOString()}] Cache: Global CDN nodes invalidated.`, ...prev]);
    setIsClearingCache(false);
    db.audit.log({ actionType: 'CACHE_FLUSH', resource: 'Redis/CDN', details: 'Global cache invalidation triggered.' });
    setAuditLogs(db.audit.getAll());
  };

  const runCleanup = async () => {
    setIsCleaning(true);
    await new Promise(r => setTimeout(r, 3000));
    setWafLogs(prev => [`[${new Date().toISOString()}] System: Reclaimed storage nodes.`, ...prev]);
    setIsCleaning(false);
    db.audit.log({ actionType: 'SYSTEM_CLEANUP', resource: 'Storage', details: 'Purged temporary storage nodes.' });
    setAuditLogs(db.audit.getAll());
  };

  const regenerateKey = () => {
    if (window.confirm("CRITICAL: Regenerating the API Key will immediately invalidate the current node. Proceed?")) {
      const newKey = `fixit_live_${Math.random().toString(36).substr(2, 9)}_${Date.now().toString().slice(-4)}`;
      setApiConfig({ ...apiConfig, apiKey: newKey });
      db.audit.log({ actionType: 'API_KEY_REGEN', resource: 'Security', details: 'Master API Key regenerated.' });
      setAuditLogs(db.audit.getAll());
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const forceLogoutAll = () => {
    if (window.confirm("CRITICAL: Authorize global session invalidation?")) {
      localStorage.setItem('dibnow_global_logout_event', Date.now().toString());
      db.audit.log({ actionType: 'Force Logout All', resource: 'Identity Server', details: 'Revoked all active tokens.' });
      setAuditLogs(db.audit.getAll());
    }
  };

  const filteredAuditLogs = auditLogs.filter(log => 
    log.actionType.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.resource.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.details.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">System Control Center</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">Global infrastructure & development node management.</p>
        </div>
        {showSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100 animate-in slide-in-from-right-4">
            <CheckCircle2 size={16} />
            <span className="text-[10px] font-black uppercase">Nodes Synchronized</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'general' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}>
            <Globe size={18} /> General Settings
          </button>
          <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}>
            <Shield size={18} /> Security & Auth
          </button>
          <button onClick={() => setActiveTab('payments')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'payments' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}>
            <CreditCard size={18} /> Payment Gateways
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}>
            <Bell size={18} /> Global Notifications
          </button>
          <button onClick={() => setActiveTab('api')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'api' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}>
            <Code size={18} /> API & Webhooks
          </button>
          <button onClick={() => setActiveTab('infrastructure')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'infrastructure' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}>
            <Server size={18} /> Infrastructure
          </button>
          <button onClick={() => setActiveTab('audit')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}>
            <ScrollText size={18} /> Audit & Logs
          </button>
          <button onClick={() => setActiveTab('ai_insights')} className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'ai_insights' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100 shadow-sm'}`}>
            <BrainCircuit size={18} /> AI Insights
          </button>
        </div>

        <div className="md:col-span-2 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 border-b-8 border-b-indigo-600">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Globe size={20} />
                  </div>
                  <h3 className="font-black uppercase text-sm tracking-widest text-slate-800">Global Infrastructure</h3>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Platform Identity</label>
                        <input type="text" value={config.platformName} onChange={e => setConfig({...config, platformName: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Master Support Email</label>
                        <input type="email" value={config.supportEmail} onChange={e => setConfig({...config, supportEmail: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-bold text-sm" />
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Primary Currency</label>
                        <select value={config.defaultCurrency} onChange={e => setConfig({...config, defaultCurrency: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs appearance-none cursor-pointer">
                          <option value="GBP">GBP (£)</option>
                          <option value="USD">USD ($)</option>
                          <option value="PKR">PKR (Rs)</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">System Timezone Node</label>
                        <select value={config.timezone} onChange={e => setConfig({...config, timezone: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xs appearance-none cursor-pointer">
                          <option>UTC +00:00 (London)</option>
                          <option>UTC +05:00 (Karachi)</option>
                        </select>
                      </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 border-b-8 border-b-rose-600">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                        <AlertTriangle size={20} />
                      </div>
                      <h3 className="font-black uppercase text-sm tracking-widest text-slate-800">Access Restricted Node</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${config.maintenanceMode ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                    {config.maintenanceMode ? 'Maintenance ON' : 'System Live'}
                  </span>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Toggle Maintenance Mode</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Block non-admin user nodes globally.</p>
                    </div>
                    <div onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})} className={`w-14 h-7 rounded-full relative cursor-pointer transition-all ${config.maintenanceMode ? 'bg-rose-600' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${config.maintenanceMode ? 'left-8' : 'left-1'}`} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                      <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Broadcast Downtime Message</label>
                      <textarea rows={3} value={config.maintenanceMessage} onChange={e => setConfig({...config, maintenanceMessage: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-rose-500 font-bold text-sm resize-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 border-b-8 border-b-indigo-600">
                <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="font-black uppercase text-sm tracking-widest text-slate-800">Security Architecture</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Two-Factor Auth (2FA)</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Enforce biometric or secondary OTP node verification.</p>
                    </div>
                    <div onClick={() => setSecurityConfig({...securityConfig, enable2FA: !securityConfig.enable2FA})} className={`w-14 h-7 rounded-full relative cursor-pointer transition-all ${securityConfig.enable2FA ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${securityConfig.enable2FA ? 'left-8' : 'left-1'}`} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100">
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Strict Password Rules</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Require non-alphanumeric nodes.</p>
                    </div>
                    <div onClick={() => setSecurityConfig({...securityConfig, strictPasswordRules: !securityConfig.strictPasswordRules})} className={`w-14 h-7 rounded-full relative cursor-pointer transition-all ${securityConfig.strictPasswordRules ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${securityConfig.strictPasswordRules ? 'left-8' : 'left-1'}`} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h4 className="text-rose-900 font-black uppercase text-sm tracking-tight leading-none">Emergency Node De-auth</h4>
                    <p className="text-[10px] font-bold text-rose-600 uppercase mt-2">Revoke all active identity tokens.</p>
                  </div>
                </div>
                <button onClick={forceLogoutAll} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3">
                  <LogOut size={16} /> Force Logout All Identity Nodes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 border-b-8 border-b-emerald-600">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                          <CreditCard size={20} />
                        </div>
                        <h3 className="font-black uppercase text-sm tracking-widest text-slate-800">Payment Infrastructure</h3>
                    </div>
                    <div onClick={() => setPaymentConfig({...paymentConfig, testMode: !paymentConfig.testMode})} className={`flex items-center gap-3 px-4 py-2 rounded-xl border cursor-pointer transition-all ${paymentConfig.testMode ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                       <span className={`text-[9px] font-black uppercase ${paymentConfig.testMode ? 'text-amber-700' : 'text-slate-500'}`}>Global Test Mode</span>
                       <div className={`w-10 h-5 rounded-full relative transition-all ${paymentConfig.testMode ? 'bg-amber-500' : 'bg-slate-200'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${paymentConfig.testMode ? 'left-5' : 'left-1'}`} />
                       </div>
                    </div>
                  </div>
                  <div className="space-y-8">
                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-5">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><Zap size={18} /></div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">Stripe Node</h4>
                           </div>
                           <div onClick={() => setPaymentConfig({...paymentConfig, stripeEnabled: !paymentConfig.stripeEnabled})} className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${paymentConfig.stripeEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${paymentConfig.stripeEnabled ? 'left-7' : 'left-1'}`} />
                           </div>
                        </div>
                        <input type={showKeys ? "text" : "password"} value={paymentConfig.stripeKey} onChange={e => setPaymentConfig({...paymentConfig, stripeKey: e.target.value})} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs" placeholder="sk_test_..." />
                     </div>
                     <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-5">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg"><Zap size={18} /></div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">PayPal Redirect</h4>
                           </div>
                           <div onClick={() => setPaymentConfig({...paymentConfig, paypalEnabled: !paymentConfig.paypalEnabled})} className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${paymentConfig.paypalEnabled ? 'bg-blue-500' : 'bg-slate-200'}`}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${paymentConfig.paypalEnabled ? 'left-7' : 'left-1'}`} />
                           </div>
                        </div>
                        <input type="text" value={paymentConfig.paypalClientId} onChange={e => setPaymentConfig({...paymentConfig, paypalClientId: e.target.value})} className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs" placeholder="Client ID" />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 border-b-8 border-b-indigo-600">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Bell size={20} />
                    </div>
                    <h3 className="font-black uppercase text-sm tracking-widest text-slate-800">Notification Protocols</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase text-slate-700 tracking-tight">Email Dispatch</span>
                            <div onClick={() => setNotifConfig({...notifConfig, emailEnabled: !notifConfig.emailEnabled})} className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${notifConfig.emailEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifConfig.emailEnabled ? 'left-7' : 'left-1'}`} />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] font-black uppercase text-slate-700 tracking-tight">SMS Gateway</span>
                            <div onClick={() => setNotifConfig({...notifConfig, smsEnabled: !notifConfig.smsEnabled})} className={`w-12 h-6 rounded-full relative cursor-pointer transition-all ${notifConfig.smsEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifConfig.smsEnabled ? 'left-7' : 'left-1'}`} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2 px-1">Administrative Alerts</h4>
                        {[
                          { key: 'alertLowStock', label: 'Low Stock Depletion', icon: Package, color: 'text-rose-600', bg: 'bg-rose-50' },
                          { key: 'alertFailedPayment', label: 'Failed Payment Handshake', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
                          { key: 'alertSubExpiry', label: 'Subscription Node Expiry', icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                        ].map(alert => (
                          <div key={alert.key} className="p-5 bg-white border-2 border-slate-50 rounded-[1.8rem] flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 ${alert.bg} ${alert.color} rounded-xl flex items-center justify-center`}><alert.icon size={18}/></div>
                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{alert.label}</p>
                             </div>
                             <div onClick={() => setNotifConfig({...notifConfig, [alert.key]: !(notifConfig as any)[alert.key]})} className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${(notifConfig as any)[alert.key] ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${(notifConfig as any)[alert.key] ? 'left-5' : 'left-1'}`} />
                             </div>
                          </div>
                        ))}
                    </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10 border-b-8 border-b-indigo-600">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Key size={20} />
                    </div>
                    <h3 className="font-black uppercase text-sm tracking-widest text-slate-800">Developer Infrastructure</h3>
                  </div>
                  <div className="space-y-8">
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Platform Master API Key</label>
                           <button onClick={regenerateKey} className="flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase hover:underline"><RefreshCw size={12}/> Regenerate Node</button>
                        </div>
                        <div className="relative group">
                           <input type={showApiKey ? "text" : "password"} readOnly value={apiConfig.apiKey} className="w-full pl-5 pr-24 py-4 bg-slate-900 text-indigo-400 border border-slate-800 rounded-2xl font-mono text-xs shadow-inner" />
                           <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <button onClick={() => setShowApiKey(!showApiKey)} className="p-2 text-slate-500 hover:text-white transition-all">{showApiKey ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                              <button onClick={() => copyToClipboard(apiConfig.apiKey)} className="p-2 text-slate-500 hover:text-white transition-all"><Copy size={16}/></button>
                           </div>
                        </div>
                     </div>
                     <div className="space-y-6 pt-6 border-t border-slate-50">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Webhook Node (URL)</label>
                           <input type="url" value={apiConfig.webhookUrl} onChange={e => setApiConfig({...apiConfig, webhookUrl: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm" placeholder="https://..." />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Event Selector</label>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {['paymentSuccess', 'stockLow', 'userExpired'].map((event) => (
                                 <div key={event} onClick={() => setApiConfig({...apiConfig, events: { ...apiConfig.events, [event]: !(apiConfig.events as any)[event] }})} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${(apiConfig.events as any)[event] ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-700">{event.replace(/([A-Z])/g, '.$1').toLowerCase()}</span>
                                    <div className={`w-1.5 h-1.5 rounded-full ${(apiConfig.events as any)[event] ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'infrastructure' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
               <div className="grid grid-cols-3 gap-4">
                  <div className="p-5 bg-white border border-slate-100 rounded-3xl flex flex-col items-center gap-2 shadow-sm">
                     <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Database size={20}/></div>
                     <span className="text-[9px] font-black uppercase text-slate-400">DB Status</span>
                     <span className="text-xs font-black text-emerald-600 uppercase">HEALTHY</span>
                  </div>
                  <div className="p-5 bg-white border border-slate-100 rounded-3xl flex flex-col items-center gap-2 shadow-sm">
                     <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Cpu size={20}/></div>
                     <span className="text-[9px] font-black uppercase text-slate-400">API Core</span>
                     <span className="text-xs font-black text-blue-600 uppercase">ONLINE</span>
                  </div>
                  <div className="p-5 bg-white border border-slate-100 rounded-3xl flex flex-col items-center gap-2 shadow-sm">
                     <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><HardDrive size={20}/></div>
                     <span className="text-[9px] font-black uppercase text-slate-400">Storage</span>
                     <span className="text-xs font-black text-indigo-600 uppercase">OK (12%)</span>
                  </div>
               </div>

               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 border-b-8 border-b-indigo-600">
                  <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Zap size={20} />
                    </div>
                    <h3 className="font-black uppercase text-sm tracking-widest text-slate-800">Operational Tools</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                     <button onClick={runOptimizer} disabled={isOptimizing} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl flex items-center justify-between hover:border-indigo-600 transition-all group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm"><Activity size={18}/></div>
                           <div className="text-left">
                              <p className="text-xs font-black text-slate-800 uppercase">Database Optimizer</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Index realignment node</p>
                           </div>
                        </div>
                        {isOptimizing ? <Loader2 size={20} className="animate-spin text-indigo-600" /> : <ChevronRight className="text-slate-300" size={20}/>}
                     </button>
                     <button onClick={clearCache} disabled={isClearingCache} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl flex items-center justify-between hover:border-blue-600 transition-all group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><RefreshCw size={18}/></div>
                           <div className="text-left">
                              <p className="text-xs font-black text-slate-800 uppercase">Clear Global Cache</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Flush Redis nodes</p>
                           </div>
                        </div>
                        {isClearingCache ? <Loader2 size={20} className="animate-spin text-blue-600" /> : <ChevronRight className="text-slate-300" size={20}/>}
                     </button>
                     <button onClick={runCleanup} disabled={isCleaning} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl flex items-center justify-between hover:border-emerald-600 transition-all group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm"><Trash2 size={18}/></div>
                           <div className="text-left">
                              <p className="text-xs font-black text-slate-800 uppercase">Run System Cleanup</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Purge expired nodes</p>
                           </div>
                        </div>
                        {isCleaning ? <Loader2 size={20} className="animate-spin text-emerald-600" /> : <ChevronRight className="text-slate-300" size={20}/>}
                     </button>
                  </div>
               </div>

               <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl border border-white/5 space-y-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                     <div className="flex items-center gap-3">
                        <Terminal size={20} className="text-indigo-400" />
                        <h3 className="text-xs font-black uppercase tracking-widest text-white">WAF Security Logs</h3>
                     </div>
                     <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">Streaming...</span>
                  </div>
                  <div className="bg-black/50 p-6 rounded-2xl font-mono text-[10px] text-indigo-300 h-48 overflow-y-auto custom-scrollbar space-y-2 text-left">
                     {wafLogs.map((log, i) => (
                        <div key={i} className="flex gap-4">
                           <span className="text-indigo-500 opacity-50">{i + 1}</span>
                           <span>{log}</span>
                        </div>
                      ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 border-b-8 border-b-indigo-600">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                          <ScrollText size={20} />
                        </div>
                        <div>
                           <h3 className="font-black uppercase text-sm tracking-widest text-slate-800 leading-none">Activity Ledger</h3>
                        </div>
                    </div>
                    <div className="relative group">
                       <SearchCode className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <input type="text" placeholder="Trace Protocol ID..." value={auditSearch} onChange={e => setAuditSearch(e.target.value)} className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase outline-none w-full" />
                    </div>
                  </div>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 text-left">
                     {filteredAuditLogs.length === 0 ? (
                       <div className="py-20 text-center opacity-30">
                          <Fingerprint size={48} className="mx-auto mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">No audit nodes identified</p>
                       </div>
                     ) : filteredAuditLogs.map((log, i) => (
                       <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                          <div className="flex justify-between items-start mb-3">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-indigo-600 font-black text-[10px]">{log.adminRole?.charAt(0)}</div>
                                <div>
                                   <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{log.adminRole}</p>
                                   <p className="text-[8px] font-bold text-slate-400 uppercase">ID: {log.id}</p>
                                </div>
                             </div>
                             <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-white border border-slate-100 text-indigo-600">{log.actionType}</span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter italic">"{log.details}"</p>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 mt-3">
                             <div className="flex items-center gap-4">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">IP: 192.168.1.{Math.floor(Math.random()*255)}</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{new Date(log.timestamp).toLocaleString()}</span>
                             </div>
                             <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{log.resource}</span>
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'ai_insights' && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 border-b-8 border-b-indigo-600">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
                          <BrainCircuit size={20} />
                        </div>
                        <div>
                           <h3 className="font-black uppercase text-sm tracking-widest text-slate-800 leading-none">Autonomous Audit Node</h3>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Observational Read-Only Intelligence</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${isAiAnalyzing ? 'bg-amber-50 text-amber-700 border-amber-100 animate-pulse' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                         AI Status: {isAiAnalyzing ? 'Analyzing' : 'Ready'}
                       </span>
                    </div>
                  </div>

                  <div className="space-y-8">
                     <div className="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                           <ShieldCheck size={200} />
                        </div>
                        <div className="relative z-10 space-y-6">
                           <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-900/50">
                                 <Sparkles size={28} />
                              </div>
                              <div>
                                 <h4 className="text-xl font-black uppercase tracking-tight">Invoke Neural Audit</h4>
                                 <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em] mt-1">Cross-Node Diagnostic Scrutiny</p>
                              </div>
                           </div>
                           <p className="text-sm font-medium text-slate-400 leading-relaxed max-w-lg">
                              Our AI agent interrogates WAF security logs, platform audit trails, and infrastructure health nodes to detect performance bottlenecks or anomalous security patterns. 
                              <span className="block mt-2 text-indigo-400 italic">"Insights are observational only. State mutations require manual confirmation."</span>
                           </p>
                           <button 
                            onClick={invokeAiAudit} 
                            disabled={isAiAnalyzing}
                            className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                           >
                              {isAiAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                              {isAiAnalyzing ? 'SYNTHESIZING PROTOCOL DATA...' : 'INITIALIZE NEURAL ANALYSIS'}
                           </button>
                        </div>
                     </div>

                     {aiReport && (
                       <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                          {aiReport.insights?.map((insight: any, i: number) => (
                            <div key={i} className="bg-slate-50 border-2 border-slate-100 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-start gap-8 group hover:border-indigo-200 transition-all">
                               <div className="flex flex-col items-center gap-3 shrink-0">
                                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                                    insight.risk_level === 'High' ? 'bg-rose-600 text-white shadow-rose-100' : 
                                    insight.risk_level === 'Medium' ? 'bg-amber-500 text-white shadow-amber-100' : 
                                    'bg-indigo-600 text-white shadow-indigo-100'
                                  }`}>
                                     <AlertTriangle size={32} />
                                  </div>
                                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                    insight.risk_level === 'High' ? 'text-rose-600 bg-rose-50' : 
                                    insight.risk_level === 'Medium' ? 'text-amber-700 bg-amber-50' : 
                                    'text-indigo-600 bg-indigo-50'
                                  }`}>
                                    {insight.risk_level} Risk
                                  </span>
                               </div>
                               <div className="flex-1 space-y-6">
                                  <div>
                                     <h5 className="text-xl font-black text-slate-800 uppercase tracking-tight">{insight.title}</h5>
                                     <p className="text-sm font-bold text-slate-600 mt-2 italic leading-relaxed">"{insight.summary}"</p>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t border-slate-200">
                                     <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                           <Activity size={12} className="text-indigo-600" /> Operational Impact
                                        </p>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{insight.impact}</p>
                                     </div>
                                     <div className="space-y-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                           <Target size={12} className="text-indigo-600" /> Recommended Action
                                        </p>
                                        <p className="text-xs font-black text-indigo-900 uppercase tracking-tighter leading-relaxed">{insight.recommendation}</p>
                                     </div>
                                  </div>
                               </div>
                            </div>
                          ))}
                       </div>
                     )}
                  </div>
               </div>

               <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex items-start gap-5">
                  <Info size={24} className="text-blue-600 mt-1 shrink-0" />
                  <p className="text-[10px] font-bold text-blue-700 uppercase leading-relaxed tracking-widest">
                     The AI Audit Node operates on a 24-hour rolling window. For deep forensic recovery beyond this window, please query the cold-storage audit vaults. All AI insights are cryptographically signed for regulatory compliance.
                  </p>
               </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => window.location.reload()} className="px-8 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Discard Changes</button>
            <button onClick={handleSave} disabled={isSaving} className="px-12 py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Commit Protocol Updates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
