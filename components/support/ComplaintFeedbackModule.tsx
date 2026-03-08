import React, { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { db } from '../../api/db.ts';

interface ComplaintFeedbackModuleProps {
  complaintId: string;
}

export const ComplaintFeedbackModule: React.FC<ComplaintFeedbackModuleProps> = ({ complaintId }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    // Simulation of feedback transmission protocol
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    db.activity.log({
      actionType: 'Complaint Feedback Logged',
      moduleName: 'Support',
      refId: complaintId,
      status: 'Success'
    });
    
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="bg-emerald-50 border-2 border-emerald-100 p-8 rounded-[2.5rem] text-center animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-100 text-emerald-500">
          <CheckCircle2 size={32} />
        </div>
        <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest leading-none">Feedback Ledger Synced</h4>
        <p className="text-[10px] font-bold text-emerald-600/70 uppercase mt-2 tracking-tighter">Your technical satisfaction node has been permanently logged.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/5 shadow-2xl space-y-6 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
        <Zap size={100} className="text-white" />
      </div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg text-white">
          <Star size={24} fill={rating > 0 ? "currentColor" : "none"} />
        </div>
        <div>
          <h4 className="text-base font-black text-white uppercase tracking-tight leading-none">Resolution Performance Audit</h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <ShieldCheck size={12} className="text-emerald-400" /> Authorized Feedback Interface
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        <div className="flex justify-center gap-3 py-4 bg-white/5 rounded-2xl border border-white/5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="p-2 transition-all duration-300 transform hover:scale-125 focus:outline-none"
            >
              <Star
                size={36}
                strokeWidth={2}
                className={star <= (hover || rating) ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]" : "text-white/10"}
              />
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Analytical Commentary</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Supply technical feedback on resolution efficacy..."
            className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.8rem] outline-none focus:ring-4 focus:ring-indigo-500/20 text-white text-xs font-bold resize-none uppercase tracking-tighter placeholder:text-slate-600 transition-all"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={rating === 0 || isSubmitting}
          className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3 group"
        >
          {isSubmitting ? (
             <><Loader2 className="animate-spin" size={16} /> Syncing Node...</>
          ) : (
            <><Send size={16} className="group-hover:translate-x-1 transition-transform" /> Authorize Review Deployment</>
          )}
        </button>
        
        <p className="text-center text-[8px] font-black text-slate-500 uppercase tracking-[0.4em]">Node ID: FB-{complaintId.split('-')[1]}</p>
      </form>
    </div>
  );
};

const Loader2 = ({size, className}:any) => <CheckCircle2 size={size} className={className} />;
