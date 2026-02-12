
import React from 'react';
import { ShoppingBag, Search, Filter, TrendingUp, Store, Clock } from 'lucide-react';

export const AllSales: React.FC = () => {
  const sales = [
    { id: 'INV-8821', shop: 'Elite Mobile', product: 'iPhone 13 Display', amount: 345.00, date: 'Today, 02:30 PM', status: 'Completed' },
    { id: 'INV-8822', shop: 'QuickFix Shop', product: 'S22 Ultra Charging Port', amount: 85.00, date: 'Today, 01:15 PM', status: 'Completed' },
    { id: 'INV-8823', shop: 'Downtown Elec', product: 'MacBook Air M1 Keyboard', amount: 1200.00, date: 'Yesterday', status: 'Pending' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Sales Feed</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Real-time monitoring of all ecosystem commerce.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-indigo-50/10">
           <div className="flex items-center gap-6">
              <div className="text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Daily Volume</p>
                 <p className="text-xl font-black text-emerald-600 tracking-tight">£18,245.00</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Order Value</p>
                 <p className="text-xl font-black text-indigo-600 tracking-tight">£142.50</p>
              </div>
           </div>
           <div className="flex gap-2">
              <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"><Filter size={18} /></button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] border-b border-slate-50">
              <tr>
                <th className="px-8 py-5">Invoice Ref</th>
                <th className="px-8 py-5">Shop Entity</th>
                <th className="px-8 py-5">Primary Product</th>
                <th className="px-8 py-5 text-right">Order Total</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-center">Processed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-6">
                    <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tighter">{sale.id}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm tracking-tight">
                       <Store size={14} className="text-slate-400" />
                       {sale.shop}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-600">{sale.product}</p>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 text-sm">
                    £{sale.amount.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${sale.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                       {sale.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {sale.date}
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
