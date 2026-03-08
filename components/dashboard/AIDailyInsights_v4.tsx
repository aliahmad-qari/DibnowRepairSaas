import React, { useState, useMemo } from 'react';
import { aiService } from '../../api/aiService';
import {
  Users, ShoppingBag, Star, TrendingDown,
  Zap, Loader2, Info, ArrowUpRight,
  Crown, Heart, ShieldCheck, BrainCircuit,
  MessageSquareHeart, UserCheck, Target
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCurrency } from '../../context/CurrencyContext.tsx';

export const AIDailyInsightsV4: React.FC = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [behaviorReport, setBehaviorReport] = useState<any>(null);

  // 1. DATA HARVESTING (READ-ONLY) - Extracting behavioral patterns from existing nodes
  const behaviorNodes = useMemo(() => {
    const sales = db.sales.getAll();
    const clients = db.clients.getAll();
    const repairs = db.repairs.getAll();

    const now = new Date();
    const todayStr = now.toLocaleDateString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    // Product Popularity Today
    const todaySales = sales.filter(s => s.date === todayStr);
    const productFrequency: Record<string, number> = {};
    todaySales.forEach(s => {
      productFrequency[s.productName] = (productFrequency[s.productName] || 0) + s.qty;
    });
    const topProductToday = Object.entries(productFrequency).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Repeat Customer Activity (7 Days)
    const recentSales = sales.filter(s => {
      const [d, m, y] = s.date.split('/');
      const sDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return sDate >= sevenDaysAgo;
    });

    const customerActivity: Record<string, { orders: number, spend: number }> = {};
    recentSales.forEach(s => {
      if (!customerActivity[s.customer]) customerActivity[s.customer] = { orders: 0, spend: 0 };
      customerActivity[s.customer].orders += 1;
      customerActivity[s.customer].spend += s.total;
    });

    const repeatClients = Object.entries(customerActivity)
      .filter(([_, stats]) => stats.orders >= 2)
      .map(([name, stats]) => ({ name, orders: stats.orders }));

    // High Value Clients (LTV calculation)
    const hvuNodes = clients.map(c => {
      const cSales = sales.filter(s => s.customer === c.name);
      const cRepairs = repairs.filter(r => r.customerName === c.name);
      const totalLTV = cSales.reduce((a, b) => a + b.total, 0) + cRepairs.reduce((a, b) => a + b.cost, 0);
      return { name: c.name, ltv: totalLTV };
    }).sort((a, b) => b.ltv - a.ltv).slice(0, 3);

    // Declining Activity (Active 30 days ago, zero in last 7)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const churnRisks = clients.filter(c => {
      const hasOldActivity = sales.some(s => s.customer === c.name && new Date(s.date) >= thirtyDaysAgo);
      const hasRecentActivity = sales.some(s => s.customer === c.name && new Date(s.date) >= sevenDaysAgo);
      return hasOldActivity && !hasRecentActivity;
    }).slice(0, 3).map(c => c.name);

    return {
      topProductToday,
      repeatClients,
      hvuNodes,
      churnRisks,
      totalTodayRevenue: todaySales.reduce((a, b) => a + b.total, 0)
    };
  }, [user]);

  // 2. AI BEHAVIORAL ANALYSIS LOGIC
  const runBehavioralAnalysis = async () => {
    setIsSynthesizing(true);
    try {
      const prompt = `
        As a Senior Customer Success Architect, analyze these shop behavior nodes:
        - Top Product Today: ${behaviorNodes.topProductToday}
        - Repeat Customers (Last 7 Days): ${JSON.stringify(behaviorNodes.repeatClients)}
        - High-Value Client Nodes (LTV): ${JSON.stringify(behaviorNodes.hvuNodes)}
        - Churn Risks (Declining Activity): ${behaviorNodes.churnRisks.join(', ')}
        - Revenue Settlement Today: ${currency.symbol}${behaviorNodes.totalTodayRevenue}

        Generate a JSON Behavioral Insight Report:
        {
          "executive_summary": "One sentence growth summary",
          "insights": [
            {
              "type": "LOYALTY|VALUE|CHURN|DEMAND",
              "subject": "Name of client or product",
              "narrative": "Detailed observation like 'Client X placed 3 orders this week'",
              "strategic_hint": "Non-automated advice"
            }
          ],
          "retention_score": "0-100"
        }
        Strictly JSON. Professional and técnico-commercial tone.
      `;

      const data = await aiService.generateJson(prompt, "System: Senior Customer Success Architect Behavioral Audit");
      if (data) {
        setBehaviorReport(data);
      }
    } catch (e) {
      console.error("Behavioral Node Failure", e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LOYALTY': return <Heart className="text-rose-500" />;
      case 'VALUE': return <Crown className="text-amber-500" />;
      case 'CHURN': return <TrendingDown className="text-rose-600" />;
      case 'DEMAND': return <Target className="text-indigo-500" />;
      default: return <Zap className="text-slate-400" />;
    }
  };

  return (
    <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden border-b-8 border-b-indigo-600">

        {/* Module Header */}
        <div className="p-8 md:p-10 bg-indigo-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-md">
              <Users size={28} className="text-indigo-300" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Customer Behavior Intelligence</h2>
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-[0.2em] mt-1">Autonomous Cohort & LTV Analysis Node</p>
            </div>
          </div>
          <button
            onClick={runBehavioralAnalysis}
            disabled={isSynthesizing}
            className="px-10 py-4 bg-indigo-600 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-indigo-500 transition-all flex items-center gap-3 disabled:opacity-50 shadow-2xl"
          >
            {isSynthesizing ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
            {isSynthesizing ? "Synthesizing Profiles..." : "Extract Behavioral Insights"}
          </button>
        </div>

        <div className="p-8 md:p-12">
          {!behaviorReport && !isSynthesizing ? (
            <div className="py-12 flex flex-col items-center text-center space-y-4 opacity-40 grayscale">
              <MessageSquareHeart size={56} className="text-indigo-200" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 max-w-sm">Ready to interrogation transaction nodes for customer loyalty and spending patterns.</p>
            </div>
          ) : isSynthesizing ? (
            <div className="py-24 flex flex-col items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-ping" />
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-ping [animation-delay:0.2s]" />
                <div className="w-3 h-3 bg-indigo-200 rounded-full animate-ping [animation-delay:0.4s]" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Mapping Customer Archetypes...</p>
            </div>
          ) : (
            <div className="space-y-12 animate-in zoom-in-95 duration-500">

              {/* Summary Banner */}
              <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Users size={120} /></div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-indigo-100">
                    <UserCheck size={32} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Retention Health Summary</p>
                    <h4 className="text-xl font-black text-indigo-900 uppercase tracking-tight mt-1 italic">"{behaviorReport.executive_summary}"</h4>
                  </div>
                </div>
                <div className="relative z-10 text-center md:text-right bg-white px-8 py-4 rounded-3xl border border-indigo-100 shadow-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Engagement Node Score</p>
                  <p className="text-4xl font-black text-indigo-600">{behaviorReport.retention_score}<span className="text-sm opacity-50">/100</span></p>
                </div>
              </div>

              {/* Behavioral Insight Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {behaviorReport.insights?.map((insight: any, i: number) => (
                  <div key={i} className="bg-slate-50 rounded-[2.5rem] border border-slate-100 p-8 flex flex-col gap-6 group hover:border-indigo-300 transition-all hover:bg-white hover:shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                          {getIcon(insight.type)}
                        </div>
                        <div>
                          <h5 className="font-black text-slate-800 uppercase tracking-tight leading-none truncate max-w-[150px]">{insight.subject}</h5>
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-2 block">{insight.type} NODE</span>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-[8px] font-black text-indigo-600 uppercase">Verified Trace</div>
                    </div>

                    <div className="space-y-4">
                      <p className="text-sm font-bold text-slate-600 leading-relaxed uppercase tracking-tighter italic">"{insight.narrative}"</p>

                      <div className="pt-4 border-t border-slate-200/50">
                        <div className="flex items-center gap-2 text-indigo-600">
                          <ArrowUpRight size={14} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Growth Recommendation</span>
                        </div>
                        <p className="text-xs font-black text-slate-800 mt-2 leading-relaxed uppercase tracking-tighter">
                          {insight.strategic_hint}
                        </p>
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
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Audit node v7.2-CRM • Behavioral intelligence verified</span>
        </div>
      </div>
    </div>
  );
};
