
import React from 'react';
import { Wallet as WalletIcon, TrendingUp, DollarSign, ArrowUpRight, ArrowDownLeft, Download, Filter, Search } from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';

export const AdminWallet: React.FC = () => {
  const adminTx = [
    { id: 'ADM-TX-01', from: 'Elite Mobile Repair', type: 'subscription', amount: 299.00, status: 'completed', date: 'Today, 10:20 AM' },
    { id: 'ADM-TX-02', from: 'System Payout', type: 'withdrawal', amount: -5000.00, status: 'completed', date: 'Yesterday' },
    { id: 'ADM-TX-03', from: 'QuickFix Shop', type: 'wallet_topup', amount: 50.00, status: 'completed', date: 'Yesterday' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Platform Wallet</h2>
          <p className="text-slate-500">Manage SaaS treasury and global financial flows.</p>
        </div>
        <button className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-all">
          <ArrowUpRight size={20} /> Initiate Withdrawal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Platform Revenue" value="$452,120" icon={<DollarSign />} trend="14% this month" trendUp />
        <StatCard title="Available for Payout" value="$128,450" icon={<WalletIcon />} />
        <StatCard title="Pending Verifications" value="12" icon={<TrendingUp />} />
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <WalletIcon size={20} />
             </div>
             <h3 className="font-bold">Treasury Ledger</h3>
          </div>
          <div className="flex gap-2">
            <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600">
              <Filter size={18} />
            </button>
            <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600">
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Ref ID</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Transaction Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {adminTx.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/80 transition-all">
                  <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">{tx.id}</td>
                  <td className="px-6 py-4 font-bold text-slate-700 text-sm">{tx.from}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500 uppercase">{tx.type}</span>
                  </td>
                  <td className={`px-6 py-4 font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
