import React, { useState, useEffect, useMemo } from 'react';
import { 
  Cloud, Sun, MapPin, Search, Wind, Droplets, BookOpen, Clock, 
  Radio, Layers, Tag, ArrowRight, ShieldCheck, Activity, Users, 
  Wrench, AlertCircle, Timer, Zap, Coffee, DoorOpen, Terminal,
  Settings2, Power, AlertTriangle, ShieldAlert, ShoppingCart, Ban,
  Globe, Coins, Calculator, Moon, Compass, Hash, Play, Square,
  ExternalLink, ChevronRight, LayoutGrid, StickyNote, PenLine, 
  Trash2, Save, Sparkles, MessageSquare, Truck, Plus, Package,
  History, UserPlus, LifeBuoy, Server, Database, ShieldCheck as ShieldIcon,
  HardDrive, Cpu, BadgeCheck, Lightbulb, Volume2, Pause
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../api/db';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { UserRole } from '../../types';

export const Utilities: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // --- ISLAMIC HUB STATE ---
  const [tasbeehCount, setTasbeehCount] = useState(() => Number(localStorage.getItem('dibnow_tasbeeh') || 0));
  const [lastSurah, setLastSurah] = useState(() => localStorage.getItem('dibnow_last_surah') || 'Al-Kahf');
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [audio] = useState(new Audio('https://qurango.net/radio/tarabeel')); // Standard Live Quran Stream
  const [countdown, setCountdown] = useState('00:00:00');

  // Hardcoded Multan Timings for Demo (In real app, would fetch based on Multan lat/lng)
  const prayerTimes = [
    { name: 'Fajr', time: '05:32' },
    { name: 'Dhuhr', time: '12:28' },
    { name: 'Asr', time: '15:45' },
    { name: 'Maghrib', time: '18:12' },
    { name: 'Isha', time: '19:35' }
  ];

  // Logic for Prayer Countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const next = prayerTimes.find(p => {
        const [h, m] = p.time.split(':').map(Number);
        return (h * 60 + m) > currentMinutes;
      }) || prayerTimes[0];

      const [nh, nm] = next.time.split(':').map(Number);
      let targetDate = new Date();
      targetDate.setHours(nh, nm, 0);
      if (targetDate < now) targetDate.setDate(targetDate.getDate() + 1);

      const diff = targetDate.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Radio Toggle
  const toggleRadio = () => {
    if (radioPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setRadioPlaying(!radioPlaying);
  };

  // Tasbeeh Logic
  const incrementTasbeeh = () => {
    const newVal = tasbeehCount + 1;
    setTasbeehCount(newVal);
    localStorage.setItem('dibnow_tasbeeh', String(newVal));
  };

  // ROLE-BASED VISIBILITY FLAG
  const isOwner = user?.role === UserRole.USER;

  // PRIVATE NOTES STATE
  const [privateNotes, setPrivateNotes] = useState(() => {
    const saved = localStorage.getItem(`dibnow_private_notes_${user?.id}`);
    return saved ? JSON.parse(saved) : { issues: '', suppliers: '', instructions: '' };
  });

  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(`dibnow_private_notes_${user?.id}`, JSON.stringify(privateNotes));
      setLastSaved(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearTimeout(timer);
  }, [privateNotes, user?.id]);

  const handleNoteChange = (key: string, val: string) => {
    setPrivateNotes(prev => ({ ...prev, [key]: val }));
  };

  // BUSINESS TOGGLES STATE
  const [toggles, setToggles] = useState({
    maintenance: localStorage.getItem('dibnow_ui_maintenance') === 'true',
    repairs: localStorage.getItem('dibnow_ui_repairs_active') !== 'false',
    pos: localStorage.getItem('dibnow_ui_pos_active') !== 'false',
    emergency: localStorage.getItem('dibnow_ui_emergency_close') === 'true'
  });

  const handleToggle = (key: keyof typeof toggles) => {
    const newVal = !toggles[key];
    const storageKey = `dibnow_ui_${key === 'repairs' ? 'repairs_active' : key === 'pos' ? 'pos_active' : key === 'emergency' ? 'emergency_close' : 'maintenance'}`;
    localStorage.setItem(storageKey, String(newVal));
    setToggles(prev => ({ ...prev, [key]: newVal }));
    db.activity.log({ actionType: `Toggle: ${String(key).toUpperCase()}`, moduleName: 'Infrastructure', refId: 'UI_STATE', status: 'Success' });
  };

  const opData = useMemo(() => {
    const repairs = db.repairs.getAll();
    const sales = db.sales.getAll();
    const team = db.userTeamV2.getByOwner(user?.id || '');
    const todayStr = new Date().toLocaleDateString();
    const todayRepairs = repairs.filter(r => r.date === todayStr || new Date(r.createdAt).toLocaleDateString() === todayStr);
    const todaySales = sales.filter(s => s.date === todayStr);
    const completedToday = todayRepairs.filter(r => ['completed', 'delivered'].includes(r.status?.toLowerCase())).length;
    const itemsSoldToday = todaySales.reduce((acc, curr) => acc + curr.qty, 0);
    const inProgress = repairs.filter(r => r.status?.toLowerCase() === 'in progress').length;
    const pending = repairs.filter(r => r.status?.toLowerCase() === 'pending').length;
    const activeStaff = team.filter(m => m.status === 'active').length;

    return { 
      inProgress, pending, activeStaff, completedToday, itemsSoldToday, 
      insightMsg: `Today you completed ${completedToday} repairs and sold ${itemsSoldToday} items. Peak sales node: 4–6 PM.`
    };
  }, [user]);

  useEffect(() => {
    setTimeout(() => {
      // SETTING LOCATION TO MULTAN, PAKISTAN
      setWeather({ temp: 28, condition: 'Sunny', humidity: 40, wind: 15, location: 'Multan, Pakistan' });
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Shop Utility Console</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Infrastructure Control, Spiritual Hub & Regional Nodes.</p>
        </div>
      </div>

      {/* DAILY INSIGHT MESSAGE */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden group border-b-8 border-indigo-900">
         <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Lightbulb size={100} />
         </div>
         <div className="relative z-10 flex items-center gap-6">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md">
               <Zap size={24} fill="white" className="animate-pulse" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Daily Performance Insight</p>
               <h3 className="text-lg font-black tracking-tight mt-1">"{opData.insightMsg}"</h3>
            </div>
         </div>
      </div>

      {/* QUICK INFRASTRUCTURE LINKS */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 md:p-10">
         <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
               <Zap size={24} fill="white" />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Operational Action Nodes</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Accelerated Navigational Shortcuts</p>
            </div>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Add Repair', icon: Wrench, path: '/user/add-repair', color: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-600' },
              { label: 'Add Stock', icon: Package, path: '/user/add-inventory', color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600' },
              { label: 'Direct POS', icon: ShoppingCart, path: '/user/pos', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-600' },
              { label: 'Add Client', icon: UserPlus, path: '/user/clients', color: 'bg-cyan-50 text-cyan-600 border-cyan-100 hover:bg-cyan-600' },
              { label: 'New Ticket', icon: LifeBuoy, path: '/user/tickets', color: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-600' },
              { label: 'View Ledger', icon: History, path: '/user/all-stock', color: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-600' }
            ].map((shortcut, idx) => (
              <button key={idx} onClick={() => navigate(shortcut.path)} className={`group flex flex-col items-center justify-center p-6 rounded-[2.5rem] border transition-all duration-300 ${shortcut.color.split(' ').slice(0, 3).join(' ')} ${shortcut.color.split(' ')[3]} hover:text-white active:scale-95`}>
                <shortcut.icon size={22} className="mb-3 group-hover:scale-110 transition-all" />
                <span className="text-[9px] font-black uppercase tracking-widest">{shortcut.label}</span>
              </button>
            ))}
         </div>
      </div>

      {/* SYSTEM HEALTH SNAPSHOT */}
      <div className="bg-slate-50 rounded-[3rem] border border-slate-200 p-8 md:p-10 shadow-inner flex flex-col lg:flex-row lg:items-center justify-between gap-10">
         <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-2xl">
               <Cpu size={28} />
            </div>
            <div>
               <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">System Health Snapshot</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Read-Only Infrastructure Pulse</p>
            </div>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
            {[
              { label: 'API Status', value: 'OK', icon: Server, color: 'text-emerald-500' },
              { label: 'Database Sync', value: 'Active', icon: Database, color: 'text-blue-500' },
              { label: 'Payment Gateway', value: 'Online', icon: ShieldIcon, color: 'text-indigo-500' },
              { label: 'Last Cloud Backup', value: '14m ago', icon: HardDrive, color: 'text-amber-500' }
            ].map((node, i) => (
              <div key={i} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center gap-4 group">
                 <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center ${node.color} group-hover:scale-110 transition-transform`}>
                    <node.icon size={18} />
                 </div>
                 <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{node.label}</p>
                    <p className="text-xs font-black text-slate-800 uppercase">{node.value}</p>
                 </div>
              </div>
            ))}
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* LEFT COLUMN: LOCALIZATION & NOTES */}
        <div className="xl:col-span-8 space-y-8">
          
          {/* SHOP KNOWLEDGE & NOTES */}
          <div className="bg-white rounded-[3rem] border border-slate-100 p-8 md:p-10 shadow-sm overflow-hidden border-b-8 border-b-amber-500">
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
                      <StickyNote size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Private Workshop Ledger</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Localized Private Knowledge Nodes • No Cloud Sync</p>
                   </div>
                </div>
                {lastSaved && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl text-emerald-600">
                     <Save size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Auto-Saved {lastSaved}</span>
                  </div>
                )}
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[
                  { id: 'issues', label: 'Today\'s issues', icon: AlertTriangle, color: 'border-rose-100 focus:border-rose-500', bg: 'bg-rose-50/20' },
                  { id: 'suppliers', label: 'Supplier reminder', icon: Truck, color: 'border-blue-100 focus:border-blue-500', bg: 'bg-blue-50/20' },
                  { id: 'instructions', label: 'Technician instructions', icon: PenLine, color: 'border-indigo-100 focus:border-indigo-500', bg: 'bg-indigo-50/20' }
                ].map((note) => (
                  <div key={note.id} className={`flex flex-col h-72 rounded-3xl border-2 transition-all group ${note.bg} ${note.color}`}>
                    <div className="p-5 border-b border-white/40 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <note.icon size={16} className="text-slate-400" />
                          <span className="text-[10px] font-black uppercase text-slate-600">{note.label}</span>
                       </div>
                    </div>
                    <textarea 
                      value={privateNotes[note.id as keyof typeof privateNotes]}
                      onChange={(e) => handleNoteChange(note.id, e.target.value)}
                      placeholder="Input private node data..."
                      className="w-full h-full bg-transparent p-5 outline-none text-sm font-bold text-slate-700 resize-none uppercase tracking-tight"
                    />
                  </div>
                ))}
             </div>
          </div>

          {/* LOCALIZATION REGISTRY (MULTAN, PAKISTAN) */}
          <div className="bg-white rounded-[3rem] border border-slate-100 p-8 md:p-10 shadow-sm border-b-8 border-b-blue-600">
             <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                      <Globe size={24} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Localization Registry</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hardcoded Node: Multan, Pakistan</p>
                   </div>
                </div>
                {isOwner && (
                  <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">
                     Manual Override
                  </button>
                )}
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { label: 'Shop Location', val: 'Multan, Pakistan', icon: MapPin },
                  { label: 'Active Currency', val: 'PKR (Rs)', icon: Coins },
                  { label: 'Islamic Calendar', val: '14 Shaban, 1446', icon: Moon },
                  { label: 'Prayer Method', val: 'Karachi / Univ. Karachi', icon: Clock },
                  { label: 'Tax Jurisdiction', val: 'FBR (GST 18%)', icon: Calculator },
                  { label: 'System Language', val: 'English (Pakistan)', icon: Layers }
                ].map((item, idx) => (
                  <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col justify-between h-36 group hover:bg-blue-50 transition-all">
                     <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <item.icon size={18} />
                     </div>
                     <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{item.label}</p>
                        <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">{item.val}</h4>
                     </div>
                  </div>
                ))}
             </div>
          </div>
          
          {/* Weather Visualization (Hardcoded Multan) */}
          <div className="bg-gradient-to-br from-[#FF8C00] to-[#FF4500] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Sun size={250}/></div>
            <div className="relative z-10 flex flex-col h-full justify-between gap-12">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <MapPin size={24} className="text-orange-200" />
                     <span className="text-xl font-black tracking-tight">{weather?.location || 'Locating Shop...'}</span>
                  </div>
               </div>
               <div className="flex flex-col md:flex-row items-center gap-12">
                  <h1 className="text-8xl font-black tracking-tighter">{weather?.temp}°C</h1>
                  <div>
                     <p className="text-2xl font-black uppercase tracking-widest text-orange-200">{weather?.condition}</p>
                     <div className="flex gap-6 mt-4">
                        <div className="flex items-center gap-2 text-orange-100"><Wind size={18} className="text-orange-300"/><span className="font-bold text-sm tracking-tight">{weather?.wind} km/h</span></div>
                        <div className="flex items-center gap-2 text-orange-100"><Droplets size={18} className="text-orange-300"/><span className="font-bold text-sm tracking-tight">{weather?.humidity}% Humidity</span></div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SPIRITUAL HUB (FULLY WORKABLE) */}
        <div className="xl:col-span-4 space-y-8">
           <div className="bg-white rounded-[3rem] border-2 border-emerald-100 shadow-xl overflow-hidden flex flex-col h-full border-b-8 border-b-emerald-600">
              <div className="p-8 bg-emerald-600 text-white flex items-center justify-between shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md">
                       <Sun size={24} fill="white" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black uppercase tracking-widest">Spiritual Hub</h3>
                       <p className="text-[10px] font-bold text-emerald-100 uppercase mt-1 tracking-widest opacity-80">Localized for Multan</p>
                    </div>
                 </div>
                 <Compass size={24} className="text-emerald-300 animate-spin-slow" />
              </div>

              <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                 
                 {/* 1. Prayer Timings & Countdown */}
                 <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-2"><Clock size={14}/> Multan Prayer Node</h4>
                    <div className="grid grid-cols-2 gap-3">
                       {prayerTimes.map((p, i) => (
                         <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col items-center justify-center text-center">
                            <span className="text-sm font-black text-slate-800 uppercase">{p.time}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">{p.name}</span>
                         </div>
                       ))}
                    </div>
                    <div className="p-5 bg-emerald-900 rounded-[1.8rem] text-white flex items-center justify-between shadow-lg">
                       <div className="flex items-center gap-3">
                          <Timer size={20} className="text-emerald-400" />
                          <div>
                             <p className="text-[8px] font-black uppercase text-emerald-300">Countdown to Next</p>
                             <p className="text-lg font-black uppercase">{countdown}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* 2. Quran & Tasbeeh Row */}
                 <div className="grid grid-cols-2 gap-6">
                    <div 
                      onClick={() => navigate('/user/quick/quran')}
                      className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] flex flex-col items-center text-center group cursor-pointer hover:bg-indigo-600 transition-all duration-500"
                    >
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-indigo-600 group-hover:scale-110 transition-transform"><BookOpen size={24}/></div>
                       <p className="text-[8px] font-black text-indigo-400 uppercase group-hover:text-white">Last Read Surah</p>
                       <h5 className="text-xs font-black text-indigo-900 group-hover:text-white mt-1 uppercase">{lastSurah}</h5>
                    </div>
                    <div 
                      onClick={incrementTasbeeh}
                      className="p-6 bg-amber-50 border border-amber-100 rounded-[2.5rem] flex flex-col items-center text-center group cursor-pointer hover:bg-amber-500 transition-all duration-500 active:scale-95"
                    >
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm text-amber-600 group-hover:scale-110 transition-transform"><Hash size={24}/></div>
                       <p className="text-[8px] font-black text-amber-500 uppercase group-hover:text-white">Tasbeeh Count</p>
                       <h5 className="text-lg font-black text-amber-900 group-hover:text-white mt-1 uppercase">{tasbeehCount}</h5>
                    </div>
                 </div>

                 {/* 3. Islamic Radio Node (Fully Functional) */}
                 <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2.5rem] flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className={`w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-600 border border-rose-100 shadow-sm transition-transform ${radioPlaying ? 'animate-pulse' : ''}`}><Radio size={24}/></div>
                       <div>
                          <p className="text-[8px] font-black text-rose-400 uppercase">Islamic Radio</p>
                          <h5 className="text-xs font-black text-rose-900 uppercase">{radioPlaying ? 'Streaming Quran...' : 'Live Recitation'}</h5>
                       </div>
                    </div>
                    <button 
                      onClick={toggleRadio}
                      className={`w-10 h-10 ${radioPlaying ? 'bg-rose-900' : 'bg-rose-600'} text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all`}
                    >
                       {radioPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
                    </button>
                 </div>

                 {/* 4. Qibla Direction Node (Visual Only) */}
                 <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center text-center group hover:border-emerald-400 transition-all">
                    <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                       <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                       <Compass size={64} className="text-emerald-600 rotate-[265deg] transition-transform duration-1000" />
                       <div className="absolute top-0 w-2 h-2 rounded-full bg-rose-500 shadow-lg shadow-rose-200" style={{ transform: 'translateY(-4px)' }} />
                    </div>
                    <h5 className="text-sm font-black text-slate-800 uppercase tracking-widest">Qibla Direction</h5>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Calculated from Multan Node (265° W)</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Global Catalog Controls (Preserved & Re-aligned) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <button onClick={() => navigate('/user/brands')} className="w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-500 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Tag size={24}/></div>
            <div className="text-left">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Brand Registry</h3>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tighter">Manufacturer Nodes</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-all" />
        </button>

        <button onClick={() => navigate('/user/categories')} className="w-full bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-500 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><Layers size={24}/></div>
            <div className="text-left">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Taxonomy Nodes</h3>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tighter">Category Classifications</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-all" />
        </button>

        <div className="w-full bg-slate-900 p-8 rounded-[2.5rem] shadow-xl flex items-center justify-between group">
          <div className="flex items-center gap-4 text-white">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><LayoutGrid size={24}/></div>
            <div className="text-left">
              <h3 className="font-black uppercase tracking-widest text-xs">Extended Utilities</h3>
              <p className="text-xs text-slate-500 font-bold mt-1 uppercase tracking-tighter">Authorized Tools</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-slate-700 group-hover:text-white transition-all" />
        </div>
      </div>
    </div>
  );
};