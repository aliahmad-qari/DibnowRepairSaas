
import React from 'react';
import { ShieldCheck, User, ClipboardList, Clock, ArrowRight, ShieldAlert } from 'lucide-react';

interface AdminActionLogProps {
  complaint: any;
}

export const ComplaintAdminActionLog: React.FC<AdminActionLogProps> = ({ complaint }) => {
  if (!complaint) return null;

  // Simulated audit logs for the specific complaint node
  const logs = [
    {
      id: 'L1',
      action: 'Status Initialization',
      details: 'Case received and queued for audit.',
      admin: 'System System',
      timestamp: complaint.date + ' 10:05 AM'
    },
    {
      id: 'L2',
      action: 'Assigned Auditor',
      details: 'Authorized Lead assigned to forensic review.',
      admin: 'Lead Auditor v9',
      timestamp: complaint.date + ' 11:15 AM'
    },
    {
      id: 'L3',
      action: 'Resolution Registry',
      details: complaint.status === 'resolved' ? 'Closure note appended and node locked.' : 'Investigation ongoing within technical node.',
      admin: 'Platform Admin',
      timestamp: complaint.status === 'resolved' ? complaint.date + ' 04:30 PM' : 'TBD'
    }
  ];

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-indigo-600" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Admin Action Registry</h4>
        </div>
        <span className="text-[8px] font-black uppercase text-indigo-400 bg-white px-2 py-1 rounded border border-slate-100 shadow-sm">Read Only Node</span>
      </div>
      
      <div className="p-6 space-y-6">
        {logs.map((log, i) => (
          <div key={log.id} className="relative flex gap-4 group">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors shadow-sm z-10">
                <ClipboardList size={14} />
              </div>
              {i < logs.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1" />}
            </div>
            <div className="pb-4">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{log.action}</p>
                <div className="w-1 h-1 rounded-full bg-slate-300" />
                <p className="text-[8px] font-black text-slate-400 uppercase">{log.timestamp}</p>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tighter">{log.details}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <User size={10} className="text-indigo-400" />
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{log.admin}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
