import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Fingerprint, RotateCcw, History, Star, Target, CheckCircle2, ChevronDown, AlertCircle,
  CalendarDays, TrendingUp, X, Play, Pause, FastForward, Moon, Sun, Volume2, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../../../components/common/BackButton';
import { useAuth } from '../../../context/AuthContext.tsx';
import { callBackendAPI } from '../../../api/apiClient.ts';
import { Loader2 } from 'lucide-react';

const DHIKR_OPTIONS = [
  { id: 'subhanallah', name: 'SubhanAllah', arabic: 'سُبْحَانَ ٱللَّٰهِ' },
  { id: 'alhamdulillah', name: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ' },
  { id: 'allahuakbar', name: 'Allahu Akbar', arabic: 'ٱللَّٰهُ أَكْبَرُ' },
  { id: 'custom', name: 'Custom Dhikr', arabic: 'ذِكْر' },
];

const TARGET_OPTIONS = [33, 100, 1000];

const DAROOD_LIBRARY = [
  {
    id: 'ibrahim',
    name: 'Darood Ibrahim',
    lines: [
      { ar: 'اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', ur: 'اے اللہ! محمد (صلی اللہ علیہ وسلم) پر رحمتیں نازل فرما' },
      { ar: 'وَعَىٰ آلِ مُحَمَّدٍ', ur: 'اور محمد (صلی اللہ علیہ وسلم) کی آل پر' },
      { ar: 'كَمَا صَلَّيْتَ عَلَىٰ إِبْرَاهِيمَ', ur: 'جیسے تو نے ابراہیم (علیہ السلام) پر رحمتیں نازل کیں' },
      { ar: 'وَعَلَىٰ آلِ إِبْرَاهِيمَ', ur: 'اور ابراہیم (علیہ السلام) کی آل پر' },
      { ar: 'إِنَّكَ حَمِيدٌ مَجِيدٌ', ur: 'بے شک تو تعریف والا اور بزرگی والا ہے' },
      { ar: 'اللَّهُمَّ بَارِكْ عَلَىٰ مُحَمَّدٍ', ur: 'اے اللہ! محمد (صلی اللہ علیہ وسلم) پر برکتیں نازل فرما' },
      { ar: 'وَعَلَىٰ آلِ مُحَمَّدٍ', ur: 'اور محمد (صلی اللہ علیہ وسلم) کی آل پر' },
      { ar: 'كَمَا بَارَكْتَ عَلَىٰ إِبْرَاهِيمَ', ur: 'جیسے تو نے ابراہیم (علیہ السلام) پر برکتیں نازل کیں' },
      { ar: 'وَعَلَىٰ آلِ إِبْرَاهِيمَ', ur: 'اور ابراہیم (علیہ السلام) کی آل پر' },
      { ar: 'إِنَّكَ حَمِيدٌ مَجِيدٌ', ur: 'بے شک تو تعریف والا اور بزرگی والا ہے' }
    ],
    audioUrl: 'https://archive.org/download/DaroodIbrahim/DaroodIbrahim.mp3'
  },
  {
    id: 'tanajjina',
    name: 'Darood-e-Tanajjina',
    lines: [
      { ar: 'اللَّهُمَّ صَلِّ عَلَىٰ سَيِّدِنَا مُحَمَّدٍ', ur: 'اے اللہ! ہمارے سردار محمد (صلی اللہ علیہ وسلم) پر رحمت بھیج' },
      { ar: 'صَلَاةً تُنَجِّينَا بِهَا مِنْ جَمِيعِ الْأَهْوَالِ وَالْآفَاتِ', ur: 'ایسی رحمت جس کے ذریعے تو ہمیں تمام خوف اور آفات سے نجات دے' }
    ],
    audioUrl: 'https://archive.org/download/darood-tanjeena/darood-tanjeena.mp3'
  },
  {
    id: 'short',
    name: 'Short Darood',
    lines: [
      { ar: 'صَلَّىٰ اللَّهُ عَلَيْهِ وَآلِهِ وَسَلَّمَ', ur: 'اللہ ان پر اور ان کی آل پر رحمت اور سلامتی بھیجے' }
    ],
    audioUrl: ''
  }
];

const DaroodRecitationHub: React.FC = () => {
  const [selectedDarood, setSelectedDarood] = useState(DAROOD_LIBRARY[0]);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1);
  const [currentLine, setCurrentLine] = useState(0);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let scrollInterval: any;
    if (isAutoScrolling && scrollContainerRef.current) {
      scrollInterval = setInterval(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop += scrollSpeed;
          if (scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight >= scrollContainerRef.current.scrollHeight) {
            scrollContainerRef.current.scrollTop = 0;
          }
        }
      }, 50);
    }
    return () => clearInterval(scrollInterval);
  }, [isAutoScrolling, scrollSpeed]);

  useEffect(() => {
    let highlightInterval: any;
    if (isPlayingAudio) {
      highlightInterval = setInterval(() => {
        setCurrentLine(prev => (prev + 1) % selectedDarood.lines.length);
      }, 3000);
    }
    return () => clearInterval(highlightInterval);
  }, [isPlayingAudio, selectedDarood]);

  const toggleAudio = () => setIsPlayingAudio(!isPlayingAudio);

  return (
    <div className={`rounded-[2rem] sm:rounded-[3.5rem] border transition-all duration-700 overflow-hidden ${isNightMode ? 'bg-slate-950 border-slate-800 text-white shadow-2xl shadow-indigo-500/10' : 'bg-white border-slate-100 text-slate-800 shadow-xl shadow-slate-200/50'}`}>
      <div className={`p-4 sm:p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${isNightMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-50 bg-slate-50/50'}`}>
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex bg-indigo-50 p-1.5 rounded-xl flex-1 lg:flex-none">
            <select
              value={selectedDarood.id}
              onChange={(e) => {
                const found = DAROOD_LIBRARY.find(d => d.id === e.target.value);
                if (found) { setSelectedDarood(found); setCurrentLine(0); }
              }}
              className="bg-transparent text-[9px] sm:text-[10px] font-black uppercase tracking-widest outline-none px-4 py-2 text-indigo-600 cursor-pointer w-full"
            >
              {DAROOD_LIBRARY.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            className={`p-3 rounded-xl transition-all shrink-0 ${isNightMode ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}
          >
            {isNightMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="flex items-center justify-between lg:justify-end gap-3">
          <div className="flex items-center bg-slate-200/50 p-1 rounded-xl gap-1 shrink-0">
            {[1, 2, 3].map(s => (
              <button
                key={s}
                onClick={() => setScrollSpeed(s)}
                className={`px-3 py-1.5 rounded-lg text-[8px] font-black transition-all ${scrollSpeed === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
              >
                S{s}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${isAutoScrolling ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}
          >
            {isAutoScrolling ? <Pause size={14} /> : <FastForward size={14} />}
            <span className="hidden sm:inline">{isAutoScrolling ? 'Stop' : 'Start'} Auto Scroll</span>
            <span className="sm:hidden">{isAutoScrolling ? 'Stop' : 'Auto'}</span>
          </button>
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-xl transition-all shrink-0 ${isPlayingAudio ? 'bg-emerald-600 text-white animate-pulse' : 'bg-white text-slate-400 border border-slate-200'}`}
          >
            <Volume2 size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="h-72 sm:h-96 overflow-y-auto p-6 sm:p-12 space-y-10 custom-scrollbar scroll-smooth text-center"
      >
        {selectedDarood.lines.map((line, idx) => (
          <div
            key={idx}
            className={`transition-all duration-700 transform ${currentLine === idx ? 'scale-105 sm:scale-110 opacity-100' : 'scale-95 opacity-20'}`}
          >
            <p dir="rtl" className={`text-3xl sm:text-5xl font-arabic leading-relaxed ${currentLine === idx ? (isNightMode ? 'text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]' : 'text-indigo-600') : ''}`}>
              {line.ar}
            </p>
            <p className={`text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-4 sm:mt-6 leading-relaxed ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {line.ur}
            </p>
            {currentLine === idx && <div className="w-10 sm:w-16 h-1 bg-indigo-500/30 mx-auto mt-6 rounded-full animate-pulse" />}
          </div>
        ))}
      </div>

      <div className={`p-4 text-center border-t ${isNightMode ? 'border-slate-800 bg-slate-900/30' : 'border-slate-50 bg-slate-50/30'}`}>
        <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-30">Authorized Spiritual Interface • V3.2 Protocol</p>
      </div>
    </div>
  );
};

