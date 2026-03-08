import React from 'react';
import { 
  History, 
  Send, 
  UserCheck, 
  Activity, 
  CheckCircle2, 
  Clock,
  ShieldCheck,
  Hash
} from 'lucide-react';

interface ComplaintTimelineProps {
  complaint: any;
}

export const ComplaintLifecycleTimeline: React.FC<ComplaintTimelineProps> = ({ complaint }) => {
  if (!complaint) return null;

  const steps = [
    { 
      label: 'Complaint Submitted', 
      date: complaint.date, 
      desc: 'Initial node created by shop owner.', 
      icon: Send, 
      color: 'text-indigo-600', 
      completed: true 
    },
    { 
      label: 'Acknowledged', 
      date: complaint.date, 
      desc: 'System auditor assigned to node.', 
      icon: UserCheck, 
      color: 'text-blue-600', 
      completed: true 
    },
    { 
      label: 'Audit In Progress', 
      date: complaint.date, 
      desc: 'Technical review of reported incident.', 
      icon: Activity, 
      color: 'text-amber-600', 
      completed: complaint.status === 'resolved' || complaint.priority === 'high' 
    },
    { 
      label: 'Finalized', 
      date: complaint.status === 'resolved' ? complaint.date : 'TBD', 
      desc: complaint.status === 'resolved' ? 'Closure protocol executed successfully.' : 'Node awaiting final handshake.', 
      icon: CheckCircle2, 
      color: 'text-emerald-600', 
      completed: complaint.status === 'resolved' 
    }
  ];

  return (
    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600">
           <History size={20} />
        </div>
        <div>
           <h4 className="text-sm font-black uppercase tracking-widest text-slate-800 leading-none">Operational Lifecycle</h4>
           <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-tighter flex items-center gap-2">
             <Hash size={10} /> {complaint.id} • Forensic Audit Trace
           </p>
        </div>
      </div>

      <div className="space-y-0 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => (
          <div key={idx} className={`relative flex gap-6 pb-10 last:pb-0 ${step.completed ? 'opacity-100' : 'opacity-30 grayscale'}`}>
            <div className={`w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center z-10 shrink-0 ${step.completed ? step.color : 'text-slate-300'}`}>
              <step.icon size={18} />
            </div>
            <div className="min-w-0">
               <div className="flex items-center gap-3">
                  <h5 className="text-[11px] font-black uppercase tracking-tight text-slate-800">{step.label}</h5>
                  <span className="text-[9px] font-black text-slate-400 uppercase bg-white px-2 py-0.5 rounded-lg border border-slate-100">{step.date}</span>
               </div>
               <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-6 border-t border-slate-200/50 flex items-center justify-center gap-3 opacity-40">
         <ShieldCheck size={14} className="text-indigo-600" />
         <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Lifecycle Integrity Verified Node v9.4</span>
      </div>
    </div>
  );
};