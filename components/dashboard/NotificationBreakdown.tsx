
import React, { useMemo, useState } from 'react';
import { 
  Bell, CreditCard, Wrench, Package, Shield, 
  ChevronRight, Filter, Inbox, Search
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';

type NotificationCategory = 'all' | 'system' | 'payment' | 'repair' | 'inventory';

export const NotificationBreakdown: React.FC = () => {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');

  const notifications = useMemo(() => {
    return db.notifications.getByUser(user?.id || '');
  }, [user]);

  // Categorization Logic
  const categorized = useMemo(() => {
    const system = notifications.filter(n => 
      n.title.toLowerCase().includes('system') || n.title.toLowerCase().includes('authorized')
    );
    const payment = notifications.filter(n => 
      n.title.toLowerCase().includes('payout') || n.title.toLowerCase().includes('upgrade') || n.title.toLowerCase().includes('wallet')
    );
    const repair = notifications.filter(n => 
      n.title.toLowerCase().includes('repair') || n.title.toLowerCase().includes('ticket')
    );
    const inventory = notifications.filter(n => 
      n.title.toLowerCase().includes('stock') || n.title.toLowerCase().includes('inventory')
    );

    return { system, payment, repair, inventory };
  }, [notifications]);

  const filteredList = useMemo(() => {
    if (activeCategory === 'all') return notifications;
    return categorized[activeCategory as keyof typeof categorized] || [];
  }, [activeCategory, notifications, categorized]);

  const categories = [
    { id: 'all', label: 'All Feeds', icon: Bell, count: notifications.length, color: 'bg-indigo-600' },
    { id: 'system', label: 'System', icon: Shield, count: categorized.system.length, color: 'bg-slate-800' },
    { id: 'payment', label: 'Payments', icon: CreditCard, count: categorized.payment.length, color: 'bg-emerald-600' },
    { id: 'repair', label: 'Repairs', icon: Wrench, count: categorized.repair.length, color: 'bg-blue-600' },
    { id: 'inventory', label: 'Inventory', icon: Package, count: categorized.inventory.length, color: 'bg-orange-600' },
  ];

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in duration-700">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
            <Filter size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Notification Analysis</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-tighter">Categorized Protocol Stream</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-3 border-b border-slate-50">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as NotificationCategory)}
            className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${
              activeCategory === cat.id 
                ? 'bg-white border-indigo-600 scale-105 shadow-xl shadow-indigo-100' 
                : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'
            }`}
          >
            <cat.icon size={18} className={activeCategory === cat.id ? 'text-indigo-600' : ''} />
            <span className={`text-[8px] font-black uppercase tracking-widest ${activeCategory === cat.id ? 'text-slate-900' : ''}`}>{cat.label}</span>
            <span className={`px-2 py-0.5 rounded-md text-[7px] font-black ${activeCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
        {filteredList.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
            <Inbox size={48} />
            <p className="text-[10px] font-black uppercase tracking-widest">No logs in {activeCategory} node</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filteredList.map((n) => (
              <div key={n.id} className="p-6 flex items-start gap-4 hover:bg-slate-50/80 transition-all cursor-default group">
                <div className="mt-1 w-9 h-9 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
                  <Bell size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{n.title}</h4>
                    <span className="text-[8px] font-black text-slate-300 uppercase shrink-0">#{n.id.split('-')[1]}</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