export const TasbeehPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedDhikr, setSelectedDhikr] = useState(DHIKR_OPTIONS[0]);
  const [cycleTarget, setCycleTarget] = useState(33);
  const [showDhikrMenu, setShowDhikrMenu] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (user?.metadata?.tasbeehHistory) {
      setHistory(user.metadata.tasbeehHistory);
    }
  }, [user]);

  const saveHistoryToBackend = async (newHistory: any[]) => {
    if (!user) return;
    try {
      await callBackendAPI(`/users/${user._id || user.id}`, {
        metadata: { ...user.metadata, tasbeehHistory: newHistory }
      }, 'PUT');
    } catch (err) {
      console.error('History sync failed:', err);
    }
  };

  const progressPercent = useMemo(() => Math.min(100, (count / cycleTarget) * 100), [count, cycleTarget]);

  const performanceSummary = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const todayLogs = history.filter(h => h.fullDate === today);
    const dailyTotal = todayLogs.reduce((acc, curr) => acc + curr.count, 0);
    const completedCycles = todayLogs.filter(l => l.status === 'Completed').length;
    return { dailyTotal, completedCycles, weeklyEst: dailyTotal * 7 };
  }, [history]);

  const increment = () => setCount(prev => prev + 1);

  const handleResetRequest = () => {
    if (count > 0) setShowResetConfirm(true);
    else reset();
  };

  const reset = async () => {
    if (count > 0) {
      const entry = {
        count,
        date: new Date().toLocaleTimeString(),
        fullDate: new Date().toLocaleDateString(),
        dhikrName: selectedDhikr.name,
        target: cycleTarget,
        status: count >= cycleTarget ? 'Completed' : 'In Progress',
        timestamp: new Date().toISOString()
      };
      const updatedHistory = [entry, ...history].slice(0, 100);
      setHistory(updatedHistory);
      await saveHistoryToBackend(updatedHistory);
      await callBackendAPI('/activities', {
        actionType: 'Dhikr Cycle Completed',
        moduleName: 'Spiritual',
        refId: selectedDhikr.id,
        status: 'Success',
        details: entry
      });
    }
    setCount(0);
    setShowResetConfirm(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 sm:space-y-12 animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none truncate">Tasbeeh Ledger</h2>
            <p className="text-slate-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mt-2 truncate">Dhikr Performance Monitor</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowDhikrMenu(!showDhikrMenu)}
              className="w-full sm:w-auto px-6 py-3 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center justify-between sm:justify-start gap-4 hover:border-indigo-200 transition-all active:scale-95"
            >
              <div className="text-left">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Active Dhikr</p>
                <p className="text-xs font-black text-indigo-600 uppercase leading-none">{selectedDhikr.name}</p>
              </div>
              <ChevronDown size={14} className="text-slate-300" />
            </button>
            {showDhikrMenu && (
              <div className="absolute top-full left-0 right-0 sm:right-auto mt-2 sm:w-64 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] p-2 animate-in fade-in slide-in-from-top-2">
                {DHIKR_OPTIONS.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSelectedDhikr(opt); setShowDhikrMenu(false); }}
                    className={`w-full text-left p-4 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group ${selectedDhikr.id === opt.id ? 'bg-indigo-50 border border-indigo-100' : ''}`}
                  >
                    <span className="text-xs font-black uppercase text-slate-600 group-hover:text-indigo-600">{opt.name}</span>
                    <span className="text-sm font-arabic text-slate-400 group-hover:text-indigo-400">{opt.arabic}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-xl shadow-inner h-12">
            {TARGET_OPTIONS.map(t => (
              <button
                key={t}
                onClick={() => setCycleTarget(t)}
                className={`flex-1 sm:px-5 rounded-lg text-[10px] font-black uppercase transition-all ${cycleTarget === t ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DaroodRecitationHub />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[
          { label: "Today's Total", val: performanceSummary.dailyTotal, icon: CalendarDays, bg: 'bg-indigo-50', color: 'text-indigo-600' },
          { label: "Completed Cycles", val: performanceSummary.completedCycles, icon: CheckCircle2, bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: "Weekly Velocity (Est)", val: performanceSummary.weeklyEst, icon: TrendingUp, bg: 'bg-blue-50', color: 'text-blue-600', fullWidth: true }
        ].map((stat, i) => (
          <div key={i} className={`bg-white p-5 sm:p-7 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-5 sm:gap-6 hover:shadow-xl transition-all ${stat.fullWidth ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
            <div className={`w-12 h-12 sm:w-14 sm:h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-sm shrink-0`}>
              <stat.icon size={22} sm:size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
              <h4 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tighter truncate">{stat.val}</h4>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="flex flex-col items-center">
          <div
            className="w-72 h-72 sm:w-[26rem] sm:h-[26rem] rounded-full bg-white border-[12px] sm:border-[16px] border-slate-50 flex flex-col items-center justify-center shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] relative group cursor-pointer active:scale-95 transition-all select-none"
            onClick={increment}
          >
            <svg className="absolute inset-0 w-full h-full -rotate-90 scale-105">
              <circle
                cx="50%" cy="50%" r="46%"
                fill="transparent"
                stroke="#f8fafc"
                strokeWidth="16"
              />
              <circle
                cx="50%" cy="50%" r="46%"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="16"
                strokeDasharray="100 100"
                strokeDashoffset={100 - progressPercent}
                pathLength="100"
                className="text-indigo-600 transition-all duration-700 ease-out"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-4 sm:inset-6 rounded-full border-2 border-dashed border-indigo-50/50 group-hover:rotate-90 transition-transform duration-[2000ms]" />
            <p className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 sm:mb-6 z-10 leading-none">Cycle Sequence</p>
            <h3 className="text-8xl sm:text-[10rem] font-black text-slate-900 tracking-tighter leading-none z-10">{count}</h3>

            <p className="text-xl sm:text-3xl font-arabic text-indigo-400 mt-4 sm:mt-8 z-10 animate-fade-in">{selectedDhikr.arabic}</p>
            <Fingerprint size={40} sm:size={56} className="text-indigo-600 mt-6 sm:mt-10 opacity-30 group-hover:opacity-100 transition-opacity z-10" />

            <div className="absolute -bottom-4 sm:-bottom-5 px-5 sm:px-8 py-2.5 sm:py-3 bg-slate-900 text-white rounded-full text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl z-20 whitespace-nowrap">
              {progressPercent.toFixed(1)}% Cycle Completion
            </div>
          </div>

          <div className="mt-12 sm:mt-16 flex gap-4 w-full max-w-md">
            <button onClick={increment} className="flex-[3] py-8 bg-indigo-600 text-white rounded-[2rem] sm:rounded-[3rem] font-black uppercase tracking-[0.2em] text-[11px] sm:text-sm shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] hover:bg-indigo-700 active:scale-[0.98] transition-all flex flex-col items-center gap-1">
              <span>Next Increment</span>
              <span className="opacity-40 text-[9px]">+1 Protocol</span>
            </button>
            <button onClick={handleResetRequest} className="flex-1 py-8 bg-white border border-slate-200 text-slate-400 rounded-[2rem] sm:rounded-[3rem] font-black uppercase tracking-widest text-[9px] hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all flex flex-col items-center justify-center gap-2 active:scale-95">
              <RotateCcw size={18} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] sm:rounded-[4rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col h-full lg:min-h-[600px]">
          <div className="p-8 sm:p-10 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3"><History size={20} /></div>
              <div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-800 leading-none">Operational Ledger</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">Digital Sequence Record</p>
              </div>
            </div>
            <div className="hidden sm:flex bg-white px-4 py-2 rounded-xl border border-slate-100 font-bold text-[9px] text-slate-400 uppercase tracking-widest">Node Logs</div>
          </div>
          
          <div className="flex-1 p-6 sm:p-10 space-y-4 overflow-y-auto custom-scrollbar">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-10 italic">
                <Star size={64} className="mb-6 animate-pulse" />
                <p className="text-xs font-black uppercase tracking-[0.3em]">No Temporal Records</p>
              </div>
            ) : history.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-5 sm:p-7 bg-slate-50/50 rounded-3xl border border-slate-100 group hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 animate-in slide-in-from-right-8">
                <div className="flex items-center gap-5 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${h.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-indigo-600'}`}>
                    {h.status === 'Completed' ? <CheckCircle2 size={20} /> : <Target size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{h.dhikrName || 'General Dhikr'}</p>
                    <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                      <span className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">{h.date}</span>
                      <span className="w-1 h-1 bg-slate-200 rounded-full shrink-0" />
                      <span className={`text-[9px] font-black uppercase tracking-widest truncate ${h.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}`}>{h.status}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-6 shrink-0">
                  <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none group-hover:text-indigo-600 transition-colors">{h.count}</div>
                  <p className="text-[9px] font-black text-slate-300 uppercase mt-2 group-hover:text-slate-400 transition-colors">Target: {h.target || '--'}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 sm:p-8 border-t border-slate-50 bg-slate-50/30 text-center">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] animate-pulse">Synchronized with Central Registry Node</p>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-b-[12px] border-b-rose-600">
            <div className="p-8 sm:p-10 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 rotate-12">
                  <RotateCcw size={24} sm:size={28} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-widest leading-none">Confirm Reset</h3>
                  <p className="text-[10px] font-bold text-rose-100 uppercase mt-2 tracking-widest opacity-70">Manual Termination</p>
                </div>
              </div>
              <button onClick={() => setShowResetConfirm(false)} className="p-3 hover:bg-white/20 rounded-full transition-all active:scale-90">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-10 sm:p-12 space-y-10">
              <div className="flex items-start gap-5 p-7 bg-rose-50 rounded-[2rem] border border-rose-100 shadow-inner">
                <AlertCircle size={28} className="text-rose-600 shrink-0 mt-1" />
                <p className="text-sm font-bold text-rose-900 uppercase tracking-tight leading-relaxed">
                  System Warning: Authorizing this protocol will clear current sequence count of <span className="font-black underline decoration-2">{count}</span>. All progress will be committed to temporal logs.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <button
                  onClick={reset}
                  className="w-full py-6 sm:py-7 bg-rose-600 text-white rounded-[1.5rem] sm:rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] sm:text-xs shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-[0.98]"
                >
                  Commit & Reset Ledger
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                >
                  Maintain Current Sequence
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
