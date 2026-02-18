
import React, { useState, useEffect } from 'react';
import { Wallet as WalletIcon, TrendingUp, DollarSign, ArrowUpRight, ArrowDownLeft, Download, Filter, Search } from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { adminApi } from '../../api/adminApi';

export const AdminWallet: React.FC = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getAllTransactions();
        setTransactions(data);
      } catch (error) {
        console.error('Failed to fetch transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const totalRevenue = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const availablePayout = totalRevenue * 0.85; // Assuming 15% platform fee
  const pendingVerifications = transactions.filter(t => t.status === 'pending').length;

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
        <StatCard title="Total Platform Revenue" value={`$${totalRevenue.toFixed(2)}`} icon={<DollarSign />} trend="All time" trendUp />
        <StatCard title="Available for Payout" value={`$${availablePayout.toFixed(2)}`} icon={<WalletIcon />} />
        <StatCard title="Pending Verifications" value={pendingVerifications.toString()} icon={<TrendingUp />} />
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Wallet Data...</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold">No transactions found</td>
                </tr>
              ) : transactions.slice(0, 20).map(tx => (
                <tr key={tx._id} className="hover:bg-slate-50/80 transition-all">
                  <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">{tx._id.slice(-8)}</td>
                  <td className="px-6 py-4 font-bold text-slate-700 text-sm">{tx.userId?.name || 'User'}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500 uppercase">{tx.transactionType}</span>
                  </td>
                  <td className={`px-6 py-4 font-bold ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
