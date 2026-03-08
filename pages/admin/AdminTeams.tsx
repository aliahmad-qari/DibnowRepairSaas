
import React, { useState, useEffect } from 'react';
import { UsersRound, Plus, UserPlus, MoreVertical, Shield, X, Save, Star, Trash2 } from 'lucide-react';
import { Permission } from '../../types';

export const AdminTeams: React.FC = () => {
  const [teams, setTeams] = useState([
    { id: 'T1', name: 'Supervisors', members: 8, lead: 'Zeeshan Malik', role: 'Super Admin', department: 'Operations' },
    { id: 'T2', name: 'Support Unit', members: 3, lead: 'Alia Khan', role: 'Support Lead', department: 'Customer Success' },
    { id: 'T3', name: 'Finance Group', members: 5, lead: 'Imran Ahmed', role: 'Billing Ops', department: 'Accounting' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', lead: '', role: 'Super Admin', department: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newTeam = {
      ...formData,
      id: `T${teams.length + 1}`,
      members: 1,
    };
    setTeams([...teams, newTeam]);
    setShowForm(false);
    setFormData({ name: '', lead: '', role: 'Super Admin', department: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Infrastructure Teams</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Global administrative roles and department hierarchy.</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-indigo-100 hover:scale-105 transition-all text-xs uppercase tracking-widest"
        >
          <Plus size={20} /> Deploy New Department
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Shield size={20} />
                 <h3 className="text-lg font-black uppercase tracking-widest">New System Team</h3>
               </div>
               <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Team Designation</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold" placeholder="e.g. Audit Response Unit" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Assigned Lead</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold" placeholder="Full Name" value={formData.lead} onChange={e => setFormData({...formData, lead: e.target.value})} />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Access Level (Sub-Role)</label>
                <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 text-sm font-bold appearance-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option>Super Admin</option>
                  <option>Support Lead</option>
                  <option>Billing Ops</option>
                  <option>System Auditor</option>
                </select>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">Authorize Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {teams.map(team => (
          <div key={team.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-sm">
                <UsersRound size={28} />
              </div>
              <button className="text-slate-300 hover:text-rose-600 transition-colors p-2">
                <Trash2 size={20} />
              </button>
            </div>

            <h3 className="text-xl font-black text-slate-800 tracking-tight">{team.name}</h3>
            <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
              Unit: {team.department}
            </div>

            <p className="text-sm text-slate-500 mt-6 font-bold">
              Lead Officer: <span className="text-slate-800">{team.lead}</span>
            </p>

            <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-6 relative z-10">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-black uppercase tracking-widest">
                <Shield size={16} className="text-indigo-600" />
                {team.role}
              </div>
              <button className="text-[10px] font-black text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 transition-all flex items-center gap-1 uppercase tracking-widest">
                <UserPlus size={14} /> Assign
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
