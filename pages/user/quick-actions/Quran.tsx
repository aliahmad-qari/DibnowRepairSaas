
import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 shadow-sm transition-all"><ChevronLeft /></button>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Quran Explorer</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Digital Scriptural Preservation</p>
          </div>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search Surah Name or Number..." 
            className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 font-bold text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 text-slate-300">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p className="text-xs font-black uppercase tracking-[0.3em]">Downloading Verses...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((surah) => (
            <div 
              key={surah.number} 
              onClick={() => navigate(`/user/quick/quran/${surah.number}`)}
              className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-2xl transition-all cursor-pointer group flex flex-col h-full border-2 hover:border-indigo-500/50"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xs shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  {surah.number}
                </div>
                <span className="text-2xl font-arabic text-slate-400 group-hover:text-indigo-600 transition-colors">{surah.name}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">{surah.englishName}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{surah.revelationType} • {surah.numberOfAyahs} Ayahs</p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Open Details</span>
                <ChevronRight size={16} className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
