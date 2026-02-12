import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  AlertCircle, ShieldAlert, Zap, Loader2, Info, 
  Clock, Package, Users, MessageSquare, CreditCard,
  ShieldCheck, BrainCircuit, ChevronRight, TrendingDown
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const AIDailyInsightsV3: React.FC = () => {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [operationalReport, setOperationalReport] = useState<any>(null);

  // 1. DATA MINING (READ-ONLY) - Harvesting raw nodes for AI scrutiny
  const opNodes = useMemo(() => {
    const repairs = db.repairs.getAll();
    const inventory = db.inventory.getAll();
    const sales = db.sales.getAll();
    const team = db.userTeamV2.getByOwner(user?.id || '');
    const complaints = db.complaints.getAll();
    const activity = db.activity.getAll();

    const now = new Date();
    const todayStr = now.toLocaleDateString();

    // Node A: High Latency Repairs (> 48 hours pending)
    const longPending = repairs.filter(r => {
      const created = new Date(r.createdAt || r.date);
      const diffHours = (now.getTime() - created.getTime()) / (1000 * 3600);
      return r.status.toLowerCase() === 'pending' && diffHours > 48;
    }).map(r => ({ id: r.trackingId, device: r.device, age: '48h+' }));

    // Node B: Stagnant Inventory (Stock > 0, No sales in 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 3600 * 1000));
    const stagnant = inventory.filter(i => 
      i.stock > 0 && !sales.some(s => s.productId === i.id && new Date(s.date) > thirtyDaysAgo)
    ).slice(0, 3).map(i => i.name);

    // Node C: Low Stock Criticality
    const criticalStock = inventory.filter(i => i.stock < 3).map(i => i.name);

    // Node D: Team Inactivity (No logs today)
    const activeMemberIds = new Set(activity.filter(a => a.timestamp.includes(todayStr)).map(a => a.userId));
    const inactiveStaff = team.filter(m => !activeMemberIds.has(m.id)).map(m => m.name);

    // Node E: Recent Friction (Complaints & Failed Activity)
    const todayComplaints = complaints.filter(c => c.date === todayStr);
    const failedTrans = activity.filter(a => a.status === 'Failed' && a.timestamp.includes(todayStr));

    return {
      longPending,
      stagnant,
      criticalStock,
      inactiveStaff,
      todayComplaints: todayComplaints.length,
      failedTrans: failedTrans.length
    };
  }, [user]);

  // 2. AI AUDIT LOGIC
  const runOperationalAudit = async () => {
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        As a Senior AI Operations Manager, analyze these business health nodes:
        - Repairs Pending > 48h: ${JSON.stringify(opNodes.longPending)}
        - Stagnant Stock: ${opNodes.stagnant.join(', ')}
        - Critical Stock Levels: ${opNodes.criticalStock.join(', ')}
        - Inactive Staff (Today): ${opNodes.inactiveStaff.join(', ')}
        - Complaints Raised Today: ${opNodes.todayComplaints}
        - Failed System Handshakes: ${opNodes.failedTrans}

        Identify the top 4 "Critical Smart Flags". For each, provide a JSON object:
        {
          "flags": [
            {
              "type": "REPAIR|INVENTORY|STOCK|TEAM|FRICTION",
              "title": "Short descriptive title",
              "reason": "Specific technical reason for this flag",
              "impact": "Business impact of ignoring this",
              "suggestion": "Strategic text advice"
            }
          ],
          "overall_health_score": "0-100",
          "priority_node": "The single most urgent item"
        }
        Strictly JSON output. Technical and forensic tone.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setOperationalReport(JSON.parse(response.text || '{}'));
    } catch (e) {
      console.error("Operational Insight Node Error", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'REPAIR': return <Clock className="text-amber-500" />;
      case 'INVENTORY': return <TrendingDown className="text-indigo-500" />;
      case 'STOCK': return <Package className="text-rose-500" />;
      case 'TEAM': return <Users className="text-blue-500" />;
      case 'FRICTION': return <AlertCircle className="text-rose-600" />;
      default: return <Zap className="text-slate-400" />;
    }
  };

  return (
    <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden border-b-8 border-b-rose-600">
        
        {/* Module Header */}
        <div className="p-8 md:p-10 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center shadow-xl shadow-rose-100">
                 <ShieldAlert size={28} className="text-white" />
              </div>
              <div>
                 <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Operational Smart Flags</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Autonomous Bottleneck Detection Node</p>
              </div>
           </div>
           <button 
             onClick={runOperationalAudit}
             disabled={isAnalyzing}
             className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-black transition-all flex items-center gap-3 disabled:opacity-50"
           >
              {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
              {isAnalyzing ? "Scanning System..." : "Invoke Operational Audit"}
           </button>
        </div>

        <div className="p-8 md:p-10">
          {!operationalReport && !isAnalyzing ? (
            <div className="py-12 flex flex-col items-center text-center space-y-4 opacity-30 grayscale">
               <ShieldCheck size={48} className="text-slate-300" />
               <p className="text-xs font-black uppercase tracking-widest text-slate-500 max-w-xs">Awaiting manual invocation to perform deep-node audit across platform modules.</p>
            </div>
          ) : isAnalyzing ? (
            <div className="py-24 flex flex-col items-center gap-6">
               <Loader2 size={48} className="text-rose-600 animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Interrogating Repairs, Inventory & Team Nodes...</p>
            </div>
          ) : (
            <div className="space-y-10 animate-in zoom-in-95 duration-500">
               
               {/* Priority Node Banner */}
               <div className="p-6 bg-rose-600 rounded-[2rem] text-white flex items-center justify-between shadow-2xl shadow-rose-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-1000"><ShieldAlert size={120} /></div>
                  <div className="flex items-center gap-5 relative z-10">
                     <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20"><AlertCircle size={24}/></div>
                     <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-200">Critical Priority Node</p>
                        <h4 className="text-lg font-black uppercase tracking-tight mt-1">{operationalReport.priority_node}</h4>
                     </div>
                  </div>
                  <div className="relative z-10 text-right">
                     <p className="text-[9px] font-black uppercase tracking-widest text-rose-200">System Health Score</p>
                     <p className="text-3xl font-black">{operationalReport.overall_health_score}%</p>
                  </div>
               </div>

               {/* Smart Flag Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {operationalReport.flags?.map((flag: any, i: number) => (
                    <div key={i} className="bg-slate-50 rounded-[2.5rem] border border-slate-100 p-8 flex flex-col gap-6 group hover:border-indigo-200 transition-all hover:shadow-xl hover:bg-white">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                {getIcon(flag.type)}
                             </div>
                             <div>
                                <h5 className="font-black text-slate-800 uppercase tracking-tight leading-none">{flag.title}</h5>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 block">{flag.type} PROTOCOL</span>
                             </div>
                          </div>
                          <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                       </div>

                       <div className="space-y-4">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reason</p>
                             <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-tighter">{flag.reason}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Impact</p>
                             <p className="text-xs font-bold text-rose-600 leading-relaxed uppercase tracking-tighter">{flag.impact}</p>
                          </div>
                          <div className="pt-4 border-t border-slate-200/50">
                             <div className="flex items-center gap-2 text-indigo-600">
                                <Info size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Suggested Attention</span>
                             </div>
                             <p className="text-xs font-black text-slate-800 mt-2 leading-relaxed uppercase tracking-tighter italic">"{flag.suggestion}"</p>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>

            </div>
          )}
        </div>

        {/* Audit Verification Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-4">
           <ShieldCheck size={16} className="text-emerald-500" />
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Audit Node v6.1-OP • DibIntelligence Forensics</span>
        </div>
      </div>
    </div>
  );
};
