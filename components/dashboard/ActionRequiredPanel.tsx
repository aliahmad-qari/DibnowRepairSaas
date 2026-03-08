
import React, { useMemo } from 'react';
import { 
  AlertCircle, 
  Package, 
  Wrench, 
  Clock, 
  MessageSquare, 
  ChevronRight,
  ShieldAlert,
  ArrowUpCircle
} from 'lucide-react';
import { db } from '../../api/db.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';

export const ActionRequiredPanel: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const alerts = useMemo(() => {
    const list = [];
    const inventory = db.inventory.getAll();
    const repairs = db.repairs.getAll();
    const tickets = db.supportTickets.getByUser(user?.id || '');
    
    // 1. Low Stock Logic
    const lowStockCount = inventory.filter(i => i.stock < 5).length;
    if (lowStockCount > 0) {
      list.push({
        id: 'low-stock',
        title: 'Inventory Depletion',
        message: `${lowStockCount} items have fallen below the critical stock threshold.`,
        icon: Package,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        border: 'border-rose-100',
        path: '/user/inventory'
      });
    }

    // 2. Pending Repairs Logic
    const pendingRepairs = repairs.filter(r => r.status.toLowerCase() === 'pending').length;
    if (pendingRepairs > 0) {
      list.push({
        id: 'pending-repairs',
        title: 'Unattended Repairs',
        message: `There are ${pendingRepairs} pending devices awaiting technical assessment.`,
        icon: Wrench,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-100',
        path: '/user/repairs'
      });
    }

    // 3. Subscription Expiry Logic (Mock check for 7 days)
    // In a real app we'd compare user.expiryDate
    list.push({
      id: 'sub-expiry',
      title: 'Subscription Status',
      message: 'Your current operational tier cycle is coming to an end in 7 days.',
      icon: Clock,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
      path: '/user/pricing'
    });

    // 4. Unread Support Tickets
    const unreadCount = tickets.filter(t => t.status === 'pending').length;
    if (unreadCount > 0) {
      list.push({
        id: 'unread-tickets',
        title: 'Support Correspondence',
        message: `You have ${unreadCount} support cases awaiting administrative response.`,
        icon: MessageSquare,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-100',
        path: '/user/tickets'
      });
    }

    return list;
  }, [user]);

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-lg">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Action Required</h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Critical Protocol Alerts</p>
          </div>
        </div>
        <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black">{alerts.length}</span>
      </div>

      <div className="p-6 space-y-4">
        {alerts.length === 0 ? (
          <div className="py-12 text-center text-slate-300">
            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-[10px] font-black uppercase tracking-widest">System Protocols Nominal</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id}
              onClick={() => navigate(alert.path)}
              className={`p-5 rounded-[1.8rem] border ${alert.border} ${alert.bg} flex items-start gap-4 cursor-pointer hover:scale-[1.02] transition-all group`}
            >
              <div className={`mt-1 w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100`}>
                <alert.icon size={18} className={alert.color} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className={`text-[11px] font-black uppercase tracking-tight ${alert.color}`}>{alert.title}</h4>
                <p className="text-xs font-bold text-slate-600 leading-relaxed mt-1">{alert.message}</p>
              </div>
              <ChevronRight className="mt-4 text-slate-300 group-hover:text-slate-600 transition-colors" size={16} />
            </div>
          ))
        )}
      </div>
      
      <div className="p-6 mt-auto bg-slate-50/50 border-t border-slate-50">
        <button 
          onClick={() => navigate('/user/pricing')}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all"
        >
          <ArrowUpCircle size={14} /> Tier Optimization
        </button>
      </div>
    </div>
  );
};

const CheckCircle2 = ({ size, className }: any) => <AlertCircle size={size} className={className} />;
