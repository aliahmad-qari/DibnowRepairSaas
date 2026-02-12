
import React from 'react';
import { 
  Users, 
  Search, 
  MoreVertical, 
  Shield, 
  Zap, 
  AlertCircle,
  Mail,
  Filter
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const users = [
    { id: '1', name: 'Elite Mobile Repair', owner: 'John Smith', email: 'elite@repair.com', plan: 'Enterprise', status: 'active', users: 12, balance: 1450.00 },
    { id: '2', name: 'QuickFix Shop', owner: 'Sarah Connor', email: 'sarah@quickfix.io', plan: 'Pro', status: 'active', users: 3, balance: 420.00 },
    { id: '3', name: 'Downtown Electronics', owner: 'Mike Ross', email: 'mike@downtown.net', plan: 'Starter', status: 'expired', users: 1, balance: 15.00 },
    { id: '4', name: 'Gadget Gurus', owner: 'Lisa Park', email: 'lisa@gurus.com', plan: 'Enterprise', status: 'active', users: 25, balance: 3200.00 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Platform Users</h2>
          <p className="text-slate-500">Oversee all registered shop accounts and their status.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-all flex items-center gap-2">
            Export Leads
          </button>
          <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
            <Mail size={18} />
            Broadcast Notification
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by business name, owner or email..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm flex items-center gap-2 hover:bg-slate-50">
              <Filter size={18} />
              Filter
            </button>
            <select className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm outline-none">
              <option>All Plans</option>
              <option>Enterprise</option>
              <option>Pro</option>
              <option>Starter</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em] border-b border-slate-100">
              <tr>
                <th className="px-6 py-5">Business / Owner</th>
                <th className="px-6 py-5">Subscription</th>
                <th className="px-6 py-5">Team Size</th>
                <th className="px-6 py-5">Wallet</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">{u.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{u.owner}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className={u.plan === 'Enterprise' ? 'text-amber-500' : 'text-slate-300'} />
                      <span className="text-sm font-bold text-slate-700">{u.plan}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                      <Users size={14} />
                      {u.users} seats
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">${u.balance.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm transition-all">
                        <Shield size={16} />
                      </button>
                      <button className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-slate-600 shadow-sm transition-all">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
