
import React from 'react';
import { ShieldCheck, Mail, Smartphone, MoreVertical, BadgeCheck, ShieldAlert } from 'lucide-react';

export const AllAdmins: React.FC = () => {
  const admins = [
    { id: 'ADM-001', name: 'Zeeshan Malik', email: 'admin@dibnow.com', role: 'Super Admin', status: 'Active', lastLogin: '10 mins ago' },
    { id: 'ADM-002', name: 'Alia Khan', email: 'alia@gmail.com', role: 'System Auditor', status: 'Active', lastLogin: '2 hours ago' },
    { id: 'ADM-003', name: 'Imran Ahmed', email: 'imran@support.com', role: 'Support Lead', status: 'Away', lastLogin: '1 day ago' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Administrators</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Manage global platform access and security levels.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {admins.map(admin => (
          <div key={admin.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-4 ${admin.role === 'Super Admin' ? 'text-amber-500 opacity-20' : 'text-slate-200 opacity-20'}`}>
               <ShieldCheck size={100} />
            </div>
            
            <div className="flex items-center gap-4 mb-6">
               <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-xl font-black shadow-lg">
                  {admin.name.charAt(0)}
               </div>
               <div>
                  <h3 className="text-xl font-black text-slate-800">{admin.name}</h3>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{admin.role}</p>
               </div>
            </div>

            <div className="space-y-4 relative z-10">
               <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                  <Mail size={14} className="text-slate-400" /> {admin.email}
               </div>
               <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${admin.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{admin.status}</span>
                  </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase italic">Last seen {admin.lastLogin}</span>
               </div>
            </div>

            <div className="mt-8 flex gap-3">
               <button className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Edit Permissions</button>
               <button className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-600 hover:bg-rose-50 transition-all"><ShieldAlert size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
