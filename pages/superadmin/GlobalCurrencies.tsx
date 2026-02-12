
import React, { useState, useEffect } from 'react';
import { Coins, Globe, Plus, RefreshCw, Scale, ShieldCheck, MapPin, Search, Trash2, ArrowRightLeft } from 'lucide-react';
import { db } from '../../api/db.ts';

export const GlobalCurrencies: React.FC = () => {
  const [currencies, setCurrencies] = useState<any[]>([]);

  useEffect(() => {
    setCurrencies(db.currencies.getAll());
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tight">Geo-Regional Rules</h2>
           <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">Manage Cross-Border Fiscal Protocols</p>
        </div>
        <button className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-indigo-700 transition-all text-[10px] uppercase tracking-widest">
          <Plus size={18} /> Register Region Node
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
         <div className="lg:col-span-8 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                  <div className="relative w-80">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                     <input type="text" placeholder="Trace Region Node..." className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none text-xs font-bold text-white focus:border-indigo-500" />
                  </div>
                  <button className="p-3 bg-white/5 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-xl transition-all"><RefreshCw size={18} /></button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-white/5">
                        <tr>
                           <th className="px-10 py-6">Region Node</th>
                           <th className="px-10 py-6">Protocol Code</th>
                           <th className="px-10 py-6 text-center">Status</th>
                           <th className="px-10 py-6 text-right">Mapping</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {currencies.map(c => (
                          <tr key={c.id} className="hover:bg-white/5 transition-all group">
                             <td className="px-10 py-7">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-indigo-400 border border-white/10 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                      {c.countryCode}
                                   </div>
                                   <span className="font-black text-white text-sm uppercase">Global Region: {c.countryCode}</span>
                                </div>
                             </td>
                             <td className="px-10 py-7">
                                <span className="font-mono text-indigo-400 text-xs font-black">{c.currencyCode}</span>
                             </td>
                             <td className="px-10 py-7 text-center">
                                <span className={`px-4 py-1 rounded-lg text-[8px] font-black uppercase border ${c.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                   {c.isActive ? 'ACTIVE NODE' : 'OFFLINE'}
                                </span>
                             </td>
                             <td className="px-10 py-7 text-right">
                                <div className="flex items-center justify-end gap-3">
                                   <span className="text-xl font-black text-white">{c.symbol}</span>
                                   <button className="p-2 text-slate-500 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                                </div>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 text-center space-y-6">
               <ArrowRightLeft className="text-indigo-500 mx-auto" size={48} />
               <h3 className="text-xl font-black uppercase tracking-widest text-white leading-tight">Global Exchange Hub</h3>
               <p className="text-slate-500 text-xs font-bold uppercase leading-relaxed tracking-tighter">
                  Real-time rate synchronization node active. Automated conversion logic applied to all cross-shop transactional flows.
               </p>
               <div className="pt-8 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                     <p className="text-[8px] font-black text-slate-500 uppercase">GBP/USD Node</p>
                     <p className="text-sm font-black text-white mt-1">1.2742</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                     <p className="text-[8px] font-black text-slate-500 uppercase">GBP/PKR Node</p>
                     <p className="text-sm font-black text-white mt-1">354.12</p>
                  </div>
               </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 flex items-start gap-4">
               <ShieldCheck className="text-emerald-500 shrink-0 mt-1" size={20} />
               <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed tracking-widest">
                  Geo-IP detection protocol v2.1 active. System automatically propagates regional symbols based on verified entry node.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};
