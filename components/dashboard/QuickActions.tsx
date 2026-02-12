
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Moon, Book, Fingerprint, CloudSun, Box, 
  History, LifeBuoy, User as UserIcon,
  PlusCircle, CreditCard, Wrench, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { db } from '../../api/db.ts';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const actions = [
    { id: 'prayer', label: 'Prayer', icon: Moon, path: '/user/quick/prayer', color: 'bg-emerald-50 text-emerald-600', hover: 'hover:bg-emerald-600 shadow-emerald-200' },
    { id: 'quran', label: 'Quran', icon: Book, path: '/user/quick/quran', color: 'bg-indigo-50 text-indigo-600', hover: 'hover:bg-indigo-600 shadow-indigo-200' },
    { id: 'tasbeeh', label: 'Tasbeeh', icon: Fingerprint, path: '/user/quick/tasbeeh', color: 'bg-amber-50 text-amber-600', hover: 'hover:bg-amber-600 shadow-amber-200' },
    { id: 'weather', label: 'Weather', icon: CloudSun, path: '/user/quick/weather', color: 'bg-blue-50 text-blue-600', hover: 'hover:bg-blue-600 shadow-blue-200' },
    { id: 'packages', label: 'Packages', icon: Box, path: '/user/pricing', color: 'bg-purple-50 text-purple-600', hover: 'hover:bg-purple-600 shadow-purple-200' },
    { id: 'history', label: 'History', icon: History, path: '/user/quick/history', color: 'bg-slate-50 text-slate-600', hover: 'hover:bg-slate-600 shadow-slate-200' },
    { id: 'support', label: 'Support', icon: LifeBuoy, path: '/user/quick/support', color: 'bg-rose-50 text-rose-600', hover: 'hover:bg-rose-600 shadow-rose-200' },
    { id: 'profile', label: 'Profile', icon: UserIcon, path: '/user/quick/profile', color: 'bg-cyan-50 text-cyan-600', hover: 'hover:bg-cyan-600 shadow-cyan-200' },
  ];

  // ONLY ADD: Smart Contextual Action Logic
  const smartActions = useMemo(() => {
    const list = [];
    const repairs = db.repairs.getAll();
    const inventory = db.inventory.getAll();

    if ((user?.walletBalance || 0) < 50) {
      list.push({
        id: 'smart-topup',
        label: 'Top Up Wallet',
        icon: CreditCard,
        path: '/user/wallet',
        color: 'bg-blue-600 text-white',
        pulse: true
      });
    }

    if (repairs.some(r => r.status.toLowerCase() === 'pending')) {
      list.push({
        id: 'smart-repairs',
        label: 'Process Queue',
        icon: Wrench,
        path: '/user/repairs',
        color: 'bg-orange-600 text-white',
        pulse: false
      });
    }

    if (inventory.some(i => i.stock < 5)) {
      list.push({
        id: 'smart-stock',
        label: 'Restock Now',
        icon: PlusCircle,
        path: '/user/inventory',
        color: 'bg-emerald-600 text-white',
        pulse: false
      });
    }

    return list;
  }, [user, navigate]);

  return (
    <div className="space-y-6">
      {/* ONLY ADD: Smart Action Recommendations Strip */}
      {smartActions.length > 0 && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-2 px-2">
            <AlertCircle size={14} className="text-blue-500" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Smart Priority Actions</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {smartActions.map((action) => (
              <button
                key={action.id}
                onClick={() => navigate(action.path)}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl ${action.color} shadow-xl hover:scale-105 transition-all active:scale-95 group relative overflow-hidden`}
              >
                {action.pulse && <span className="absolute inset-0 bg-white/20 animate-pulse" />}
                <action.icon size={16} className="relative z-10" />
                <span className="text-[10px] font-black uppercase tracking-widest relative z-10">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Quick Utility Infrastructure</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center justify-center p-6 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm transition-all duration-300 group hover:shadow-2xl hover:-translate-y-2 ${action.hover.split(' ')[0]}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${action.color} group-hover:bg-white/20 group-hover:text-white`}>
                <action.icon size={22} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest group-hover:text-white transition-colors">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
