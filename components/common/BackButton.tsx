import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const BackButton: React.FC = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className="group flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20  rounded-xl border border-white/10 transition-all hover:scale-105 active:scale-95 shadow-lg backdrop-blur-md mb-6 z-50"
      title="Go Back"
    >
      <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
      <span className="text-xs font-bold uppercase tracking-widest">Back</span>
    </button>
  );
};
