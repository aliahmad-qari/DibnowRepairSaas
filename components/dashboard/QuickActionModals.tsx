
import React, { useState, useEffect } from 'react';
import { X, Moon, Loader2, BookOpen, Fingerprint, Cloud, History as HistoryIcon, User, Package, ChevronRight, Search } from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext';

export const QuickActionModals: React.FC<{ type: string; onClose: () => void }> = ({ type, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (type === 'prayer') {
          const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=London&country=UK&method=2');
          const json = await res.json();
          setData(json.data.timings);
        } else if (type === 'quran') {
          const res = await fetch('https://api.alquran.cloud/v1/surah');
          const json = await res.json();
          setData(json.data);
        } else if (type === 'weather') {
          setData({ temp: 22, condition: 'Clear Sky', humidity: 45, city: 'London' });
        } else if (type === 'history') {
          const repairs = db.repairs.getAll().slice(0, 5);
          const sales = db.sales.getAll().slice(0, 5);
          setData({ repairs, sales });
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, [type]);

  const ModalWrapper = ({ title, icon: Icon, children }: any) => (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
              <Icon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-widest leading-none">{title}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1.5 tracking-tighter">Operational Utility Node</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-rose-500 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-300">
              <Loader2 className="animate-spin" size={40} />
              <span className="text-[10px] font-black uppercase tracking-widest">Handshaking with API...</span>
            </div>
          ) : children}
        </div>
      </div>
    </div>
  );

  if (type === 'prayer') return (
    <ModalWrapper title="Prayer Timings" icon={Moon}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data && Object.entries(data).filter(([k]) => !['Imsak', 'Midnight', 'Sunset'].includes(k)).map(([name, time]) => (
          <div key={name} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black uppercase text-slate-400 tracking-widest">{name}</span>
            <span className="text-xl font-black text-indigo-600">{time as string}</span>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );

  if (type === 'quran') return (
    <ModalWrapper title="Holy Quran" icon={BookOpen}>
      <div className="space-y-3">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search Surah..." className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-sm font-bold" />
        </div>
        {data?.map((surah: any) => (
          <div key={surah.number} className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:border-indigo-500 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xs group-hover:bg-indigo-600 group-hover:text-white transition-all">
                {surah.number}
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-sm">{surah.englishName}</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{surah.revelationType} • {surah.numberOfAyahs} Ayahs</p>
              </div>
            </div>
            <span className="text-xl font-arabic text-slate-400 group-hover:text-indigo-600">{surah.name}</span>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );

  if (type === 'tasbeeh') {
    const [count, setCount] = useState(0);
    return (
      <ModalWrapper title="Tasbeeh Counter" icon={Fingerprint}>
        <div className="flex flex-col items-center py-10">
          <div className="w-48 h-48 rounded-full border-8 border-indigo-50 flex flex-col items-center justify-center bg-white shadow-2xl relative mb-12">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute top-10">Total Count</span>
             <span className="text-6xl font-black text-slate-900 tracking-tighter">{count}</span>
          </div>
          <div className="flex gap-4 w-full max-w-sm">
             <button onClick={() => setCount(count + 1)} className="flex-1 py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all text-xs">Increment</button>
             <button onClick={() => setCount(0)} className="px-8 py-6 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all text-xs">Reset</button>
          </div>
        </div>
      </ModalWrapper>
    );
  }

  if (type === 'weather') return (
    <ModalWrapper title="Global Weather" icon={Cloud}>
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 rounded-[2.5rem] text-white flex flex-col items-center text-center">
        <h4 className="text-6xl font-black tracking-tighter mb-2">{data?.temp}°C</h4>
        <p className="text-xl font-black uppercase tracking-widest opacity-80">{data?.condition}</p>
        <div className="mt-8 pt-8 border-t border-white/20 w-full flex justify-around">
           <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Humidity</p>
              <p className="text-lg font-black">{data?.humidity}%</p>
           </div>
           <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Local Node</p>
              <p className="text-lg font-black">{data?.city}</p>
           </div>
        </div>
      </div>
    </ModalWrapper>
  );

  if (type === 'history') return (
    <ModalWrapper title="Audit Trail" icon={HistoryIcon}>
      <div className="space-y-6">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2">Recent Repairs Added</h4>
        {data?.repairs.map((r: any) => (
          <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><HistoryIcon size={14}/></div>
              <span className="text-xs font-bold text-slate-700">{r.customerName} - {r.device}</span>
            </div>
            <span className="text-[9px] font-black text-slate-400">{r.date}</span>
          </div>
        ))}
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 pb-2 mt-8">Recent Sales Logs</h4>
        {data?.sales.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white text-emerald-600 rounded-lg flex items-center justify-center shadow-sm font-black text-[10px] tracking-tighter">£</div>
              <span className="text-xs font-bold text-slate-700">{s.productName} (x{s.qty})</span>
            </div>
            <span className="text-[9px] font-black text-emerald-600">{s.date}</span>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );

  if (type === 'packages') return (
    <ModalWrapper title="Active Entitlements" icon={Package}>
      <div className="p-8 bg-indigo-600 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Package size={150} /></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Active Protocol Tier</p>
        <h4 className="text-4xl font-black tracking-tight mt-2 uppercase">{db.plans.getById(user?.planId || 'starter').name}</h4>
        <div className="mt-8 flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Subscription Active & Verified</span>
        </div>
      </div>
      <button onClick={() => window.location.hash = '#/user/pricing'} className="w-full mt-6 py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
         Manage Subscription <ChevronRight size={14} />
      </button>
    </ModalWrapper>
  );

  if (type === 'profile') return (
    <ModalWrapper title="Registry Identity" icon={User}>
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center mb-6 border-4 border-slate-50 shadow-inner">
           <User size={48} className="text-slate-300" />
        </div>
        <h4 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name}</h4>
        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mt-1">{user?.subRole || user?.role}</p>
        
        <div className="w-full mt-10 space-y-4">
           <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Node</span>
              <span className="text-xs font-bold text-slate-800">{user?.email}</span>
           </div>
           <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol ID</span>
              <span className="text-xs font-mono font-bold text-slate-800">#{user?.id.slice(0, 8).toUpperCase()}</span>
           </div>
        </div>
      </div>
    </ModalWrapper>
  );

  return null;
};
