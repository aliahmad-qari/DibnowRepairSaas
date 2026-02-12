import React, { useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Users, UserCheck, UserX, Activity, 
  Loader2, BrainCircuit, ShieldCheck, 
  Wrench, ShoppingCart, Info, BarChart3,
  Terminal, BadgeCheck, Cpu
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const AIDailyInsightsV5: React.FC = () => {
  const { user } = useAuth();
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [teamReport, setTeamReport] = useState<any>(null);

  // 1. DATA HARVESTING (READ-ONLY) - Auditing personnel activity nodes
  const teamNodes = useMemo(() => {
    const team = db.userTeamV2.getByOwner(user?.id || '');
    const activity = db.activity.getAll();
    const repairs = db.repairs.getAll();
    const sales = db.sales.getAll();

    const now = new Date();
    const todayStr = now.toLocaleDateString();

    const staffPerformance = team.map(member => {
      // Find activity logs for today
      const logsToday = activity.filter(a => 
        a.userId === member.id && 
        new Date(a.timestamp).toLocaleDateString() === todayStr
      );

      // Find repairs processed today
      const repairsToday = repairs.filter(r => 
        r.assignedTo === member.name && 
        (r.date === todayStr || new Date(r.createdAt).toLocaleDateString() === todayStr)
      ).length;

      // Find sales handled (mocked via activity log since sales doesn't store clerk by default)
      const salesHandled = logsToday.filter(l => l.actionType === 'Stock Item Sold').length;

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        isActive: logsToday.length > 0 || repairsToday > 0,
        repairLoad: repairsToday,
        salesVolume: salesHandled,
        logCount: logsToday.length
      };
    });

    const activeMembers = staffPerformance.filter(p => p.isActive);
    const inactiveMembers = staffPerformance.filter(p => !p.isActive);

    return {
      activeCount: activeMembers.length,
      inactiveCount: inactiveMembers.length,
      roster: staffPerformance,
      activeNames: activeMembers.map(m => m.name).join(', '),
      inactiveNames: inactiveMembers.map(m => m.name).join(', ')
    };
  }, [user]);

  // 2. AI WORKFORCE SYNTHESIS
  const runTeamAudit = async () => {
    setIsSynthesizing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        As a Senior AI Workforce Architect, analyze today's personnel activity:
        - Total Workforce: ${teamNodes.roster.length}
        - Active Members Today: ${teamNodes.activeCount} (${teamNodes.activeNames})
        - Inactive Members Today: ${teamNodes.inactiveCount} (${teamNodes.inactiveNames})
        - Full Performance Roster: ${JSON.stringify(teamNodes.roster)}

        Generate a non-judgmental, technical "Personnel Utilization Report" in JSON:
        {
          "summary_text": "Style: 'X team members were active today. Y had no recorded activity.'",
          "efficiency_note": "A technical observation on repair/sales distribution",
          "utilization_rate": "0-100%",
          "highlights": [
            "Specific technical mention of an active node's output"
          ]
        }
        Strictly JSON. Professional and objective tone.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      setTeamReport(JSON.parse(response.text || '{}'));
    } catch (e) {
      console.error("Team Intelligence Failure", e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden border-b-8 border-b-blue-600">
        
        {/* Module Header */}
        <div className="p-8 md:p-10 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40">
                 <Users size={28} className="text-white" />
              </div>
              <div>
                 <h2 className="text-xl font-black uppercase tracking-tight">Personnel Performance Intelligence</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Autonomous Human Capital Utilization Audit</p>
              </div>
           </div>
           <button 
             onClick={runTeamAudit}
             disabled={isSynthesizing}
             className="px-10 py-4 bg-blue-600 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-blue-500 transition-all flex items-center gap-3 disabled:opacity-50 shadow-2xl shadow-blue-900/20"
           >
              {isSynthesizing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
              {isSynthesizing ? "Scanning Roster..." : "Invoke Personnel Audit"}
           </button>
        </div>

        <div className="p-8 md:p-12">
          {!teamReport && !isSynthesizing ? (
            <div className="py-12 flex flex-col items-center text-center space-y-4 opacity-30 grayscale">
               <Cpu size={56} className="text-blue-200" />
               <p className="text-xs font-black uppercase tracking-widest text-slate-500 max-w-sm">Ready to interrogation workforce nodes and activity logs for resource distribution insights.</p>
            </div>
          ) : isSynthesizing ? (
            <div className="py-24 flex flex-col items-center gap-6">
               <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" />
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-3 h-3 bg-blue-200 rounded-full animate-bounce [animation-delay:0.4s]" />
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Interrogating Personnel Data Nodes...</p>
            </div>
          ) : (
            <div className="space-y-12 animate-in zoom-in-95 duration-500">
               
               {/* Summary Block */}
               <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  <div className="xl:col-span-7 bg-blue-50 rounded-[2.5rem] p-8 border border-blue-100 relative overflow-hidden flex flex-col justify-center">
                     <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12"><Activity size={100} /></div>
                     <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Info size={14}/> Non-Judgmental Narrative</h4>
                     <p className="text-xl font-black text-blue-950 uppercase tracking-tight italic leading-relaxed">
                        "{teamReport.summary_text}"
                     </p>
                  </div>
                  
                  <div className="xl:col-span-5 grid grid-cols-2 gap-4">
                     <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between">
                        <p className="text-[9px] font-black text-blue-400 uppercase">Utilization Rate</p>
                        <h4 className="text-3xl font-black mt-2 tracking-tighter">{teamReport.utilization_rate}</h4>
                        <div className="w-full bg-white/10 h-1 rounded-full mt-4 overflow-hidden">
                           <div className="bg-blue-500 h-full" style={{ width: teamReport.utilization_rate }} />
                        </div>
                     </div>
                     <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Active Status</p>
                        <div className="flex items-baseline gap-2 mt-2">
                           <h4 className="text-3xl font-black text-slate-800">{teamNodes.activeCount}</h4>
                           <span className="text-[10px] font-bold text-slate-400">/ {teamNodes.roster.length} Nodes</span>
                        </div>
                        <p className="text-[8px] font-bold text-emerald-500 uppercase mt-4">Authorized Units</p>
                     </div>
                  </div>
               </div>

               {/* Personnel Activity Breakdown */}
               <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <BarChart3 size={16} className="text-blue-600" /> Operational Node Distribution
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {teamNodes.roster.map((member, i) => (
                      <div key={i} className={`p-6 rounded-[2rem] border transition-all group ${member.isActive ? 'bg-white border-slate-100 shadow-sm hover:border-blue-300' : 'bg-slate-50 border-transparent opacity-60'}`}>
                        <div className="flex items-center justify-between mb-6">
                           <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${member.isActive ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                                {member.name.charAt(0)}
                              </div>
                              <div>
                                 <h5 className="font-black text-slate-800 uppercase text-xs tracking-tight">{member.name}</h5>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase">{member.role}</p>
                              </div>
                           </div>
                           <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <p className="text-[8px] font-black text-slate-400 uppercase">Repairs</p>
                              <div className="flex items-center gap-2">
                                 <Wrench size={12} className="text-blue-500" />
                                 <span className="text-sm font-black text-slate-700">{member.repairLoad}</span>
                              </div>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[8px] font-black text-slate-400 uppercase">Sales</p>
                              <div className="flex items-center gap-2">
                                 <ShoppingCart size={12} className="text-emerald-500" />
                                 <span className="text-sm font-black text-slate-700">{member.salesVolume}</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
               </div>

               {/* AI Advisory */}
               <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex flex-col md:flex-row items-center gap-8 group">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                     <Terminal size={28} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Efficiency Note</h4>
                     <p className="text-sm font-bold text-slate-600 mt-2 uppercase tracking-tighter leading-relaxed">
                        {teamReport.efficiency_note}
                     </p>
                  </div>
               </div>

            </div>
          )}
        </div>

        {/* Audit Verification Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-4">
           <ShieldCheck size={16} className="text-emerald-500" />
           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Audit node v8.4-HR • Workforce intelligence verified</span>
        </div>
      </div>
    </div>
  );
};
