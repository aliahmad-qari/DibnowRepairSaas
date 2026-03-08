
import React from 'react';
import { Settings as SettingsIcon, Store, User, CreditCard, Shield, Bell, Languages, Coins, ChevronDown, Globe } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext.tsx';

export const UserSettings: React.FC = () => {
  const { currency, setManualCurrency, availableCurrencies } = useCurrency();

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
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
          {/* Main Shop Profile */}
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center gap-6 pb-8 border-b border-slate-50">
               <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 group hover:border-indigo-400 transition-all cursor-pointer">
                  <Store size={40} />
               </div>
               <div>
                  <h3 className="font-black text-xl text-slate-800 tracking-tight">Identity Visuals</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Logo Specifications: 800x800px max</p>
                  <button className="mt-4 text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-100 hover:border-indigo-600 transition-all">Upload New Asset</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Legal Business Name</label>
                 <input type="text" defaultValue="Elite Mobile Repair" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-sm transition-all" />
              </div>

              {/* DYNAMIC CURRENCY OVERRIDE SECTION */}
              <div className="md:col-span-2 pt-4">
                 <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                       <Coins size={120} />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <div className="space-y-2">
                          <div className="flex items-center gap-2 text-indigo-400">
                             <Globe size={14} />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Global Localisation Node</span>
                          </div>
                          <h4 className="text-xl font-black tracking-tight">Treasury Currency</h4>
                          <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-xs">Override auto-detection to set your shop's primary commerce currency.</p>
                       </div>
                       
                       <div className="relative w-full md:w-64">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 font-black text-lg">
                             {currency.symbol}
                          </div>
                          <select 
                            value={currency.code}
                            onChange={(e) => setManualCurrency(e.target.value)}
                            className="w-full pl-12 pr-10 py-4 bg-white/10 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-black appearance-none cursor-pointer text-white transition-all"
                          >
                            {availableCurrencies.map(c => (
                              <option key={c.id} value={c.currencyCode} className="text-slate-900 font-bold">
                                {c.currencyCode} ({c.symbol}) - {c.countryCode}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={18} />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Official Contact</label>
                 <input type="tel" defaultValue="+1 234 567 890" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-sm transition-all" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">System Timezone</label>
                 <select className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm appearance-none cursor-pointer transition-all">
                   <option>UTC +00:00 (London)</option>
                   <option>UTC +05:00 (Karachi)</option>
                   <option>UTC -08:00 (Pacific)</option>
                 </select>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">HQ Address</label>
                 <textarea rows={3} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none font-bold text-sm transition-all resize-none" defaultValue="123 Tech Avenue, Silicon Valley, CA" />
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50 flex justify-end gap-4">
              <button className="px-8 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Discard</button>
              <button className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all text-[10px] uppercase tracking-widest">Commit Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
