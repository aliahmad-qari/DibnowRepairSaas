
import React, { useMemo, useState } from 'react';
import { 
  Receipt, Download, FileText, Search, Filter, 
  ChevronRight, Calendar, DollarSign, CheckCircle2,
  Clock, XCircle, Info, Hash, Printer, Mail
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useCurrency } from '../../context/CurrencyContext.tsx';

export const UserInvoices: React.FC = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');

  const invoices = useMemo(() => {
    const transactions = db.wallet.getTransactions();
    // Filter for billing related items (Subscriptions, Top-ups)
    return transactions.filter(t => 
      t.description.toLowerCase().includes('refill') || 
      t.description.toLowerCase().includes('subscription') ||
      t.description.toLowerCase().includes('upgrade')
    );
  }, [user]);

  const filteredInvoices = invoices.filter(inv => 
    inv.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = (inv: any) => {
    alert(`Generating Document Node for Invoice: ${inv.id}\nProtocol: Authorized PDF Stream.`);
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Fiscal Documents</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
            <Receipt size={12} className="text-indigo-600" /> Subscription & Transaction Registry
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Query Invoice ID or Ref..." 
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm font-bold shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-10 py-6">Document Node</th>
                <th className="px-10 py-6">Operational Date</th>
                <th className="px-10 py-6 text-right">Settlement</th>
                <th className="px-10 py-6 text-center">Protocol Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredInvoices.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-24 text-center opacity-30">
                      <FileText size={48} className="mx-auto mb-4" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No Fiscal Nodes Identified</p>
                   </td>
                </tr>
              ) : filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Hash size={18} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm uppercase">{inv.description}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">ID: {inv.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <p className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
                       <Calendar size={14} className="text-slate-300" /> {inv.date}
                    </p>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <p className="text-base font-black text-slate-900 tracking-tighter">
                      {currency.symbol}{inv.amount.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-10 py-7 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-2 border ${
                      inv.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handlePrint(inv)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                         <Download size={18} />
                      </button>
                      <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                         <Mail size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl">
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
            <Info size={150} />
         </div>
         <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">Billing Node Policy</h4>
         <p className="text-sm font-medium leading-relaxed max-w-2xl opacity-70 uppercase tracking-tighter">
            Digital receipts are immutable nodes logged on our secure commerce cluster. For custom business branding on invoices, please configure your identity profile in shop settings.
         </p>
      </div>
    </div>
  );
};
