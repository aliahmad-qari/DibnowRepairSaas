
import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../../../components/common/BackButton';

export const QuranPage: React.FC = () => {
  const navigate = useNavigate();
  const [surahs, setSurahs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/surah')
      .then(res => res.json())
      .then(json => {
        setSurahs(json.data);
        setLoading(false);
      })
      .catch(err => console.error("Error fetching Surahs:", err));
  }, []);

  const filtered = surahs.filter(s => 
    s.englishName.toLowerCase().includes(query.toLowerCase()) || 
    s.name.includes(query) ||
    s.number.toString().includes(query)
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20 px-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-4">
        <div className="flex items-center gap-4">
          <BackButton />
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none truncate">Quran Explorer</h2>
            <p className="text-slate-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mt-1 truncate">Digital Scriptural Preservation</p>
          </div>
        </div>
        <div className="relative flex-1 w-full lg:max-w-md group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search Surah Name or Number..." 
            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-xl sm:rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 font-bold text-sm shadow-sm transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="h-64 sm:h-96 flex flex-col items-center justify-center bg-white rounded-[2rem] sm:rounded-[4rem] border-2 border-dashed border-slate-100 text-slate-300">
          <Loader2 className="animate-spin mb-4" size={32} sm:size={48} />
          <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-center px-6">Downloading Verses...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((surah) => (
            <div 
              key={surah.number} 
              onClick={() => navigate(`/user/quick/quran/${surah.number}`)}
              className="bg-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full border-2 hover:border-indigo-500/50"
            >
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-xs shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                  {surah.number}
                </div>
                <span className="text-xl sm:text-2xl font-arabic text-slate-400 group-hover:text-indigo-600 transition-colors truncate ml-4">{surah.name}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-800 text-base sm:text-lg uppercase tracking-tight truncate">{surah.englishName}</h3>
                <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">{surah.revelationType} • {surah.numberOfAyahs} Ayahs</p>
              </div>
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[8px] sm:text-[9px] font-black text-indigo-500 uppercase tracking-widest">Open Details</span>
                <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
