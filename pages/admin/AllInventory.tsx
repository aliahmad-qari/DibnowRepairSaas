
import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, Layers, DollarSign, Store, Tag } from 'lucide-react';
import { adminApi } from '../../api/adminApi';

export const AllInventory: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await adminApi.getAllInventory();
        setItems(data);
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      }
    };
    fetchInventory();
  }, []);

  const totalAssetValue = items.reduce((sum, item) => sum + (item.price * item.stock), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Global Inventory Ledger</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Cross-shop stock monitoring and valuation.</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Filter by product or SKU..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none" />
          </div>
          <div className="flex gap-4">
             <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Asset Value</p>
                <p className="text-lg font-black text-indigo-600">£{totalAssetValue.toFixed(2)}</p>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] border-b border-slate-50">
              <tr>
                <th className="px-8 py-5">Product Details</th>
                <th className="px-8 py-5">Original Shop</th>
                <th className="px-8 py-5 text-center">Category</th>
                <th className="px-8 py-5 text-center">In Stock</th>
                <th className="px-8 py-5 text-right">Unit Price</th>
                <th className="px-8 py-5 text-right">Asset Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-bold">No inventory found</td>
                </tr>
              ) : items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                        <Package size={20} />
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">{item.sku || item._id.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-tight">
                       <Store size={14} className="text-slate-400" />
                       Shop #{item.ownerId?.slice(-6) || 'N/A'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <p className={`font-black text-sm ${item.stock < 10 ? 'text-rose-600' : 'text-slate-800'}`}>{item.stock}</p>
                  </td>
                  <td className="px-8 py-6 text-right font-bold text-slate-600 text-sm">£{item.price.toFixed(2)}</td>
                  <td className="px-8 py-6 text-right font-black text-slate-900 text-sm">£{(item.price * item.stock).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
