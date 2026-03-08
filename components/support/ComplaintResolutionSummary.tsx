import React from 'react';
import { 
  CheckCircle2, 
  UserCircle2, 
  CalendarCheck, 
  Gift, 
  ShieldCheck, 
  Info,
  Clock
} from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext.tsx';

interface ComplaintResolutionSummaryProps {
  complaint: any;
}

export const ComplaintResolutionSummary: React.FC<ComplaintResolutionSummaryProps> = ({ complaint }) => {
  const { currency } = useCurrency();
  
  if (!complaint || complaint.status !== 'resolved') return null;

  // Mocked resolution metadata for high-fidelity visualization
  const resolutionMeta = {
    note: "Discrepancy in Invoice #882 identified as a sync latency error between POS and Ledger nodes. Transaction record has been manually rectified and validated.",
    adminName: "Lead Auditor v9",
    timestamp: complaint.date + " 04:45 PM",
    compensation: {
      type: "Virtual Credits",
      amount: 10,
      note: "Authorized compensatory node refill for operational friction."
    }
  };

  return (
    <div className="bg-emerald-50 rounded-[2.5rem] border-2 border-emerald-100 p-8 space-y-8 animate-in zoom-in-95 duration-500 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
        <CheckCircle2 size={150} className="text-emerald-600" />
      </div>

      <div className="flex items-center gap-5 relative z-10">
        <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-emerald-100 border border-emerald-50 shrink-0">
          <ShieldCheck size={32} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none">Resolution Finalized</h3>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2 flex items-center gap-2">
            <Clock size={12} /> Post-Closure Audit Node Active
          </p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Closure Note */}
        <div className="bg-white/60 backdrop-blur-md p-6 rounded-[1.8rem] border border-emerald-200/50">
          <div className="flex items-center gap-2 mb-3">
            <Info size={14} className="text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none">Final Auditor Conclusion</span>
          </div>
          <p className="text-sm font-bold text-emerald-900 leading-relaxed uppercase tracking-tighter italic">
            "{resolutionMeta.note}"
          </p>
        </div>

        {/* Admin Signature */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/40 p-4 rounded-2xl flex items-center gap-4">
            <UserCircle2 size={24} className="text-emerald-600" />
            <div>
              <p className="text-[8px] font-black text-emerald-700 uppercase tracking-widest leading-none">Executing Auditor</p>
              <p className="text-xs font-black text-emerald-950 uppercase mt-1">{resolutionMeta.adminName}</p>
            </div>
          </div>
          <div className="bg-white/40 p-4 rounded-2xl flex items-center gap-4">
            <CalendarCheck size={24} className="text-emerald-600" />
            <div>
              <p className="text-[8px] font-black text-emerald-700 uppercase tracking-widest leading-none">Audit Timestamp</p>
              <p className="text-xs font-black text-emerald-950 uppercase mt-1">{resolutionMeta.timestamp}</p>
            </div>
          </div>
        </div>

        {/* Optional Compensation */}
        {resolutionMeta.compensation && (
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl group-hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/20">
                  <Gift size={20} />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest">Client Restitution</h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black">{currency.symbol}{resolutionMeta.compensation.amount}</span>
              </div>
            </div>
            <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-tighter opacity-80 leading-tight">
              {resolutionMeta.compensation.note}
            </p>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-emerald-200/50 flex justify-center relative z-10">
        <p className="text-[8px] font-black text-emerald-600/50 uppercase tracking-[0.4em]">Node Protocol Closed • Non-Editable Ledger Entry</p>
      </div>
    </div>
  );
};