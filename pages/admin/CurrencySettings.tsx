
import React, { useState, useEffect } from 'react';
import { db } from '../../api/db';
import { Globe, Save, CheckCircle2, AlertCircle, Trash2, Plus } from 'lucide-react';

export const CurrencySettings: React.FC = () => {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCurrencies(db.currencies.getAll());
  }, []);

  const handleToggle = (id: string) => {
    const updated = currencies.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c);
    setCurrencies(updated);
  };

  const handleSetDefault = (id: string) => {
    const updated = currencies.map(c => ({ ...c, isDefault: c.id === id }));
    setCurrencies(updated);
  };

  const handleSave = () => {
    db.currencies.update(currencies);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Geo-Currency Logic</h2>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Manage country-to-currency auto-mapping rules.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
          <div className="flex items-center gap-3">
             <Globe size={20} className="text-indigo-600" />
             <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Mapping Ledger</h3>
          </div>
          <button className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
            <Plus size={14} /> Add Mapping
          </button>
        </div>

        <div className="p-8 space-y-6">
          {currencies.map(c => (
            <div key={c.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 group">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-indigo-600 shadow-sm">
                  {c.countryCode}
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm uppercase">{c.currencyCode} - {c.symbol}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Country Node: {c.countryCode}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleSetDefault(c.id)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${c.isDefault ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
                >
                  {c.isDefault ? 'Platform Default' : 'Set as Default'}
                </button>
                <div className="h-6 w-px bg-slate-200" />
                <button 
                  onClick={() => handleToggle(c.id)}
                  className={`w-12 h-6 rounded-full relative transition-all ${c.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${c.isActive ? 'right-1' : 'left-1'}`} />
                </button>
                <button className="p-2 text-slate-300 hover:text-rose-600 transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
           <div className="flex items-center gap-3 text-amber-600">
             <AlertCircle size={18} />
             <p className="text-[10px] font-bold uppercase tracking-widest leading-none">Changes propagate to all nodes immediately.</p>
           </div>
           <button 
             onClick={handleSave}
             className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all"
           >
             {saved ? <><CheckCircle2 size={18} /> Sync Successful</> : <><Save size={18} /> Deploy Configuration</>}
           </button>
        </div>
      </div>
    </div>
  );
};
