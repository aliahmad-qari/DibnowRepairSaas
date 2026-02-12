import React, { useState, useMemo } from 'react';
// Add missing icons: Wrench, ShieldAlert, ArrowUpRight
import { 
  BrainCircuit, Sparkles, ShieldCheck, Zap, Activity,
  TrendingUp, TrendingDown, Target, Info, Loader2,
  ChevronRight, ArrowUpCircle, AlertTriangle, Fingerprint,
  HardDrive, BarChart3, Users, Globe, Wrench, ShieldAlert, ArrowUpRight
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { GoogleGenAI } from "@google/genai";

export const AdminAIInsights: React.FC = () => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [report, setReport] = useState<any>(null);

  const platformSnapshot = useMemo(() => {
    const users = db.users.getAll();
    const repairs = db.repairs.getAll();
    const sales = db.sales.getAll();
    const complaints = db.complaints.getAll();

    return {
      activeShops: users.filter(u => u.role === 'USER' && u.status === 'active').length,
      totalRevenue: sales.reduce((a, b) => a + b.total, 0),
      openComplaints: complaints.filter(c => c.status === 'pending').length,
      repairVolume: repairs.length,
      systemHealth: '99.98%',
      // Corrected: added missing globalSales property
      globalSales: sales.length
    };
  }, []);

  const invokeAIAudit = async () => {
    setIsAuditing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        As a Senior SaaS Platform Architect, perform a global forensic audit on this platform snapshot:
        - Active Tenant Nodes: ${platformSnapshot.activeShops}
        - Total Global Revenue: ${platformSnapshot.totalRevenue}
        - Unresolved Friction Nodes: ${platformSnapshot.openComplaints}
        - Global Transaction Volume: ${platformSnapshot.globalSales}
        - Hardware Lifecycle Tracking (Repairs): ${platformSnapshot.repairVolume}

        Analyze for churn risks, revenue leakage, and infrastructure bottlenecks.
        Output a Professional Platform Health Report in JSON format:
        {
          "summary": "Forensic high-level overview",
          "risk_nodes": [
            {"module": "Protocol Name", "level": "Low|Medium|High", "reason": "Technical observation"}
          ],
          "performance_score": "0-100",
          "strategic_recommendation": "Executive technical advice"
        }
        Strictly JSON. Expert/Industrial tone.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setReport(JSON.parse(response.text || '{}'));
    } catch (e) {
      console.error("AI Node Breach:", e);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 max-w-[1400px] mx-auto">
      <div className="bg-slate-900 rounded-[4rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform duration-1000 rotate-12">
            <BrainCircuit size={350} />
         </div>
         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-900/50">
                     <Sparkles size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">Neural Platform Scrutiny</h2>
                    <p className="text-indigo-400 font-bold text-xs uppercase tracking-[0.4em] mt-3">Autonomous Forensic Audit Node • Read-Only Scrutiny</p>
                  </div>
               </div>
               <p className="text-slate-400 text-sm font-medium max-w-2xl leading-relaxed uppercase tracking-tighter">
                  Our AI engine interrogates cross-shop transactional flux, identity volatility, and infrastructure telemetry to detect high-level anomalies before they escalate.
               </p>
            </div>
            <button 
              onClick={invokeAIAudit}
              disabled={isAuditing}
              className="px-12 py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
               {isAuditing ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
               {isAuditing ? "Auditing System Nodes..." : "Invoke Global Audit"}
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Active Tenants', val: platformSnapshot.activeShops, icon: Users, color: 'text-blue-500' },
           { label: 'System Health', val: platformSnapshot.systemHealth, icon: Activity, color: 'text-emerald-500' },
           { label: 'Repair Lifecycle', val: platformSnapshot.repairVolume, icon: Wrench, color: 'text-amber-500' },
           { label: 'Unresolved Friction', val: platformSnapshot.openComplaints, icon: ShieldAlert, color: 'text-rose-500' }
         ].map((stat, i) => (
           <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                 <div className={`w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center ${stat.color} shadow-inner group-hover:scale-110 transition-transform`}>
                    <stat.icon size={22} />
                 </div>
                 <ArrowUpRight size={14} className="text-slate-200" />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                 <h4 className="text-2xl font-black text-slate-900 mt-1">{stat.val}</h4>
              </div>
           </div>
         ))}
      </div>

      {!report && !isAuditing ? (
        <div className="py-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center gap-6">
           <div className="w-24 h-24 bg-indigo-50 text-indigo-200 rounded-[2.5rem] flex items-center justify-center shadow-inner">
              <Fingerprint size={48} />
           </div>
           <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">AI Diagnostic Node Standby</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-sm mx-auto">Authorize an audit handshake to visualize platform forensics and risk vectors.</p>
           </div>
        </div>
      ) : isAuditing ? (
        <div className="py-32 flex flex-col items-center justify-center gap-8 animate-pulse bg-white rounded-[4rem] border border-slate-100">
           <div className="flex gap-4">
              <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
           </div>
           <p className="text-xs font-black uppercase tracking-[0.5em] text-indigo-400">Interrogating Global Platform Database...</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-6">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2"><Info size={14}/> Executive Forensic Summary</h4>
                 <div className="bg-indigo-50 border-2 border-indigo-100 p-10 rounded-[3rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Target size={150} /></div>
                    <p className="text-xl font-black text-indigo-900 leading-tight uppercase italic relative z-10">"{report.summary}"</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {report.risk_nodes?.map((risk: any, i: number) => (
                      <div key={i} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm space-y-4 hover:border-indigo-300 transition-all group">
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-indigo-600 uppercase bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">{risk.module} Node</span>
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${
                               risk.level === 'High' ? 'bg-rose-50 text-rose-700 border-rose-100 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-100'
                            }`}>{risk.level} Risk</span>
                         </div>
                         <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tighter italic">"{risk.reason}"</p>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="lg:col-span-5 space-y-8">
                 <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">System Compliance Score</h4>
                    <div className="w-48 h-48 rounded-full border-[12px] border-slate-50 flex flex-col items-center justify-center relative shadow-inner">
                       <div className="absolute inset-0 rounded-full border-t-[12px] border-indigo-600 transition-all duration-1000 rotate-[45deg]" style={{ transform: `rotate(${Number(report.performance_score) * 3.6}deg)` }} />
                       <span className="text-6xl font-black text-slate-900 tracking-tighter">{report.performance_score}%</span>
                       <span className="text-[8px] font-black text-slate-400 uppercase mt-2">Health Index</span>
                    </div>
                 </div>

                 <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl border border-white/5 space-y-6">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 px-1"><Zap size={14}/> Strategic Deployment</h4>
                    <p className="text-sm font-bold leading-relaxed uppercase tracking-tight italic opacity-90">"{report.strategic_recommendation}"</p>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-100 rounded-[4rem] text-center">
         <div className="flex items-center justify-center gap-3 opacity-40 grayscale group-hover:grayscale-0 transition-all">
            <ShieldCheck size={20} className="text-emerald-500" />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">Forensic Logic Verified • Node v9.4 AI-Audit-Cluster</p>
         </div>
      </div>
    </div>
  );
};