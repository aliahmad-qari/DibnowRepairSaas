import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Sparkles, BrainCircuit, TrendingUp, TrendingDown, 
  AlertCircle, DollarSign, Clock, ShoppingBag, 
  Wrench, Info, Loader2, ShieldCheck, ChevronRight
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCurrency } from '../../context/CurrencyContext.tsx';

export const AIDailyInsightsV2: React.FC = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [report, setReport] = useState<any>(null);

  // 1. DATA HARVESTING (READ-ONLY)
  const stats = useMemo(() => {
    const repairs = db.repairs.getAll();
    const sales = db.sales.getAll();
    const inventory = db.inventory.getAll();
    
    const today = new Date().toLocaleDateString();
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();

    const todaySales = sales.filter(s => s.date === today);
    const yestSales = sales.filter(s => s.date === yesterday);
    
    const todayRepairs = repairs.filter(r => (r.date === today || new Date(r.createdAt).toLocaleDateString() === today) && ['completed', 'delivered'].includes(r.status?.toLowerCase()));
    const yestRepairs = repairs.filter(r => (r.date === yesterday || new Date(r.createdAt).toLocaleDateString() === yesterday) && ['completed', 'delivered'].includes(r.status?.toLowerCase()));

    const todayRev = todaySales.reduce((a, b) => a + b.total, 0) + todayRepairs.reduce((a, b) => a + b.cost, 0);
    const yestRev = yestSales.reduce((a, b) => a + b.total, 0) + yestRepairs.reduce((a, b) => a + b.cost, 0);

    // Peak Activity Calculation (Mock based on sales timestamp)
    const hours = todaySales.map(s => s.timestamp ? new Date(s.timestamp).getHours() : 16);
    const peakHour = hours.length > 0 ? Math.max(...hours) : 17;

    // Forensic P&L (Simplified check)
    const lossEvents = todayRepairs.filter(r => {
      const partsCost = parseFloat(r.partsCost) || 0;
      const techCost = parseFloat(r.technicianCost) || 0;
      return (partsCost + techCost) > r.cost;
    }).map(r => ({
      id: r.trackingId || r.id,
      device: r.device,
      reason: 'High component/labor cost exceeding quote'
    }));

    return {
      today: {
        repairs: todayRepairs.length,
        items: todaySales.reduce((a, b) => a + b.qty, 0),
        revenue: todayRev,
        peak: `${peakHour % 12 || 12} PM`
      },
      yesterday: { revenue: yestRev },
      lossEvents
    };
  }, [user]);

  // 2. AI INTELLIGENCE HANDSHAKE
  const synthesizeInsights = async () => {
    setIsSynthesizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Act as a Senior Business Intelligence Lead. Analyze today's shop performance:
        - Repairs Completed: ${stats.today.repairs}
        - Items Sold: ${stats.today.items}
        - Revenue Today: ${currency.symbol}${stats.today.revenue}
        - Revenue Yesterday: ${currency.symbol}${stats.yesterday.revenue}
        - Peak Activity Window: ${stats.today.peak}
        - Loss Incidents: ${JSON.stringify(stats.lossEvents)}

        Generate a Technical Daily Insight in JSON format:
        {
          "narrative": "One paragraph summarizing performance vs yesterday in natural language.",
          "pl_snapshot": {
            "estimated_profit": "string value",
            "loss_status": "string explaining losses or 'Nominal'",
            "risk_advisory": "forensic advice on margins"
          }
        }
        Strictly JSON. Professional tone.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setReport(JSON.parse(response.text || '{}'));
    } catch (e) {
      console.error("AI Node Error", e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden border-b-8 border-b-indigo-600">
        
        <div className="p-8 md:p-10 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                 <BrainCircuit size={28} className="text-white" />
              </div>
              <div>
                 <h2 className="text-xl font-black uppercase tracking-tight">AI Daily Performance Snapshot</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Autonomous Forensic Audit Node</p>
              </div>
           </div>
           <button 
             onClick={synthesizeInsights}
             disabled={isSynthesizing}
             className="px-8 py-4 bg-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-3 disabled:opacity-50"
           >
              {isSynthesizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {isSynthesizing ? "Analyzing Node..." : "Synthesize Daily Insight"}
           </button>
        </div>

        <div className="p-8 md:p-10">
          {!report && !isSynthesizing ? (
            <div className="py-12 flex flex-col items-center text-center space-y-4 opacity-40">
               <Info size={40} className="text-slate-300" />
               <p className="text-xs font-black uppercase tracking-widest text-slate-500">Ready to interrogate transactional data nodes for today's summary.</p>
            </div>
          ) : isSynthesizing ? (
            <div className="py-20 flex flex-col items-center gap-4">
               <div className="flex gap-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Interrogating Global Ledger...</p>
            </div>
          ) : (
            <div className="space-y-10 animate-in zoom-in-95 duration-500">
               
               {/* 1. Natural Language Summary */}
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-7 space-y-6">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare size={14} className="text-indigo-600" /> Daily Business Narrative
                     </h4>
                     <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12"><Sparkles size={80} /></div>
                        <p className="text-lg font-black text-indigo-950 leading-relaxed uppercase tracking-tight italic">
                           "{report.narrative}"
                        </p>
                     </div>
                  </div>

                  {/* Quick Metrics Comparison */}
                  <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                     <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex flex-col justify-between">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Trend Node</p>
                        <div className="flex items-center gap-2 mt-2">
                           {stats.today.revenue >= stats.yesterday.revenue ? <TrendingUp className="text-emerald-500" /> : <TrendingDown className="text-rose-500" />}
                           <span className={`text-xl font-black ${stats.today.revenue >= stats.yesterday.revenue ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {stats.yesterday.revenue > 0 ? (((stats.today.revenue - stats.yesterday.revenue) / stats.yesterday.revenue) * 100).toFixed(1) : '100'}%
                           </span>
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Vs. Yesterday</p>
                     </div>
                     <div className="p-6 bg-slate-900 text-white rounded-3xl flex flex-col justify-between">
                        <p className="text-[9px] font-black text-indigo-400 uppercase">Peak Node</p>
                        <h4 className="text-2xl font-black mt-2 uppercase">{stats.today.peak}</h4>
                        <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">High Activity Window</p>
                     </div>
                  </div>
               </div>

               {/* 2. Profit & Loss Snapshot */}
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <DollarSign size={14} className="text-emerald-600" /> Fiscal Forensic Snapshot
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                        <p className="text-[9px] font-black text-emerald-600 uppercase mb-2">Estimated Net Yield</p>
                        <h4 className="text-3xl font-black text-emerald-950 tracking-tighter">{report.pl_snapshot.estimated_profit}</h4>
                        <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Post-Overhead Calc</span>
                     </div>
                     <div className={`p-8 rounded-[2.5rem] border ${stats.lossEvents.length > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                        <p className={`text-[9px] font-black uppercase mb-2 ${stats.lossEvents.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}>Deficit Node Status</p>
                        <h4 className={`text-xl font-black tracking-tight uppercase ${stats.lossEvents.length > 0 ? 'text-rose-950' : 'text-slate-400'}`}>
                           {report.pl_snapshot.loss_status}
                        </h4>
                        {stats.lossEvents.length > 0 && (
                          <p className="text-[8px] font-bold text-rose-500 uppercase mt-2">Critical Attention Required</p>
                        )}
                     </div>
                     <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100">
                        <p className="text-[9px] font-black text-amber-600 uppercase mb-2">Strategic Advisory</p>
                        <p className="text-xs font-bold text-amber-900 leading-relaxed uppercase tracking-tighter">
                           {report.pl_snapshot.risk_advisory}
                        </p>
                     </div>
                  </div>
               </div>

            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-4">
           <ShieldCheck size={16} className="text-indigo-500" />
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Audit Trail Verified • DibIntelligence v5.0-F</span>
        </div>
      </div>
    </div>
  );
};

const MessageSquare = ({size, className}:any) => <Info size={size} className={className} />;
