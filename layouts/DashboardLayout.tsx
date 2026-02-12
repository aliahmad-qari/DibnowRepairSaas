
import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole, Permission } from '../types.ts';
import { TopNavbar } from '../components/layout/TopNavbar.tsx';
import { 
  LayoutDashboard, Rocket, Wrench, Package, ShoppingCart, 
  Layers, UsersRound, Wallet, Globe, MessageSquare,
  ShieldCheck, History, Tag, Boxes, ShieldHalf, LogOut, ChevronRight,
  UserCheck, Settings, ClipboardList, Menu, X, LifeBuoy, Coins,
  ShieldAlert, BarChart3, Receipt, Bell, User, Activity,
  LineChart, Terminal, BrainCircuit, Megaphone, ToggleRight
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: any;
  permission?: Permission;
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const userItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/user/dashboard', icon: LayoutDashboard },
    { name: 'Plan', path: '/user/pricing', icon: Rocket },
    { name: 'Repairs', path: '/user/repairs', icon: Wrench, permission: 'manage_repairs' },
    { name: 'Stock', path: '/user/inventory', icon: Package, permission: 'manage_inventory' },
    { name: 'Inventory', path: '/user/all-stock', icon: Boxes, permission: 'manage_inventory' },
    { name: 'POS', path: '/user/pos', icon: ShoppingCart, permission: 'manage_sales' },
    { name: 'Ledger', path: '/user/sold-items', icon: History, permission: 'manage_sales' },
    { name: 'Reports', path: '/user/reports', icon: BarChart3, permission: 'view_reports' },
    { name: 'Invoices', path: '/user/invoices', icon: Receipt, permission: 'manage_billing' },
    { name: 'Categories', path: '/user/categories', icon: Layers },
    { name: 'Brands', path: '/user/brands', icon: Tag },
    { name: 'Clients', path: '/user/clients', icon: ShieldCheck, permission: 'manage_team' },
    { name: 'Team V2', path: '/user/advanced-team', icon: ShieldHalf, permission: 'manage_team' },
    { name: 'Team', path: '/user/team', icon: UsersRound, permission: 'manage_team' },
    { name: 'Wallet', path: '/user/wallet', icon: Wallet, permission: 'manage_billing' },
    { name: 'Notifications', path: '/user/notifications', icon: Bell },
    { name: 'Activity', path: '/user/activity', icon: Activity, permission: 'view_reports' },
    { name: 'Utilities', path: '/user/utilities', icon: Globe },
    { name: 'Profile', path: '/user/profile', icon: User },
    { name: 'Support', path: '/user/tickets', icon: LifeBuoy },
    { name: 'Complaints', path: '/user/complaints', icon: MessageSquare },
  ];

  const adminItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Intelligence', path: '/admin/security-intel', icon: ShieldAlert, permission: 'manage_system' },
    { name: 'AI Insights', path: '/admin/ai-insights', icon: BrainCircuit, permission: 'manage_system' },
    { name: 'Users', path: '/admin/users', icon: UsersRound, permission: 'manage_system' },
    { name: 'Staff', path: '/admin/staff', icon: UserCheck, permission: 'manage_system' },
    { name: 'Repairs', path: '/admin/all-repairs', icon: Wrench, permission: 'manage_repairs' },
    { name: 'Inventory', path: '/admin/all-inventory', icon: Package, permission: 'manage_inventory' },
    { name: 'Sales', path: '/admin/all-sales', icon: ShoppingCart, permission: 'manage_sales' },
    { name: 'Reports', path: '/admin/reports', icon: LineChart, permission: 'view_reports' },
    { name: 'Pricing Plans', path: '/admin/plans', icon: Rocket, permission: 'manage_billing' },
    { name: 'Plan Requests', path: '/admin/plan-requests', icon: ClipboardList, permission: 'manage_billing' },
    { name: 'Wallet', path: '/admin/wallet', icon: Wallet, permission: 'manage_billing' },
    { name: 'Currency Rules', path: '/admin/currencies', icon: Coins, permission: 'manage_system' },
    { name: 'Audit Logs', path: '/admin/audit-logs', icon: Terminal, permission: 'manage_system' },
    { name: 'Announcements', path: '/admin/announcements', icon: Megaphone, permission: 'manage_system' },
    { name: 'Feature Flags', path: '/admin/feature-flags', icon: ToggleRight, permission: 'manage_system' },
    { name: 'Support Hub', path: '/admin/tickets', icon: LifeBuoy, permission: 'manage_support' },
    { name: 'Complaints', path: '/admin/complaints', icon: MessageSquare, permission: 'manage_support' },
    { name: 'Settings', path: '/admin/settings', icon: Settings, permission: 'manage_system' },
  ];

  const items = user?.role === UserRole.ADMIN ? adminItems : userItems;
  
  // GRANULAR PERMISSION FILTERING (Requirement 3)
  const filteredItems = items.filter(item => {
    if (user?.role === UserRole.SUPER_ADMIN) return true;
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-5 left-5 z-[200] p-3 bg-indigo-600 text-white rounded-xl shadow-2xl"
        aria-label="Toggle Menu"
      >
        {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      <aside className={`fixed inset-y-0 left-0 z-[150] w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 px-2 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black italic text-lg shadow-lg">Dib</div>
            <h1 className="font-black text-xl tracking-tighter text-slate-800">DibNow</h1>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                    isActive 
                      ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                  {item.name}
                  {isActive && <ChevronRight size={14} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 px-2 mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold uppercase overflow-hidden shrink-0">
                {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : user?.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-800 truncate uppercase">{user?.name}</p>
                <p className="text-[10px] font-bold text-slate-400 truncate uppercase">{user?.subRole || user?.role}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 transition-all"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col relative">
        <TopNavbar />
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>

      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140] lg:hidden animate-in fade-in"
        />
      )}
    </div>
  );
};
