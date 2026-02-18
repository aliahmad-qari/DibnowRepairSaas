
import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, TrendingUp, Store, Clock } from 'lucide-react';
import { adminApi } from '../../api/adminApi';

export const AllSales: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getAllSales();
        setSales(data);
      } catch (error) {
        console.error('Failed to fetch sales:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const avgOrderValue = sales.length > 0 ? totalRevenue / sales.length : 0;

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
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Revenue</p>
                 <p className="text-xl font-black text-emerald-600 tracking-tight">£{totalRevenue.toFixed(2)}</p>
              </div>
              <div className="h-10 w-px bg-slate-200" />
              <div className="text-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Avg. Order Value</p>
                 <p className="text-xl font-black text-indigo-600 tracking-tight">£{avgOrderValue.toFixed(2)}</p>
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Sales...</p>
                    </div>
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold">No sales found</td>
                </tr>
              ) : sales.map((sale) => (
                <tr key={sale._id} className="hover:bg-slate-50 transition-all group">
                  <td className="px-8 py-6">
                    <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tighter">{sale.invoiceNumber || sale._id.slice(-8)}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm tracking-tight">
                       <Store size={14} className="text-slate-400" />
                       Shop #{sale.ownerId?.slice(-6) || 'N/A'}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-600">{sale.productName || 'Product'}</p>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 text-sm">
                    £{(sale.total || 0).toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600">
                       Completed
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {new Date(sale.date || sale.createdAt).toLocaleDateString()}
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
