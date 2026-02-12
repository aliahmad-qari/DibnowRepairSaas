import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, BrainCircuit, TrendingUp, AlertTriangle, 
  Target, Zap, ChevronRight, Loader2, ShieldCheck,
  RefreshCcw, BarChart3, Activity, Info
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCurrency } from '../../context/CurrencyContext.tsx';

export const AIDailyInsights: React.FC = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [isGenerating, setIsGenerating] = useState(false);
  const [insightData, setInsightData] = useState<any>(null);

  // 1. DATA HARVESTING (READ-ONLY)
  const systemContext = useMemo(() => {
    const repairs = db.repairs.getAll();
    const sales = db.sales.getAll();
    const inventory = db.inventory.getAll();
    const wallet = db.wallet.getTransactions();
    const activity = db.activity.getAll();
    const complaints = db.complaints.getAll();

    const today = new Date().toLocaleDateString();
    
    // Aggregate Today's Performance
    const todaySales = sales.filter(s => s.date === today);
    const todayRepairs = repairs.filter(r => r.date === today);
    const todayComplaints = complaints.filter(c => c.date === today);

    return {
      metrics: {
        totalStockValue: inventory.reduce((a, b) => a + (b.price * b.stock), 0),
        lowStockItems: inventory.filter(i => i.stock < 5).map(i => i.name),
        todayRevenue: todaySales.reduce((a, b) => a + b.total, 0),
        pendingRepairs: repairs.filter(r => r.status === 'pending').length,
        walletBalance: user?.walletBalance || 0,
        activeComplaints: complaints.filter(c => c.status === 'pending').length,
        recentActivityCount: activity.length
      },
      inventoryOverview: inventory.slice(0, 10).map(i => `${i.name} (${i.stock} left)`),
      recentSales: todaySales.slice(0, 5).map(s => s.productName)
    };
  }, [user]);

  // 2. AI GENERATION LOGIC
  const generateInsights = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        As a Senior SaaS Business Architect, analyze this shop's real-time data nodes:
        - Current Revenue: ${currency.symbol}${systemContext.metrics.todayRevenue}
        - Stock Portfolio Value: ${currency.symbol}${systemContext.metrics.totalStockValue}
        - Pending Repairs: ${systemContext.metrics.pendingRepairs}
        - Low Stock Alerts: ${systemContext.metrics.lowStockItems.join(', ')}
        - Wallet Treasury: ${currency.symbol}${systemContext.metrics.walletBalance}
        - Unresolved Issues: ${systemContext.metrics.activeComplaints}

        Provide a strategic "Daily Action Intelligence" report in JSON format:
        {
          "summary": "One sentence summary of business health",
          "kpis": [
            {"label": "Insight Name", "value": "Metric", "status": "positive|neutral|critical"}
          ],
          "strategic_advice": [
            "Specific advice on inventory or repairs",
            "Specific advice on fiscal health"
          ],
          "risk_assessment": "Detection of bottlenecks or deficit nodes"
        }
        Strictly use JSON only. Output should be professional and technical.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setInsightData(JSON.parse(response.text || '{}'));
    } catch (error) {
      console.error("AI Insight Node Failure:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
        
        {/* Header Section */}
        <div className="p-8 md:p-12 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-indigo-100 relative group overflow-hidden">
                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                 <BrainCircuit size={32} className="relative z-10" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">AI Daily Shop Intelligence</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Autonomous Business Health Scrutiny Node</p>
              </div>
           </div>
           
           <button 
             onClick={generateInsights}
             disabled={isGenerating}
             className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
           >
              {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {isGenerating ? "Synthesizing Data..." : "Run Neural Analysis"}
           </button>
        </div>

        {/* Intelligence Content */}
        <div className="p-8 md:p-12">
          {!insightData && !isGenerating ? (
            <div className="py-20 flex flex-col items-center text-center space-y-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
               <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                  <Activity size={48} strokeWidth={1.5} />
               </div>
               <div className="space-y-2">
                 <p className="text-sm font-black uppercase tracking-widest text-slate-800">Intelligence Node Standby</p>
                 <p className="text-xs font-bold text-slate-400 max-w-sm mx-auto uppercase leading-relaxed">System is ready to analyze repairs, POS sales, and inventory nodes to generate your daily strategy.</p>
               </div>
            </div>
          ) : isGenerating ? (
            <div className="py-24 flex flex-col items-center gap-8 animate-pulse">
               <div className="flex gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Interrogating Global Platform Data...</p>
            </div>
          ) : (
            <div className="space-y-12 animate-in zoom-in-95 duration-500">
               
               {/* 1. Executive Summary */}
               <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2.5rem] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Info size={80} className="text-indigo-600" /></div>
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Executive Summary</h4>
                  <p className="text-xl font-black text-indigo-900 leading-tight uppercase italic relative z-10">"{insightData.summary}"</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  
                  {/* 2. KPI Insights */}
                  <div className="space-y-6">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <BarChart3 size={16} className="text-indigo-600" /> Statistical Inferences
                     </h4>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {insightData.kpis?.map((kpi: any, i: number) => (
                          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-2">
                             <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</span>
                                <div className={`w-2 h-2 rounded-full ${
                                  kpi.status === 'positive' ? 'bg-emerald-500' : 
                                  kpi.status === 'critical' ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                                }`} />
                             </div>
                             <p className="text-xl font-black text-slate-800 tracking-tighter uppercase">{kpi.value}</p>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* 3. Strategic Advice */}
                  <div className="space-y-6">
                     <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                        <Target size={16} className="text-indigo-600" /> Strategic Protocol
                     </h4>
                     <div className="space-y-3">
                        {insightData.strategic_advice?.map((advice: string, i: number) => (
                          <div key={i} className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-200 transition-all">
                             <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                                <Zap size={14} className="text-amber-500" />
                             </div>
                             <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tighter">{advice}</p>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* 4. Risk Forensic Assessment */}
               <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 group">
                  <div className="w-16 h-16 bg-rose-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-rose-200 shrink-0 group-hover:rotate-12 transition-transform">
                     <AlertTriangle size={28} />
                  </div>
                  <div className="flex-1">
                     <h4 className="text-[11px] font-black text-rose-900 uppercase tracking-[0.3em]">Forensic Risk Assessment</h4>
                     <p className="text-sm font-bold text-rose-700 mt-2 uppercase tracking-tighter leading-relaxed">
                        {insightData.risk_assessment}
                     </p>
                  </div>
                  <button className="px-8 py-3 bg-white text-rose-600 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                     Acknowledge Risk
                  </button>
               </div>

            </div>
          )}
        </div>
        
        {/* Verification Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-3">
           <ShieldCheck size={16} className="text-emerald-500" />
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Audit Trail Verified • DibAssistant Intelligence v4.0</span>
        </div>
      </div>
    </div>
  );
};
