
import React, { useMemo, useState, useEffect } from 'react';
import {
  Receipt, Download, FileText, Search, Filter,
  ChevronRight, Calendar, DollarSign, CheckCircle2,
  Clock, XCircle, Info, Hash, Printer, Mail
} from 'lucide-react';
import { callBackendAPI } from '../../api/apiClient.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Loader2 } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext.tsx';
import { BackButton } from '../../components/common/BackButton';

export const UserInvoices: React.FC = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');

  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const userId = user._id || user.id;
        
        // Load data from multiple sources
        const [transactions, repairs, sales] = await Promise.all([
          callBackendAPI(`/api/wallet/${userId}/transactions`, null, 'GET').catch(() => []),
          callBackendAPI('/api/repairs', null, 'GET').catch(() => []),
          callBackendAPI('/api/sales', null, 'GET').catch(() => [])
        ]);
        
        const allInvoices: any[] = [];
        
        // Process wallet transactions (plans, top-ups)
        const transArray = Array.isArray(transactions) ? transactions : (transactions?.data || []);
        transArray.forEach((t: any) => {
          if (t.transactionType === 'subscription' || t.transactionType === 'wallet_topup' ||
              (t.description || '').toLowerCase().includes('refill') ||
              (t.description || '').toLowerCase().includes('subscription') ||
              (t.description || '').toLowerCase().includes('upgrade')) {
            allInvoices.push({
              id: t._id,
              type: 'plan_purchase',
              title: t.description || 'Plan Purchase',
              amount: t.amount,
              date: t.createdAt,
              status: t.status,
              invoiceNumber: `PLN-${t._id.slice(-8)}`
            });
          }
        });
        
        // Process completed repairs
        const repairsRaw = Array.isArray(repairs) ? repairs : (repairs?.repairs || repairs?.data || []);
        repairsRaw.forEach((r: any) => {
          if (r.status === 'completed' || r.status === 'delivered') {
            allInvoices.push({
              id: r._id,
              type: 'repair',
              title: `Repair: ${r.deviceType || r.device || 'Device'}`,
              amount: r.totalCost || r.cost || r.finalCost || 0,
              date: r.completedAt || r.updatedAt || r.createdAt,
              status: 'paid',
              invoiceNumber: `REP-${r._id.slice(-8)}`
            });
          }
        });
        
        // Process inventory sales
        const salesRaw = Array.isArray(sales) ? sales : (sales?.sales || sales?.data || []);
        salesRaw.forEach((s: any) => {
          allInvoices.push({
            id: s._id,
            type: 'inventory_sale',
            title: `Sale: ${s.productName || 'Product'}`,
            amount: s.total || 0,
            date: s.date || s.createdAt,
            status: 'paid',
            invoiceNumber: `SAL-${s._id.slice(-8)}`
          });
        });
        
        // Sort by date (newest first)
        allInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setInvoices(allInvoices);
      } catch (error) {
        console.error('Failed to load fiscal trace:', error);
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadInvoices();
  }, [user]);

  const filteredInvoices = invoices.filter(inv =>
    (inv.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv._id || inv.id || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = (inv: any) => {
    alert(`Generating Document Node for Invoice: ${inv.id}\nProtocol: Authorized PDF Stream.`);
    window.print();
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-20 px-4">
      <div className="pt-4">
        <BackButton />
      </div>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Fiscal Documents</h2>
          <p className="text-slate-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-[0.2em] mt-2 flex items-center justify-center lg:justify-start gap-2">
            <Receipt size={12} className="text-indigo-600 shrink-0" /> Subscription & Transaction Registry
          </p>
        </div>
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Query Invoice ID or Ref..."
            className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white border-2 border-slate-100 rounded-xl sm:rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm font-bold shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 whitespace-nowrap">
              <tr>
                <th className="px-6 sm:px-10 py-6">Document Node</th>
                <th className="px-6 sm:px-10 py-6">Operational Date</th>
                <th className="px-6 sm:px-10 py-6 text-right">Settlement</th>
                <th className="px-6 sm:px-10 py-6 text-center">Protocol Status</th>
                <th className="px-6 sm:px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 whitespace-nowrap">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center opacity-30">
                    <FileText size={48} className="mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No Fiscal Nodes Identified</p>
                  </td>
                </tr>
              ) : filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-6 sm:px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
                        <Hash size={16} sm:size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 text-sm uppercase truncate">{inv.title}</p>
                        <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase mt-1">ID: {inv._id || inv.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 sm:px-10 py-7">
                    <p className="text-[11px] sm:text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
                      <Calendar size={14} className="text-slate-300" /> {new Date(inv.createdAt || inv.date).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 sm:px-10 py-7 text-right">
                    <p className="text-sm sm:text-base font-black text-slate-900 tracking-tighter">
                      {currency.symbol}{Math.abs(inv.amount).toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 sm:px-10 py-7 text-center">
                    <span className={`px-3 sm:px-4 py-1.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase inline-flex items-center gap-2 border ${inv.status === 'completed' || inv.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${inv.status === 'completed' || inv.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 sm:px-10 py-7 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handlePrint(inv)} className="p-2 sm:p-3 bg-white border border-slate-100 rounded-lg sm:rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                        <Download size={16} sm:size={18} />
                      </button>
                      <button className="p-2 sm:p-3 bg-white border border-slate-100 rounded-lg sm:rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                        <Mail size={16} sm:size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 text-white relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <Info size={150} />
        </div>
        <h4 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-4">Billing Node Policy</h4>
        <p className="text-xs sm:text-sm font-medium leading-relaxed max-w-2xl opacity-70 uppercase tracking-tighter">
          Digital receipts are immutable nodes logged on our secure commerce cluster. For custom business branding on invoices, please configure your identity profile in shop settings.
        </p>
      </div>
    </div>
  );
};
