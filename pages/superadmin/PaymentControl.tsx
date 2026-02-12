
import React, { useState, useMemo } from 'react';
import { 
  CreditCard, ShieldCheck, Zap, Settings, RefreshCw, 
  Search, Filter, Clock, AlertTriangle, XCircle, 
  Terminal, Database, Globe, Landmark, DollarSign,
  ArrowRight, ShieldAlert, CheckCircle2, MoreVertical,
  History
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useCurrency } from '../../context/CurrencyContext.tsx';

export const PaymentControl: React.FC = () => {
  const { currency } = useCurrency();
  const [activeTab, setActiveTab] = useState('logs');
  const [searchTerm, setSearchTerm] = useState('');

  const transactions = useMemo(() => {
    return db.wallet.getTransactions().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  const failedPayments = useMemo(() => {
    return transactions.filter(t => t.status === 'failed');
  }, [transactions]);

  const GatewayCard = ({ name, icon: Icon, color, status, uptime }: any) => (
    <div className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between group hover:border-indigo-500/50 transition-all">
       <div className="flex items-center justify-between mb-8">
          <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-2xl`}>
             <Icon size={28} className="text-white" />
          </div>
          <div className="text-right">
             <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${status === 'Online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                {status}
             </span>
             <p className="text-[7px] font-bold text-slate-500 uppercase mt-2">Uptime: {uptime}</p>
          </div>
       </div>
       <div>
          <h4 className="text-xl font-black text-white uppercase tracking-tight">{name} Node</h4>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Protocol: OAuth2 / AES-256</p>
          <button className="mt-6 flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] group-hover:text-white transition-colors">
             Configure Handshake <Settings size={12} />
          </button>
       </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-white/5 text-indigo-400 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10">
              <Zap size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black uppercase tracking-tight">Gateway Control</h2>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Administrative Payment Protocol Hub</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <GatewayCard name="Stripe" icon={CreditCard} color="bg-indigo-600" status="Online" uptime="99.98%" />
         <GatewayCard name="PayPal" icon={Globe} color="bg-blue-500" status="Online" uptime="99.95%" />
         <GatewayCard name="PayFast" icon={Landmark} color="bg-emerald-600" status="Online" uptime="100%" />
      </div>

      <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
         <button onClick={() => setActiveTab('logs')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>Handshake Logs</button>
         <button onClick={() => setActiveTab('failed')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'failed' ? 'bg-rose-600 text-white' : 'text-slate-500 hover:text-white'}`}>Rejection Trace</button>
      </div>

      {activeTab === 'logs' ? (
        <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
           <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="relative w-80">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                 <input 
                   type="text" 
                   placeholder="Trace Transaction Hash..." 
                   className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-xs font-bold text-white focus:border-indigo-500"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              <button className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white">
                 <RefreshCw size={14} /> Force Ledger Sync
              </button>
           </div>
           <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                 <thead className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-white/5">
                    <tr>
                       <th className="px-10 py-6">Audit Reference</th>
                       <th className="px-10 py-6">Protocol Type</th>
                       <th className="px-10 py-6 text-center">Node Status</th>
                       <th className="px-10 py-6 text-right">Settlement</th>
                       <th className="px-10 py-6 text-right">Timestamp</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-white/5 transition-all group">
                         <td className="px-10 py-6">
                            <span className="font-mono text-xs font-black text-indigo-400">#{tx.id}</span>
                         </td>
                         <td className="px-10 py-6">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/10"><History size={14}/></div>
                               <span className="text-xs font-black text-white uppercase">{tx.description}</span>
                            </div>
                         </td>
                         <td className="px-10 py-6 text-center">
                            <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border inline-flex items-center gap-2 ${
                              tx.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            }`}>
                               {tx.status}
                            </span>
                         </td>
                         <td className="px-10 py-6 text-right">
                            <p className={`text-sm font-black ${tx.type === 'credit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                               {tx.type === 'credit' ? '+' : '-'}{currency.symbol}{tx.amount}
                            </p>
                         </td>
                         <td className="px-10 py-6 text-right">
                            <span className="text-[9px] font-black text-slate-500 uppercase">{tx.date}</span>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="space-y-6">
           {failedPayments.length === 0 ? (
             <div className="py-24 text-center bg-white/5 rounded-[3rem] border border-white/10">
                <CheckCircle2 className="text-emerald-500 mx-auto mb-6" size={64} strokeWidth={1} />
                <h3 className="text-xl font-black uppercase tracking-tight">Gateway Node nominal</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Zero technical rejections in current cycle.</p>
             </div>
           ) : failedPayments.map(fail => (
             <div key={fail.id} className="bg-white/5 border border-rose-500/20 p-8 rounded-[2.5rem] flex items-center justify-between group hover:bg-rose-500/5 transition-all">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-900/50"><XCircle size={28} className="text-white"/></div>
                   <div>
                      <h4 className="text-lg font-black text-white uppercase tracking-tight">Rejection Trace: #{fail.id}</h4>
                      <p className="text-rose-400 font-bold text-[10px] uppercase mt-1">Reason: Handshake Refused • Insufficient Treasury Node</p>
                   </div>
                </div>
                <div className="text-right flex items-center gap-6">
                   <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Impact Value</p>
                      <p className="text-lg font-black text-white">{currency.symbol}{fail.amount}</p>
                   </div>
                   <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10"><MoreVertical size={20}/></button>
                </div>
             </div>
           ))}
        </div>
      )}

      <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Terminal size={180} />
         </div>
         <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4">Forensic Trace protocol</h4>
         <p className="text-slate-400 text-xs font-medium leading-relaxed uppercase tracking-tighter max-w-2xl relative z-10">
            Payment control nodes monitor global settlement status. Every handshake rejection is logged with full metadata for debugging and dispute resolution. Mutation of gateway configuration nodes requires Level-9 authority endorsement.
         </p>
      </div>
    </div>
  );
};
