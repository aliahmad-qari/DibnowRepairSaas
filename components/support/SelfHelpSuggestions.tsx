import React from 'react';
import { 
  Lightbulb, 
  ChevronRight, 
  CreditCard, 
  Rocket, 
  Wrench, 
  Package,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const SelfHelpSuggestions: React.FC = () => {
  const navigate = useNavigate();

  const suggestions = [
    {
      id: 'payment',
      title: 'Payment Failed?',
      desc: 'Verify gateway node or treasury balance level.',
      icon: CreditCard,
      color: 'bg-rose-50 text-rose-600',
      action: () => navigate('/user/wallet'),
      tip: 'Check if your bank node requires 3D-Secure auth.'
    },
    {
      id: 'limit',
      title: 'Plan Limit Reached?',
      desc: 'Expand your operational quota via tier promote.',
      icon: Rocket,
      color: 'bg-indigo-50 text-indigo-600',
      action: () => navigate('/user/pricing'),
      tip: 'Gold tier offers 1000+ nodes for heavy scaling.'
    },
    {
      id: 'repair',
      title: 'Repair Stuck?',
      desc: 'Reset lifecycle state in the repair audit node.',
      icon: Wrench,
      color: 'bg-blue-50 text-blue-600',
      action: () => navigate('/user/repairs'),
      tip: 'Transitions take 1-2s to propagate globally.'
    },
    {
      id: 'inventory',
      title: 'Inventory Not Saving?',
      desc: 'Check SKU syntax and classification nodes.',
      icon: Package,
      color: 'bg-emerald-50 text-emerald-600',
      action: () => navigate('/user/inventory'),
      tip: 'Duplicate SKUs trigger system redundancy blocks.'
    }
  ];

  return (
    <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 md:p-10 mb-8 animate-in fade-in slide-in-from-top-6 duration-1000">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-400 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-100">
            <Lightbulb size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 leading-none">Instant Resolution Nodes</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Self-Troubleshoot before lodging a case</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
           <Zap size={14} className="text-amber-500" />
           <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">SLA Reduction: -40m</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {suggestions.map((item) => (
          <div 
            key={item.id} 
            className="p-6 rounded-[2.5rem] border border-slate-50 bg-slate-50/30 flex flex-col justify-between group hover:bg-white hover:border-indigo-200 hover:shadow-xl transition-all h-full cursor-pointer"
            onClick={item.action}
          >
            <div className="space-y-4">
              <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <item.icon size={20} />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight mb-1">{item.title}</h4>
                <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">{item.desc}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100/50">
               <div className="flex items-center gap-2 mb-3">
                  <Info size={10} className="text-indigo-400" />
                  <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">Expert Tip</p>
               </div>
               <p className="text-[9px] font-black text-slate-400 italic mb-4">{item.tip}</p>
               <div className="flex items-center gap-1 text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                  Resolve now <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-3">
        <ShieldCheck size={16} className="text-emerald-500" />
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Infrastructure Knowledge Database v9.2.1 Active</span>
      </div>
    </div>
  );
};
