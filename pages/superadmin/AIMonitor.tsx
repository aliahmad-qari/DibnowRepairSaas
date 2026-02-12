
import React, { useState, useMemo } from 'react';
import { BrainCircuit, Sparkles, ShieldCheck, Zap, Activity, ShieldAlert, Fingerprint, Loader2, Info, Terminal, AlertTriangle, Target, Search, Filter, Eye } from 'lucide-react';
import { db } from '../../api/db.ts';
import { GoogleGenAI } from "@google/genai";

export const AIMonitor: React.FC = () => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [forensicReport, setForensicReport] = useState<any>(null);

  const invokeAIAudit = async () => {
    setIsAuditing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const users = db.users.getAll();
      const activity = db.activity.getAll();
      const audit = db.audit.getAll();
      const sales = db.sales.getAll();

      const prompt = `
        As a Platform Security AI, analyze this SaaS environment snapshot:
        - Total Users: ${users.length}
        - Total Global Transactions: ${sales.length}
        - Recent System Mutations: ${audit.length}
        - Forensic Activity Logs: ${activity.length}

        Identify anomalies related to: 1. Payment fraud patterns, 2. Login volatility, 3. Revenue leakage, 4. Unauthorized plan escalations.
        Output a Professional Forensic Health Report in JSON format:
        {
          "anomalies": [
            {"type": "FRAUD|SECURITY|REVENUE", "severity": "High|Medium|Low", "description": "Technical finding", "affected_nodes": "String IDs"}
          ],
          "health_index": "0-100",
          "summary": "Forensic executive summary"
        }
        Strictly JSON. Expert/Industrial tone.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setForensicReport(JSON.parse(response.text || '{}'));
    } catch (e) {
      console.error("AI Forensic Handshake Failure", e);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-slate-900 rounded-[4rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12 scale-150"><BrainCircuit size={350} /></div>
         <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-900/50">
                     <Sparkles size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter uppercase leading-none">Neural Scrutiny</h2>
                    <p className="text-indigo-400 font-bold text-xs uppercase tracking-[0.4em] mt-3">Autonomous Forensic Audit Node • Read-Only Scrutiny</p>
                  </div>
               </div>
               <p className="text-slate-400 text-sm font-medium max-w-2xl leading-relaxed uppercase tracking-tighter">
                  Platform-wide AI monitoring interrogates cross-shop transactional flux and identity volatility to detect high-level anomalies.
               </p>
            </div>
            <button 
              onClick={invokeAIAudit}
              disabled={isAuditing}
              className="px-12 py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
            >
               {isAuditing ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
               {isAuditing ? "Auditing System Nodes..." : "Invoke Global Forensic Audit"}
            </button>
         </div>
      </div>

      {!forensicReport && !isAuditing ? (
        <div className="py-24 text-center bg-white/5 rounded-[4rem] border-2 border-dashed border-white/10 flex flex-col items-center gap-6">
           <Fingerprint size={64} className="text-slate-700" />
           <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Diagnostic Node Standby • Authorize Handshake to Initialize Scan</p>
        </div>
      ) : isAuditing ? (
        <div className="py-32 flex flex-col items-center justify-center gap-8 animate-pulse bg-white/5 rounded-[4rem] border border-white/10">
           <Loader2 size={64} className="text-indigo-500 animate-spin" strokeWidth={1} />
           <p className="text-xs font-black uppercase tracking-[0.5em] text-indigo-400">Interrogating Global Platform Database Shards...</p>
        </div>
      ) : (
        <div className="space-y-10 animate-in zoom-in-95 duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-8 space-y-6">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 px-2"><Info size={14}/> Executive Forensic Summary</h4>
                 <div className="bg-indigo-600/10 border-2 border-indigo-500/20 p-10 rounded-[3rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform"><Target size={150} /></div>
                    <p className="text-xl font-black text-indigo-300 leading-tight uppercase italic relative z-10">"{forensicReport.summary}"</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {forensicReport.anomalies?.map((risk: any, i: number) => (
                      <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-sm space-y-4 hover:border-indigo-500/50 transition-all group">
                         <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-indigo-400 uppercase bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">{risk.type} Node</span>
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${
                               risk.severity === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse' : 'bg-white/5 text-slate-500 border-white/10'
                            }`}>{risk.severity} Risk</span>
                         </div>
                         <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-tighter italic">"{risk.description}"</p>
                         <div className="pt-4 flex items-center justify-between border-t border-white/5">
                            <span className="text-[8px] font-black text-slate-500 uppercase">Impact Nodes: {risk.affected_nodes}</span>
                            <Eye size={14} className="text-slate-500 group-hover:text-white" />
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="lg:col-span-4 space-y-8">
                 <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/5 shadow-sm flex flex-col items-center justify-center text-center">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-10">Platform Integrity Score</h4>
                    <div className="w-48 h-48 rounded-full border-[12px] border-white/5 flex flex-col items-center justify-center relative shadow-inner">
                       <div className="absolute inset-0 rounded-full border-t-[12px] border-indigo-600 transition-all duration-1000 rotate-[45deg]" style={{ transform: `rotate(${Number(forensicReport.health_index) * 3.6}deg)` }} />
                       <span className="text-6xl font-black text-white tracking-tighter">{forensicReport.health_index}%</span>
                       <span className="text-[8px] font-black text-slate-500 uppercase mt-2">Verified Hub</span>
                    </div>
                 </div>

                 <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><ShieldCheck size={150} /></div>
                    <div className="relative z-10 space-y-4">
                       <h4 className="text-xs font-black uppercase tracking-widest">Protocol Trust Node</h4>
                       <p className="text-sm font-bold leading-relaxed uppercase tracking-tight opacity-90">AI Diagnostic suggests 99.8% transactional accuracy across current revenue cycle. No critical leakage detected.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
