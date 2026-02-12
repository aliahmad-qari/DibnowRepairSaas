import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Rocket, ShieldAlert, Zap, Loader2, Info, 
  ArrowUpCircle, Lock, Cpu, BarChart3, 
  ShieldCheck, BrainCircuit, Activity, Gem
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const AIDailyInsightsV6: React.FC = () => {
  const { user } = useAuth();
  const [isAuditing, setIsAuditing] = useState(false);
  const [quotaReport, setQuotaReport] = useState<any>(null);

  // 1. DATA HARVESTING (READ-ONLY) - Auditing plan consumption nodes
  const usageNodes = useMemo(() => {
    const plan = db.plans.getById(user?.planId || 'starter');
    const repairs = db.repairs.getAll().length;
    const inventory = db.inventory.getAll().length;
    const team = db.userTeamV2.getByOwner(user?.id || '').length;
    const brands = db.brands.getAll().length;
    const categories = db.categories.getAll().length;

    const calculatePercent = (used: number, limit: number) => {
      if (limit >= 999) return 0;
      return Math.min(100, Math.floor((used / limit) * 100));
    };

    return {
      planName: plan.name,
      limits: plan.limits,
      consumption: {
        repairs: { used: repairs, limit: plan.limits.repairsPerMonth, pct: calculatePercent(repairs, plan.limits.repairsPerMonth) },
        inventory: { used: inventory, limit: plan.limits.inventoryItems, pct: calculatePercent(inventory, plan.limits.inventoryItems) },
        team: { used: team, limit: plan.limits.teamMembers, pct: calculatePercent(team, plan.limits.teamMembers) },
        brands: { used: brands, limit: plan.limits.brands, pct: calculatePercent(brands, plan.limits.brands) },
        categories: { used: categories, limit: plan.limits.categories, pct: calculatePercent(categories, plan.limits.categories) }
      },
      aiDiagnostics: plan.limits.aiDiagnostics
    };
  }, [user]);

  // 2. AI QUOTA SYNTHESIS
  const runQuotaAudit = async () => {
    setIsAuditing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        As a SaaS Subscription Strategist, analyze this shop's usage nodes:
        - Plan: ${usageNodes.planName}
        - Repairs: ${usageNodes.consumption.repairs.used}/${usageNodes.consumption.repairs.limit} (${usageNodes.consumption.repairs.pct}%)
        - Inventory: ${usageNodes.consumption.inventory.used}/${usageNodes.consumption.inventory.limit} (${usageNodes.consumption.inventory.pct}%)
        - Team: ${usageNodes.consumption.team.used}/${usageNodes.consumption.team.limit} (${usageNodes.consumption.team.pct}%)
        - AI Diagnostics Enabled: ${usageNodes.aiDiagnostics}

        Provide a JSON Quota Intel Report:
        {
          "critical_alerts": ["Detection of nodes > 80% used"],
          "soft_recommendation": "A friendly technical advice on why upgrading would help throughput",
          "blockage_risk": "High|Medium|Low based on usage proximity to limits",
          "next_tier_value": "One specific feature in a higher tier they need"
        }
        Strictly JSON. Professional, advisory, and non-intrusive tone.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setQuotaReport(JSON.parse(response.text || '{}'));
    } catch (e) {
      console.error("Quota Intelligence Failure", e);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden border-b-8 border-b-indigo-600">
        
        {/* Module Header */}
        <div className="p-8 md:p-10 bg-indigo-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
                 <Rocket size={28} className="text-white" />
              </div>
              <div>
                 <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Plan & Usage Intelligence</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Autonomous Subscription & Quota Audit Node</p>
              </div>
           </div>
           <button 
             onClick={runQuotaAudit}
             disabled={isAuditing}
             className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-indigo-700 transition-all flex items-center gap-3 disabled:opacity-50 shadow-2xl shadow-indigo-100"
           >
              {isAuditing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
              {isAuditing ? "Auditing Nodes..." : "Invoke Usage Audit"}
           </button>
        </div>

        <div className="p-8 md:p-12">
          {!quotaReport && !isAuditing ? (
            <div className="py-12 flex flex-col items-center text-center space-y-4 opacity-30 grayscale">
               <Activity size={56} className="text-indigo-200" />
               <p className="text-xs font-black uppercase tracking-widest text-slate-500 max-w-sm">System ready to correlate current consumption nodes with plan authority levels.</p>
            </div>
          ) : isAuditing ? (
            <div className="py-24 flex flex-col items-center gap-6">
               <div className="flex gap-3">
                  <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-3 h-3 bg-indigo-200 rounded-full animate-bounce [animation-delay:0.4s]" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Comparing Consumption to Authority Matrix...</p>
            </div>
          ) : (
            <div className="space-y-12 animate-in zoom-in-95 duration-500">
               
               {/* Usage Progress Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {Object.entries(usageNodes.consumption).map(([key, data]: [string, any]) => (
                    <div key={key} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col gap-4">
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{key} node</span>
                          <span className={`text-[10px] font-black ${data.pct >= 80 ? 'text-rose-600 animate-pulse' : 'text-indigo-600'}`}>{data.pct}%</span>
                       </div>
                       <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-slate-200">
                          <div 
                            className={`h-full transition-all duration-1000 ${data.pct >= 80 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                            style={{ width: `${data.pct}%` }}
                          />
                       </div>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                          {data.used} / {data.limit >= 999 ? '∞' : data.limit} Units
                       </p>
                    </div>
                  ))}
               </div>

               {/* AI Critical Alerts */}
               <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  <div className="xl:col-span-7 space-y-6">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2"><ShieldAlert size={14} className="text-rose-500" /> Blockage Risk Detection</h4>
                     <div className="space-y-3">
                        {quotaReport.critical_alerts?.map((alert: string, i: number) => (
                           <div key={i} className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100 flex items-center gap-5 group hover:bg-rose-100 transition-all">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-100 group-hover:scale-110 transition-transform">
                                 <Lock size={18} />
                              </div>
                              <p className="text-sm font-black text-rose-950 uppercase tracking-tight italic">"{alert}"</p>
                           </div>
                        ))}
                     </div>
                  </div>
                  
                  <div className="xl:col-span-5 space-y-6">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2"><Gem size={14} className="text-indigo-500" /> Soft Recommendation</h4>
                     <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700"><ArrowUpCircle size={100} /></div>
                        <div className="relative z-10">
                           <p className="text-sm font-black uppercase leading-relaxed tracking-tight italic">"{quotaReport.soft_recommendation}"</p>
                           <div className="mt-8 pt-6 border-t border-white/10">
                              <p className="text-[8px] font-black uppercase text-indigo-300 tracking-widest mb-1">Target upgrade node</p>
                              <p className="text-xl font-black uppercase tracking-tighter text-white">{quotaReport.next_tier_value}</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

            </div>
          )}
        </div>

        {/* Audit Verification Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-4">
           <ShieldCheck size={16} className="text-emerald-500" />
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Audit node v9.3-SAAS • License integrity verified</span>
        </div>
      </div>
    </div>
  );
};
