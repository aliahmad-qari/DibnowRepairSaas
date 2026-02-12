
import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  LayoutDashboard, Users, ShieldAlert, Globe, 
  Terminal, LogOut, ChevronRight, Menu, X, 
  Database, Activity, Lock, Settings, Building2, TrendingUp, CreditCard,
  Rocket, Coins, Megaphone, BrainCircuit, LifeBuoy, ToggleRight, ScrollText,
  UserCheck
} from 'lucide-react';

export const SuperAdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { name: 'Root Dashboard', path: '/superadmin/dashboard', icon: LayoutDashboard },
    { name: 'Global Users', path: '/superadmin/users', icon: Users },
    { name: 'Admin Management', path: '/superadmin/admin-management', icon: UserCheck },
    { name: 'Shop Ecosystem', path: '/superadmin/shops', icon: Building2 },
    { name: 'Revenue Analytics', path: '/superadmin/revenue', icon: TrendingUp },
    { name: 'Gateway Control', path: '/superadmin/payments', icon: CreditCard },
    { name: 'Pricing Tiers', path: '/superadmin/plans', icon: Rocket },
    { name: 'Currency Rules', path: '/superadmin/currencies', icon: Coins },
    { name: 'Broadcasts', path: '/superadmin/announcements', icon: Megaphone },
    { name: 'AI Monitor', path: '/superadmin/ai-monitor', icon: BrainCircuit },
    { name: 'Audit Master', path: '/superadmin/logs', icon: ScrollText },
    { name: 'Global Support', path: '/superadmin/support', icon: LifeBuoy },
    { name: 'Feature Flags', path: '/superadmin/feature-flags', icon: ToggleRight },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex overflow-hidden">
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-5 left-5 z-[200] p-3 bg-indigo-600 text-white rounded-xl shadow-2xl"
      >
        {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-[150] w-72 bg-slate-900 border-r border-white/5 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 px-2 mb-10">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-white font-black shadow-[0_0_20px_rgba(99,102,241,0.4)]">R</div>
            <h1 className="font-black text-xl tracking-tighter text-white uppercase">Root Node</h1>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' 
                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-slate-600'} />
                  {item.name}
                  {isActive && <ChevronRight size={12} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
            <div className="px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Operator</p>
                <p className="text-xs font-black text-white uppercase truncate">{user?.name}</p>
                <p className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">L-9 Authority</p>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-500/10 transition-all border border-transparent hover:border-rose-500/20"
            >
              <LogOut size={18} />
              Terminate Session
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 min-h-screen overflow-y-auto p-6 md:p-12 custom-scrollbar">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[140] lg:hidden" />
      )}
    </div>
  );
};
