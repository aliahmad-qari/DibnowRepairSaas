
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Fingerprint, RotateCcw, ChevronLeft, History, Star, Target, CheckCircle2, ChevronDown, AlertCircle, CalendarDays, TrendingUp, X, Heart, Play, Pause, FastForward, Moon, Sun, Volume2, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DHIKR_OPTIONS = [
  { id: 'subhanallah', name: 'SubhanAllah', arabic: 'سُبْحَانَ ٱللَّٰهِ' },
  { id: 'alhamdulillah', name: 'Alhamdulillah', arabic: 'ٱلْحَمْدُ لِلَّٰهِ' },
  { id: 'allahuakbar', name: 'Allahu Akbar', arabic: 'ٱللَّٰهُ أَكْبَرُ' },
  { id: 'custom', name: 'Custom Dhikr', arabic: 'ذِكْر' },
];

const TARGET_OPTIONS = [33, 100, 1000];

// --- NEW ADDITIVE ASSETS: DAROOD DATA ---
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

// --- NEW ADDITIVE COMPONENT: DaroodRecitationHub ---
const DaroodRecitationHub: React.FC = () => {
  const [selectedDarood, setSelectedDarood] = useState(DAROOD_LIBRARY[0]);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(1); // 1: Slow, 2: Med, 3: Fast
  const [currentLine, setCurrentLine] = useState(0);
  const [isNightMode, setIsNightMode] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll Effect
  useEffect(() => {
    let scrollInterval: any;
    if (isAutoScrolling && scrollContainerRef.current) {
      scrollInterval = setInterval(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop += scrollSpeed;
          // Loop scroll if reached bottom
          if (scrollContainerRef.current.scrollTop + scrollContainerRef.current.clientHeight >= scrollContainerRef.current.scrollHeight) {
            scrollContainerRef.current.scrollTop = 0;
          }
        }
      }, 50);
    }
    return () => clearInterval(scrollInterval);
  }, [isAutoScrolling, scrollSpeed]);

  // Audio Sync Simulation (Line highlighting)
  useEffect(() => {
    let highlightInterval: any;
    if (isPlayingAudio) {
      highlightInterval = setInterval(() => {
        setCurrentLine(prev => (prev + 1) % selectedDarood.lines.length);
      }, 3000); // Simulated 3s per line
    }
    return () => clearInterval(highlightInterval);
  }, [isPlayingAudio, selectedDarood]);

  const toggleAudio = () => {
    setIsPlayingAudio(!isPlayingAudio);
    // In production, this would control actual HTML5 Audio
  };

  return (
    <div className={`rounded-[3rem] border transition-all duration-700 overflow-hidden ${isNightMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800 shadow-sm'}`}>
      {/* Tool Bar */}
      <div className={`p-6 border-b flex flex-wrap items-center justify-between gap-4 ${isNightMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-50 bg-slate-50/50'}`}>
        <div className="flex items-center gap-3">
          <div className="flex bg-indigo-50 p-1 rounded-xl">
             <select 
               value={selectedDarood.id} 
               onChange={(e) => {
                 const found = DAROOD_LIBRARY.find(d => d.id === e.target.value);
                 if (found) { setSelectedDarood(found); setCurrentLine(0); }
               }}
               className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none px-4 py-2 text-indigo-600 cursor-pointer"
             >
               {DAROOD_LIBRARY.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
             </select>
          </div>
          <button 
            onClick={() => setIsNightMode(!isNightMode)}
            className={`p-3 rounded-xl transition-all ${isNightMode ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}
          >
            {isNightMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-200/50 p-1 rounded-xl gap-1">
             {[1, 2, 3].map(s => (
               <button 
                 key={s} 
                 onClick={() => setScrollSpeed(s)}
                 className={`px-3 py-1.5 rounded-lg text-[8px] font-black transition-all ${scrollSpeed === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
               >
                 S{s}
               </button>
             ))}
          </div>
          <button 
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAutoScrolling ? 'bg-rose-600 text-white' : 'bg-indigo-600 text-white'}`}
          >
            {isAutoScrolling ? <Pause size={14} /> : <FastForward size={14} />}
            {isAutoScrolling ? 'Stop Auto' : 'Auto Scroll'}
          </button>
          <button 
            onClick={toggleAudio}
            className={`p-3 rounded-xl transition-all ${isPlayingAudio ? 'bg-emerald-600 text-white animate-pulse' : 'bg-white text-slate-400 border border-slate-200'}`}
          >
            <Volume2 size={16} />
          </button>
        </div>
      </div>

      {/* Reading Area */}
      <div 
        ref={scrollContainerRef}
        className="h-80 overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar scroll-smooth text-center"
      >
        {selectedDarood.lines.map((line, idx) => (
          <div 
            key={idx} 
            className={`transition-all duration-500 transform ${currentLine === idx ? 'scale-110 opacity-100' : 'scale-95 opacity-30'}`}
          >
            <p className={`text-3xl md:text-4xl font-arabic leading-relaxed ${currentLine === idx ? (isNightMode ? 'text-indigo-400' : 'text-indigo-600') : ''}`}>
              {line.ar}
            </p>
            <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 ${isNightMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {line.ur}
            </p>
            {currentLine === idx && <div className="w-12 h-1 bg-indigo-500/30 mx-auto mt-4 rounded-full" />}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className={`p-4 text-center border-t ${isNightMode ? 'border-slate-800 bg-slate-900/30' : 'border-slate-50 bg-slate-50/30'}`}>
         <p className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40">Spiritual Reading Node • Hand-free Protocol</p>
      </div>
    </div>
  );
};

export const TasbeehPage: React.FC = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [history, setHistory] = useState<any[]>([]);

  // --- NEW ADDITIVE STATE: DHIKR INTELLIGENCE ---
  const [selectedDhikr, setSelectedDhikr] = useState(DHIKR_OPTIONS[0]);
  const [cycleTarget, setCycleTarget] = useState(33);
  const [showDhikrMenu, setShowDhikrMenu] = useState(false);
  
  // --- NEW ADDITIVE STATE: UX SAFETY & ANALYTICS ---
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // --- NEW ADDITIVE LOGIC: PROGRESS CALCULATION ---
  const progressPercent = useMemo(() => {
    return Math.min(100, (count / cycleTarget) * 100);
  }, [count, cycleTarget]);

  // --- NEW ADDITIVE LOGIC: TEMPORAL SUMMARY ---
  const performanceSummary = useMemo(() => {
    const today = new Date().toLocaleDateString();
    const todayLogs = history.filter(h => h.date.startsWith(new Date().getHours().toString()) || h.fullDate === today); // Simplified matching
    
    const dailyTotal = todayLogs.reduce((acc, curr) => acc + curr.count, 0);
    const completedCycles = todayLogs.filter(l => l.status === 'Completed').length;
    
    return {
      dailyTotal,
      completedCycles,
      weeklyEst: dailyTotal * 7 // Simple projection as requested
    };
  }, [history]);

  const increment = () => {
    setCount(prev => prev + 1);
  };

  const handleResetRequest = () => {
    if (count > 0) {
      setShowResetConfirm(true);
    } else {
      reset();
    }
  };

  const reset = () => {
    if(count > 0) {
      // ENHANCED LEDGER ENTRY: Appending Dhikr metadata without breaking existing history structure
      setHistory([{ 
        count, 
        date: new Date().toLocaleTimeString(),
        fullDate: new Date().toLocaleDateString(),
        dhikrName: selectedDhikr.name,
        target: cycleTarget,
        status: count >= cycleTarget ? 'Completed' : 'In Progress'
      }, ...history].slice(0, 50));
    }
    setCount(0);
    setShowResetConfirm(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 shadow-sm transition-all"><ChevronLeft /></button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Tasbeeh Ledger</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Dhikr Performance Monitor</p>
          </div>
        </div>

        {/* --- NEW ADDITIVE UI: DHIKR & TARGET SELECTORS --- */}
        <div className="flex items-center gap-3">
           <div className="relative">
              <button 
                onClick={() => setShowDhikrMenu(!showDhikrMenu)}
                className="px-6 py-3 bg-white border border-slate-100 rounded-xl shadow-sm flex items-center gap-3 hover:border-indigo-200 transition-all"
              >
                <div className="text-left">
                   <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Active Dhikr</p>
                   <p className="text-[10px] font-black text-indigo-600 uppercase">{selectedDhikr.name}</p>
                </div>
                <ChevronDown size={14} className="text-slate-300" />
              </button>
              {showDhikrMenu && (
                <div className="absolute top-full right-0 md:left-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                   {DHIKR_OPTIONS.map(opt => (
                     <button 
                       key={opt.id}
                       onClick={() => { setSelectedDhikr(opt); setShowDhikrMenu(false); }}
                       className={`w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-between group ${selectedDhikr.id === opt.id ? 'bg-indigo-50' : ''}`}
                     >
                        <span className="text-[10px] font-black uppercase text-slate-600 group-hover:text-indigo-600">{opt.name}</span>
                        <span className="text-xs font-arabic text-slate-400">{opt.arabic}</span>
                     </button>
                   ))}
                </div>
              )}
           </div>

           <div className="flex bg-slate-100 p-1 rounded-xl">
              {TARGET_OPTIONS.map(t => (
                <button 
                  key={t}
                  onClick={() => setCycleTarget(t)}
                  className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${cycleTarget === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {t}
                </button>
              ))}
           </div>
        </div>
      </div>

      {/* --- NEW ADDITIVE: DAROOD HUB --- */}
      <DaroodRecitationHub />

      {/* --- NEW ADDITIVE UI: PERFORMANCE SUMMARY PANEL --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
           <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
              <CalendarDays size={20} />
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Today's Total</p>
              <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{performanceSummary.dailyTotal}</h4>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
              <CheckCircle2 size={20} />
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Completed Cycles</p>
              <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{performanceSummary.completedCycles}</h4>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <TrendingUp size={20} />
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Weekly Velocity (Est)</p>
              <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{performanceSummary.weeklyEst}</h4>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col items-center">
          <div 
            className="w-80 h-80 rounded-full bg-white border-[12px] border-slate-50 flex flex-col items-center justify-center shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] relative group cursor-pointer active:scale-95 transition-all" 
            onClick={increment}
          >
             {/* --- NEW ADDITIVE UI: CIRCULAR PROGRESS --- */}
             <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="160" cy="160" r="148"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="12"
                />
                <circle
                  cx="160" cy="160" r="148"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={2 * Math.PI * 148}
                  strokeDashoffset={2 * Math.PI * 148 * (1 - progressPercent / 100)}
                  className="text-indigo-600 transition-all duration-500 ease-out"
                  strokeLinecap="round"
                />
             </svg>

             <div className="absolute inset-4 rounded-full border-2 border-dashed border-indigo-50 group-hover:rotate-45 transition-transform duration-1000" />
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 z-10">Current Cycle</p>
             <h3 className="text-8xl font-black text-slate-900 tracking-tighter leading-none z-10">{count}</h3>
             
             {/* Arabic Secondary Label */}
             <p className="text-xl font-arabic text-indigo-400 mt-2 z-10">{selectedDhikr.arabic}</p>
             <Fingerprint size={48} className="text-indigo-600 mt-6 opacity-40 group-hover:opacity-100 transition-opacity z-10" />
             
             {/* Progress Percentage Badge */}
             <div className="absolute -bottom-4 px-4 py-2 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">
                {progressPercent.toFixed(0)}% Authorized
             </div>
          </div>
          
          <div className="mt-12 flex gap-4 w-full max-w-sm">
            <button onClick={increment} className="flex-[2] py-8 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">Manual Increment</button>
            <button onClick={handleResetRequest} className="flex-1 py-8 bg-white border border-slate-100 text-slate-400 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2">
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full min-h-[450px]">
           <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg"><History size={18} /></div>
                 <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Operational Dhikr Ledger</h4>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase bg-white px-3 py-1 rounded-lg border border-slate-200">Chronological Logs</span>
           </div>
           <div className="flex-1 p-8 space-y-4 overflow-y-auto custom-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 italic">
                   <Star size={40} className="mb-4" />
                   <p className="text-[10px] font-black uppercase">No Data Logs Found</p>
                </div>
              ) : history.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-50 transition-all animate-in slide-in-from-right-4">
                   <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xs shadow-sm ${h.status === 'Completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-indigo-600'}`}>
                        {h.status === 'Completed' ? <CheckCircle2 size={16} /> : <Target size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{h.dhikrName || 'General Dhikr'}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-2">
                           {h.date} • <span className={h.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'}>{h.status}</span>
                        </p>
                      </div>
                   </div>
                   <div className="text-right">
                      <div className="text-xl font-black text-slate-900 leading-none">{h.count}</div>
                      <p className="text-[8px] font-black text-slate-300 uppercase mt-1">Goal: {h.target || '--'}</p>
                   </div>
                </div>
              ))}
           </div>
           <div className="p-6 border-t border-slate-50 text-center">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Synchronized with Digital Registry Node</p>
           </div>
        </div>
      </div>

      {/* --- NEW ADDITIVE UI: RESET CONFIRMATION MODAL --- */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-rose-100">
              <div className="p-8 bg-rose-600 text-white flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                       <RotateCcw size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-widest leading-none">Confirm Reset</h3>
                      <p className="text-[10px] font-bold text-rose-100 uppercase mt-2 tracking-widest opacity-80">Manual Cycle Termination</p>
                    </div>
                 </div>
                 <button onClick={() => setShowResetConfirm(false)} className="p-2 hover:bg-white/20 rounded-full transition-all">
                    <X size={20} />
                 </button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="flex items-start gap-4 p-6 bg-rose-50 rounded-2xl border border-rose-100">
                    <AlertCircle size={24} className="text-rose-600 shrink-0" />
                    <p className="text-sm font-bold text-rose-900 uppercase tracking-tighter leading-relaxed">
                       Caution: Authorizing this protocol will clear the current cycle count of <span className="font-black underline">{count}</span>. All current progress will be archived to the dhikr ledger.
                    </p>
                 </div>
                 <div className="grid grid-cols-1 gap-3">
                    <button 
                      onClick={reset}
                      className="w-full py-5 bg-rose-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-rose-700 transition-all active:scale-95"
                    >
                       Archive & Reset Cycle
                    </button>
                    <button 
                      onClick={() => setShowResetConfirm(false)}
                      className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors"
                    >
                       Continue Current Dhikr
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
