
import React, { useState } from 'react';
import { Ticket, Search, Plus, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import { BackButton } from '../../components/common/BackButton';

export const UserTickets: React.FC = () => {
  const [tickets] = useState([
    { id: 'T-1001', subject: 'Payout delayed', status: 'open', priority: 'high', date: 'Oct 24, 2023' },
    { id: 'T-0982', subject: 'Feature request: POS Barcode', status: 'resolved', priority: 'low', date: 'Oct 20, 2023' },
  ]);

  return (
    <div className="space-y-8 px-0">
      <BackButton />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Support Tickets</h2>
          <p className="text-slate-500 text-sm">Need help? Create a ticket and our team will assist you.</p>
        </div>
        <button className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:bg-indigo-700 transition-all">
          <Plus size={20} /> New Support Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
             <Ticket size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase">Total Tickets</p>
            <h3 className="text-2xl font-bold">12</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
             <Clock size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase">Open Cases</p>
            <h3 className="text-2xl font-bold text-amber-600">3</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
             <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-bold uppercase">Resolved</p>
            <h3 className="text-2xl font-bold text-emerald-600">9</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100">
           <div className="relative w-full max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             <input type="text" placeholder="Search tickets..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
           </div>
        </div>
        <div className="divide-y divide-slate-50">
          {tickets.map(ticket => (
            <div key={ticket.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between hover:bg-slate-50 transition-all cursor-pointer">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ticket.status === 'open' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                   <MessageCircle size={20} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-slate-800 truncate">{ticket.subject}</h4>
                  <p className="text-xs text-slate-400 mt-1">{ticket.id} • Last activity {ticket.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 ml-auto sm:ml-0 shrink-0">
                <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] font-bold uppercase ${ticket.priority === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                  {ticket.priority}
                </span>
                <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] font-bold uppercase ${ticket.status === 'open' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {ticket.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
