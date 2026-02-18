
import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Filter, MoreVertical, CheckCircle2, Clock, Smartphone, User, DollarSign, Calendar } from 'lucide-react';
import { adminApi } from '../../api/adminApi';

export const AllRepairs: React.FC = () => {
  const [repairs, setRepairs] = useState<any[]>([]);

  useEffect(() => {
    const fetchRepairs = async () => {
      try {
        const data = await adminApi.getAllRepairs();
        setRepairs(data);
      } catch (error) {
        console.error('Failed to fetch repairs:', error);
      }
    };
    fetchRepairs();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Global Repair Bookings</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Cross-platform service management</p>
        </div>
        <div className="bg-white border border-slate-100 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Transaction Stream</span>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search global repairs..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm transition-all" />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50">
              <Filter size={16} /> Filter By Shop
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] border-b border-slate-50">
              <tr>
                <th className="px-8 py-5">Ticket ID</th>
                <th className="px-8 py-5">Customer Name</th>
                <th className="px-8 py-5">Device Model</th>
                <th className="px-8 py-5 text-center">Current Status</th>
                <th className="px-8 py-5 text-right">Service Cost</th>
                <th className="px-8 py-5 text-center">Entry Date</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {repairs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-slate-400 font-bold">No repairs found</td>
                </tr>
              ) : repairs.map((rep) => (
                <tr key={rep._id} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-8 py-6">
                    <span className="font-mono text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">{rep._id.slice(-8)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 text-xs">{rep.customerName.charAt(0)}</div>
                      <p className="font-black text-slate-800 text-sm">{rep.customerName}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                       <Smartphone size={14} className="text-slate-400" />
                       {rep.device}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase inline-flex items-center gap-2 border ${rep.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                      {rep.status === 'completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {rep.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 text-sm">
                    £{parseFloat(rep.cost).toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(rep.date || rep.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="text-slate-300 hover:text-indigo-600 p-2">
                       <MoreVertical size={18} />
                    </button>
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
