
import React, { useState } from 'react';
import { Star, MessageSquare, Send, CheckCircle2, ShieldCheck } from 'lucide-react';
import { db } from '../../api/db.ts';

interface TicketFeedbackModuleProps {
  ticketId: string;
  onSubmitted?: () => void;
}

export const TicketFeedbackModule: React.FC<TicketFeedbackModuleProps> = ({ ticketId, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    // Simulation of feedback transmission
    await new Promise(resolve => setTimeout(resolve, 800));
    
    db.activity.log({
      actionType: 'Feedback Submitted',
      moduleName: 'Support',
      refId: ticketId,
      status: 'Success'
    });
    
    setIsSubmitted(true);
    setIsSubmitting(false);
    if (onSubmitted) onSubmitted();
  };

  if (isSubmitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2.5rem] text-center animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm text-emerald-500">
          <CheckCircle2 size={32} />
        </div>
        <h4 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Protocol Feedback Received</h4>
        <p className="text-[10px] font-bold text-emerald-600/70 uppercase mt-2">Thank you for helping us maintain infrastructure standards.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 p-8 rounded-[2.5rem] space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
          <Star size={20} fill={rating > 0 ? "currentColor" : "none"} />
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Rate Support Quality</h4>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Authorized Audit of Resolution Protocol</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="p-2 transition-all duration-200 transform hover:scale-125"
            >
              <Star
                size={32}
                className={star <= (hover || rating) ? "text-amber-400 fill-amber-400" : "text-slate-200"}
              />
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Additional Commentary</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Operational notes on resolution quality..."
            className="w-full p-5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 text-xs font-bold resize-none"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={rating === 0 || isSubmitting}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? "Transmitting..." : <><Send size={16} /> Authorize Review</>}
        </button>
      </form>
    </div>
  );
};
