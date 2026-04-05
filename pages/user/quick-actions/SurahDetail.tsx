
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BackButton } from '../../../components/common/BackButton';
import { ChevronLeft, Play, Pause, Loader2, Languages, Volume2, Info, BookOpen, Copy, Share2, MessageSquareText, Check, Search as SearchIcon, X as CloseIcon, Hash, Tag as TagIcon } from 'lucide-react';

interface Ayah {
  number: number;
  text: string;
  translation?: string;
  audio?: string;
  tags?: string[]; // OPTIONAL: Additive tags
}

const TRANSLATIONS = [
  { id: 'en.sahih', label: 'English (Sahih International)' },
  { id: 'ur.kanzuliman', label: 'Urdu (Kanzul Iman)' },
  { id: 'ar.muyassar', label: 'Arabic (Tafsir Jalalayn)' },
  { id: 'hi.hindi', label: 'Hindi' },
];

// --- NEW ADDITIVE COMPONENT: AyahActions ---
const AyahActions: React.FC<{ ayah: Ayah; surahName: string }> = ({ ayah, surahName }) => {
  const [copied, setCopied] = useState(false);

  const getShareText = () => {
    return `${surahName} - Ayah ${ayah.number}\n\n${ayah.text}\n\nTranslation:\n${ayah.translation}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = getShareText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quran - ${surahName}`,
          text: text,
        });
      } catch (err) {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  const handleTafsir = () => {
    alert(`Node Detail: Viewing Tafsir for ${surahName} Ayah ${ayah.number} (Contextual module loading...)`);
  };

  return (
    <div className="flex items-center justify-end gap-2 mb-4 animate-in fade-in slide-in-from-right-2 duration-300">
      <button 
        onClick={handleTafsir}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 rounded-lg transition-all"
        title="View Tafsir"
      >
        <MessageSquareText size={14} />
        <span className="text-[9px] font-black uppercase tracking-widest">Tafsir</span>
      </button>
      <button 
        onClick={handleCopy}
        className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg transition-all ${copied ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border-slate-100'}`}
        title="Copy Ayah"
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span className="text-[9px] font-black uppercase tracking-widest">{copied ? 'Copied' : 'Copy'}</span>
      </button>
      <button 
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-100 rounded-lg transition-all"
        title="Share Ayah"
      >
        <Share2 size={14} />
        <span className="text-[9px] font-black uppercase tracking-widest">Share</span>
      </button>
    </div>
  );
};

export const SurahDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [surah, setSurah] = useState<any>(null);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [translationId, setTranslationId] = useState(TRANSLATIONS[0].id);
  
  // --- NEW ADDITIVE STATE: Search Nodes ---
  const [searchQuery, setSearchQuery] = useState('');
  
  // Audio State
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSurahData();
  }, [id, translationId]);

  const fetchSurahData = async () => {
    setLoading(true);
    try {
      // Fetch Arabic Text + Audio + Selected Translation in parallel for efficiency
      const [arabicRes, transRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/surah/${id}/ar.alafasy`), // Audio edition
        fetch(`https://api.alquran.cloud/v1/surah/${id}/${translationId}`)
      ]);

      const arabicJson = await arabicRes.json();
      const transJson = await transRes.json();

      if (arabicJson.data && transJson.data) {
        setSurah(arabicJson.data);
        
        // Merge Arabic and Translation ayahs
        // Note: Mocking tags based on common themes for searchable demonstrations
        const mergedAyahs = arabicJson.data.ayahs.map((ayah: any, index: number) => {
          const tags = [];
          if (ayah.text.includes('اللَّه')) tags.push('Worship');
          if (index % 10 === 0) tags.push('Mercy');
          if (index % 15 === 0) tags.push('Guidance');
          
          return {
            number: ayah.numberInSurah,
            text: ayah.text,
            audio: ayah.audio,
            translation: transJson.data.ayahs[index].text,
            tags: tags
          };
        });
        
        setAyahs(mergedAyahs);
      }
    } catch (err) {
      console.error("Error fetching Surah details:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- NEW ADDITIVE LOGIC: Diacritic-Insensitive Search Engine ---
  const filteredAyahs = useMemo(() => {
    if (!searchQuery.trim()) return ayahs;

    const query = searchQuery.toLowerCase().trim();
    
    // Arabic Diacritic Stripping Utility
    const stripDiacritics = (text: string) => {
      return text.replace(/[\u064B-\u065F\u0670]/g, "");
    };

    const cleanQuery = stripDiacritics(query);

    return ayahs.filter(ayah => {
      const matchNumber = ayah.number.toString() === query;
      const matchTranslation = ayah.translation?.toLowerCase().includes(query);
      const matchArabic = stripDiacritics(ayah.text).includes(cleanQuery);
      const matchTags = ayah.tags?.some(tag => tag.toLowerCase().includes(query));

      return matchNumber || matchTranslation || matchArabic || matchTags;
    });
  }, [ayahs, searchQuery]);

  const handlePlayAudio = (index: number) => {
    // Note: index in handlePlayAudio refers to original ayahs array index. 
    // We adjust this based on filtering if necessary, but keep original order for simplicity.
    if (playingIndex === index) {
      audioRef.current?.pause();
      setPlayingIndex(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    setIsAudioLoading(true);
    const audio = new Audio(ayahs[index].audio);
    audioRef.current = audio;
    
    audio.play()
      .then(() => {
        setPlayingIndex(index);
        setIsAudioLoading(false);
      })
      .catch(() => setIsAudioLoading(false));

    audio.onended = () => {
      if (index < ayahs.length - 1) {
        handlePlayAudio(index + 1);
      } else {
        setPlayingIndex(null);
      }
    };
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Loading Revelation Nodes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 sm:p-8 rounded-[2.5rem] sm:rounded-[3rem] border border-slate-100 shadow-sm pt-4 mt-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <BackButton />
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none truncate">{surah?.englishName}</h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 truncate">{surah?.englishNameTranslation} • {surah?.revelationType}</p>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
          <div className="text-left md:text-right">
            <p className="text-xl sm:text-2xl font-arabic text-indigo-600 leading-none">{surah?.name}</p>
            <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Surah {surah?.number}</p>
          </div>
          <div className="h-10 w-px bg-slate-100 mx-2 hidden sm:block" />
          <div className="flex items-center gap-2 bg-indigo-50 px-3 sm:px-4 py-2 rounded-xl border border-indigo-100">
            <Languages size={14} className="text-indigo-600 shrink-0" />
            <select 
              value={translationId}
              onChange={(e) => setTranslationId(e.target.value)}
              className="bg-transparent text-[9px] sm:text-[10px] font-black uppercase outline-none cursor-pointer text-indigo-900"
            >
              {TRANSLATIONS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* --- NEW ADDITIVE: SEARCH INTERFACE --- */}
      <div className="bg-white p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-3 sm:gap-4 group">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 group-focus-within:bg-indigo-600 group-focus-within:text-white transition-all">
          <SearchIcon size={18} sm:size={20} />
        </div>
        <div className="flex-1 relative">
           <input 
             type="text" 
             placeholder="Search Verse, Ayah #, Tags..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-transparent border-none outline-none font-bold text-slate-700 text-xs sm:text-sm placeholder:text-slate-300"
           />
           {searchQuery && (
             <button 
               onClick={() => setSearchQuery('')}
               className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
             >
               <CloseIcon size={12} sm:size={14} />
             </button>
           )}
        </div>
        <div className="hidden sm:flex items-center gap-3">
           <div className="h-8 w-px bg-slate-100" />
           <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest whitespace-nowrap">
             {filteredAyahs.length} / {ayahs.length} Nodes
           </span>
        </div>
      </div>

      {/* Bismillah Header (Except Surah At-Tawbah) */}
      {!searchQuery && surah?.number !== 9 && (
        <div className="text-center py-6 sm:py-10 animate-in slide-in-from-top-4 duration-1000">
          <p className="text-2xl sm:text-4xl font-arabic text-slate-800 mb-3 leading-relaxed">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 leading-relaxed">In the name of Allah, the Entirely Merciful, the Especially Merciful</p>
        </div>
      )}

      {/* Ayahs List */}
      <div className="space-y-6">
        {filteredAyahs.map((ayah, idx) => {
          // Calculate the original index to maintain correct audio logic
          const originalIdx = ayahs.findIndex(a => a.number === ayah.number);
          
          return (
            <div key={idx} className={`bg-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border transition-all duration-300 ${playingIndex === originalIdx ? 'border-indigo-500 shadow-xl ring-4 ring-indigo-50' : 'border-slate-50 shadow-sm hover:border-slate-200'}`}>
              {/* ADDITIVE: Ayah Actions (Copy, Share, Tafsir) */}
              <div className="flex justify-end overflow-hidden">
                <AyahActions ayah={ayah} surahName={surah?.englishName || 'Surah'} />
              </div>

              <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
                {/* Ayah Meta & Audio */}
                <div className="flex flex-row md:flex-col items-center justify-between md:justify-start w-full md:w-auto gap-4 shrink-0">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                    {ayah.number}
                  </div>
                  <button 
                    onClick={() => handlePlayAudio(originalIdx)}
                    disabled={isAudioLoading}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all shrink-0 ${playingIndex === originalIdx ? 'bg-rose-500 text-white shadow-lg' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100'}`}
                  >
                    {isAudioLoading && playingIndex === originalIdx ? <Loader2 className="animate-spin" size={18} sm:size={20} /> : playingIndex === originalIdx ? <Pause size={18} sm:size={20} /> : <Play size={18} sm:size={20} />}
                  </button>
                </div>

                {/* Text Content */}
                <div className="flex-1 w-full space-y-6">
                  <p className="text-2xl sm:text-3xl font-arabic text-right leading-relaxed sm:leading-[4.5rem] text-slate-800">
                    {ayah.text}
                  </p>
                  <div className="pt-6 border-t border-slate-50">
                    <div className="flex items-center justify-between gap-4 mb-4">
                       <div className="flex items-center gap-2 shrink-0">
                          <BookOpen size={12} className="text-indigo-400" />
                          <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Revelation Node</span>
                       </div>
                       
                       {/* --- NEW ADDITIVE: TAG DISPLAY --- */}
                       {ayah.tags && ayah.tags.length > 0 && (
                         <div className="flex flex-wrap justify-end gap-1.5 sm:gap-2">
                            {ayah.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[7px] font-black uppercase tracking-widest flex items-center gap-1 shrink-0">
                                <TagIcon size={8} /> {tag}
                              </span>
                            ))}
                         </div>
                       )}
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-slate-600 leading-relaxed">
                      {ayah.translation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* --- NEW ADDITIVE: EMPTY SEARCH STATE --- */}
        {filteredAyahs.length === 0 && (
          <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 animate-in zoom-in-95">
             <SearchIcon size={48} className="mx-auto text-slate-200 mb-6" />
             <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">No results identified</h3>
             <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 max-w-xs mx-auto">
               The query "{searchQuery}" did not match any Arabic text, translations, or tags in this Surah.
             </p>
             <button 
              onClick={() => setSearchQuery('')}
              className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-indigo-700 transition-all"
             >
               Clear Search Nodes
             </button>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="bg-slate-900 rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-10 text-white relative overflow-hidden group shadow-2xl">
        <div className="absolute -bottom-10 -right-10 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700 hidden sm:block"><Volume2 size={200} /></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 text-center lg:text-left">
           <div className="space-y-4">
              <div className="flex items-center justify-center lg:justify-start gap-3 text-indigo-400">
                 <Info size={18} />
                 <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em]">Audio Protocol Node</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight uppercase leading-none">Mishary Rashid Alafasy</h3>
              <p className="text-slate-400 text-[11px] font-medium max-w-sm uppercase tracking-tighter leading-relaxed mx-auto lg:mx-0">
                 Stream high-fidelity recitations with automated node progression. Audio is cached for the current session lifecycle.
              </p>
           </div>
           <button 
            onClick={() => handlePlayAudio(0)}
            className="w-full lg:w-auto px-10 py-5 bg-indigo-600 text-white rounded-[1.5rem] sm:rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-3"
           >
              <Play size={18} fill="currentColor" /> Recite full surah
           </button>
        </div>
      </div>
    </div>
  );
};
