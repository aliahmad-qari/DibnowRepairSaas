import React from 'react';
import { Store, User, Shield, Bell, Coins, ChevronDown, Globe, Save } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext.tsx';

export const UserSettings: React.FC = () => {
  const { currency, setManualCurrency, availableCurrencies } = useCurrency();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Shop Infrastructure</h2>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Configure your business profile and global preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 font-black text-[10px] uppercase tracking-widest">
            <Store size={18} /> Shop Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-slate-400 hover:bg-slate-50 rounded-2xl border border-transparent font-black text-[10px] uppercase tracking-widest transition-all">
            <User size={18} /> My Account
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-slate-400 hover:bg-slate-50 rounded-2xl border border-transparent font-black text-[10px] uppercase tracking-widest transition-all">
            <Bell size={18} /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white text-slate-400 hover:bg-slate-50 rounded-2xl border border-transparent font-black text-[10px] uppercase tracking-widest transition-all">
            <Shield size={18} /> Security
          </button>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
               <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200">
                  <Store size={32} />
               </div>
               <div>
                  <h3 className="font-black text-xl text-slate-800 tracking-tight uppercase">Identity Hub</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Manage global shop metadata</p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Official Business Title</label>
                 <input type="text" defaultValue="Elite Mobile Repair" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-sm transition-all" />
              </div>

              {/* CURRENCY OVERRIDE CONTROL */}
              <div className="md:col-span-2 pt-4">
                 <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                       <Coins size={150} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                       <div className="space-y-3">
                          <div className="flex items-center gap-2 text-indigo-400">
                             <Globe size={14} />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Regional Localisation Node</span>
                          </div>
                          <h4 className="text-2xl font-black tracking-tight">Treasury Currency</h4>
                          <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-xs">
                            Select the primary currency for your shop. This will update symbols on all POS terminals, Invoices, and Inventory ledgers.
                          </p>
                       </div>
                       
                       <div className="relative w-full md:w-72">
                          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500 font-black text-xl">
                             {currency.symbol}
                          </div>
                          <select 
                            value={currency.code}
                            onChange={(e) => setManualCurrency(e.target.value)}
                            className="w-full pl-14 pr-12 py-5 bg-white/5 border-2 border-white/10 rounded-3xl outline-none focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500/50 text-base font-black appearance-none cursor-pointer text-white transition-all shadow-2xl"
                          >
                            {availableCurrencies.map(c => (
                              <option key={c.id} value={c.currencyCode} className="text-slate-900 font-bold bg-white">
                                {c.currencyCode} ({c.symbol}) — {c.countryCode} Mapping
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" size={20} />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Technical Contact</label>
                 <input type="tel" defaultValue="+1 234 567 890" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">System Timezone</label>
                 <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm appearance-none cursor-pointer">
                   <option>UTC +00:00 (London)</option>
                   <option>UTC +05:00 (Karachi)</option>
                   <option>UTC -08:00 (Pacific)</option>
                 </select>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50 flex justify-end gap-4">
              <button className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-[10px] uppercase tracking-widest flex items-center gap-2">
                <Save size={16} /> Deploy Infrastructure Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};