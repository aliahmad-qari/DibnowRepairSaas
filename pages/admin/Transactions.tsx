
import React from 'react';
import { CreditCard, Search, Download, Filter, ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';

export const AdminTransactions: React.FC = () => {
  const globalTransactions = [
    { id: 'GT-001', shop: 'Elite Mobile', type: 'subscription', amount: 299.00, status: 'success', date: 'Oct 24, 2023, 14:20', gateway: 'Stripe' },
    { id: 'GT-002', shop: 'QuickFix Shop', type: 'wallet_topup', amount: 50.00, status: 'success', date: 'Oct 24, 2023, 13:15', gateway: 'PayPal' },
    { id: 'GT-003', shop: 'Downtown Elec', type: 'subscription', amount: 99.00, status: 'failed', date: 'Oct 24, 2023, 12:05', gateway: 'Stripe' },
    { id: 'GT-004', shop: 'Gadget Gurus', type: 'subscription', amount: 299.00, status: 'success', date: 'Oct 24, 2023, 09:40', gateway: 'PayFast' },
    { id: 'GT-005', shop: 'Elite Mobile', type: 'wallet_topup', amount: 100.00, status: 'success', date: 'Oct 23, 2023, 16:22', gateway: 'Internal' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Global Transactions</h2>
          <p className="text-slate-500">Monitor all payments and wallet activities across the SaaS.</p>
        </div>
        <button className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-slate-700 hover:bg-slate-50 shadow-sm transition-all">
          <Download size={18} />
          Export Ledger
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Daily Revenue</p>
          <div className="flex items-center gap-2 mt-2">
            <h3 className="text-2xl font-bold">$12,450</h3>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">+8%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Refund Rate</p>
          <div className="flex items-center gap-2 mt-2">
            <h3 className="text-2xl font-bold">0.4%</h3>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">Good</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Active Top-ups</p>
          <div className="flex items-center gap-2 mt-2">
            <h3 className="text-2xl font-bold">142</h3>
            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">New</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Gateway Fees</p>
          <div className="flex items-center gap-2 mt-2">
            <h3 className="text-2xl font-bold">$842</h3>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full font-bold">Est.</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/20">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by shop name, transaction ID..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm flex items-center gap-2 hover:bg-slate-50">
              <Filter size={18} /> Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-5">Transaction ID</th>
                <th className="px-6 py-5">Shop / Client</th>
                <th className="px-6 py-5">Type</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Gateway</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {globalTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">{tx.id}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{tx.shop}</p>
                  </td>
                  <td className="px-6 py-4 capitalize text-xs font-medium text-slate-500">{tx.type.replace('_', ' ')}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">${tx.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-600 uppercase tracking-tighter">{tx.gateway}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center w-fit gap-1 ${tx.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-medium whitespace-nowrap">{tx.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                      <ExternalLink size={18} />
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
