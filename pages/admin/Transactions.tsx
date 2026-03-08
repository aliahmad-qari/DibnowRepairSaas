
import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Download, Filter, ArrowUpRight, ArrowDownLeft, ExternalLink } from 'lucide-react';
import { adminApi } from '../../api/adminApi';

export const AdminTransactions: React.FC = () => {
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

  const today = new Date();
  const dailyRevenue = transactions
    .filter(t => {
      const txDate = new Date(t.createdAt);
      return txDate.toDateString() === today.toDateString() && t.status === 'completed';
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const refundRate = transactions.length > 0
    ? ((transactions.filter(t => t.status === 'refunded').length / transactions.length) * 100).toFixed(1)
    : 0;

  const activeTopups = transactions.filter(t => t.transactionType === 'wallet_topup' && t.status === 'completed').length;

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
            <h3 className="text-2xl font-bold">${dailyRevenue.toFixed(2)}</h3>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">Today</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Refund Rate</p>
          <div className="flex items-center gap-2 mt-2">
            <h3 className="text-2xl font-bold">{refundRate}%</h3>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">Good</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Active Top-ups</p>
          <div className="flex items-center gap-2 mt-2">
            <h3 className="text-2xl font-bold">{activeTopups}</h3>
            <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">Total</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <p className="text-slate-500 text-sm font-medium">Total Transactions</p>
          <div className="flex items-center gap-2 mt-2">
            <h3 className="text-2xl font-bold">{transactions.length}</h3>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full font-bold">All Time</span>
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-slate-400 font-bold">No transactions found</td>
                </tr>
              ) : transactions.map((tx) => (
                <tr key={tx._id} className="hover:bg-slate-50/80 transition-all">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-indigo-600">{tx._id.slice(-8)}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{tx.userId?.name || 'User'}</p>
                  </td>
                  <td className="px-6 py-4 capitalize text-xs font-medium text-slate-500">{tx.transactionType?.replace('_', ' ')}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">${(tx.amount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-md font-bold text-slate-600 uppercase tracking-tighter">{tx.paymentMethod}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center w-fit gap-1 ${tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : tx.status === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' ? 'bg-emerald-500' : tx.status === 'failed' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-medium whitespace-nowrap">{new Date(tx.createdAt).toLocaleString()}</td>
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
