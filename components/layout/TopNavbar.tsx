import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, ChevronDown, User, Zap, LogOut, Settings, 
  UserCircle, Inbox, Check, Shield, Info, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../api/db';
import { callBackendAPI } from '../../api/apiClient';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from '../../types.ts';

export const TopNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load plan from backend based on user.planId
  useEffect(() => {
    const loadPlan = async () => {
      if (user?.planId) {
        try {
          const response = await callBackendAPI('/api/plans/all', null, 'GET');
          if (response.success && response.plans) {
            const plan = response.plans.find((p: any) => p._id === user.planId);
            setCurrentPlan(plan || null);
          }
        } catch (error) {
          console.error('Failed to load plan:', error);
          // Fallback to localStorage
          setCurrentPlan(db.plans.getById(user.planId || 'starter'));
        }
      } else {
        setCurrentPlan(null);
      }
    };

    loadPlan();
  }, [user?.planId]); // Re-run when planId changes

  // Load notifications from backend
  useEffect(() => {
    const loadNotifs = async () => {
      if (user) {
        try {
          const response = await callBackendAPI('/api/notifications', null, 'GET');
          if (response && Array.isArray(response)) {
            setNotifications(response);
          }
        } catch (error) {
          console.error('Failed to load notifications:', error);
          // Fallback to localStorage
          setNotifications(db.notifications.getByUser(user.id));
        }
      }
    };

    loadNotifs();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifs, 30000);
    
    // Close dropdowns on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id: string) => {
    try {
      await callBackendAPI(`/api/notifications/${id}/read`, null, 'PUT');
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Fallback to localStorage
      db.notifications.markAsRead(id);
    }
  };

  const handleMarkAllRead = async () => {
    if (user) {
      try {
        await callBackendAPI('/api/notifications/mark-all-read', null, 'PUT');
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (error) {
        console.error('Failed to mark all as read:', error);
        // Fallback to localStorage
        db.notifications.markAllAsRead(user.id);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-[100] shadow-sm">
      {/* Plan Status Group - Conditional visibility */}
      <div className="flex items-center gap-5">
        {user?.role === UserRole.USER && (
          <>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Active Ecosystem</span>
              <span className="text-slate-900 font-bold text-xl tracking-tight leading-none">
                {currentPlan?.name || 'Free Trial'}
              </span>
            </div>
            <button 
              onClick={() => navigate('/user/pricing')}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all"
            >
              Upgrade Plan
            </button>
          </>
        )}
        
        {user?.role === UserRole.ADMIN && (
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest leading-none mb-1">System Authority</span>
            <span className="text-slate-900 font-bold text-xl tracking-tight leading-none">Command Center</span>
          </div>
        )}
      </div>

      {/* Global Actions Group */}
      <div className="flex items-center gap-6">
        
        {/* Notification Bell Dropdown */}
        <div className="relative" ref={notifRef}>
          <div 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isNotifOpen ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                <Bell size={20} strokeWidth={2.5} />
              </div>
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </div>
            <div className="hidden md:flex items-center gap-1">
              <span className="text-xs font-black uppercase text-slate-700 group-hover:text-indigo-600 transition-colors tracking-widest">Feed</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isNotifOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* NOTIFICATION PANEL */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white border border-slate-100 rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Operational Alerts</h3>
                  <button onClick={handleMarkAllRead} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Clear Inbox</button>
               </div>
               <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                       <Inbox size={40} className="mx-auto mb-3 opacity-20" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Protocol is Clear</p>
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n._id || n.id} 
                        onClick={() => handleMarkRead(n._id || n.id)}
                        className={`p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0 ${!n.read ? 'bg-indigo-50/20' : ''}`}
                      >
                         <div className="mt-1 w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
                            {getNotifIcon(n.type)}
                         </div>
                         <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{n.title}</p>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1">{n.message}</p>
                            <p className="text-[9px] text-slate-300 font-black uppercase mt-2">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                         </div>
                      </div>
                    ))
                  )}
               </div>
               <div className="p-4 bg-white border-t border-slate-50 text-center">
                  <Link to="/user/tickets" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">View All Case Files</Link>
               </div>
            </div>
          )}
        </div>

        <div className="h-10 w-px bg-slate-100" />

        {/* User Identity Toggle Dropdown */}
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-4 cursor-pointer group"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all ${isProfileOpen ? 'bg-indigo-600 border-indigo-600' : 'bg-indigo-50 border-indigo-100 group-hover:border-indigo-300'} overflow-hidden shadow-sm`}>
               {user?.avatar ? (
                 <img src={user.avatar} className="w-full h-full object-cover" alt="Profile" />
               ) : (
                 <User size={22} strokeWidth={2.5} className={isProfileOpen ? 'text-white' : 'text-indigo-600'} />
               )}
            </div>
            <div className="hidden lg:block">
               <p className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">{user?.name}</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{user?.subRole || user?.role}</p>
            </div>
            <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isProfileOpen ? 'rotate-180 text-indigo-500' : ''}`} />
          </div>

          {/* PROFILE DROPDOWN */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-4 w-64 bg-white border border-slate-100 rounded-[2rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
               <div className="p-6 border-b border-slate-50 bg-slate-50/30">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated Node</p>
                  <p className="text-sm font-black text-slate-900 truncate uppercase">{user?.email}</p>
               </div>
               
               <div className="p-3">
                  <button 
                    onClick={() => { navigate(user?.role === UserRole.ADMIN ? '/admin/dashboard' : '/user/dashboard'); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                  >
                    <UserCircle size={18} /> My Registry Profile
                  </button>
                  <button 
                    onClick={() => { navigate(user?.role === UserRole.ADMIN ? '/admin/settings' : '/user/utilities'); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                  >
                    <Settings size={18} /> {user?.role === UserRole.ADMIN ? 'System Settings' : 'Shop Configurations'}
                  </button>
                  <button 
                    onClick={() => { navigate(user?.role === UserRole.ADMIN ? '/admin/dashboard' : '/user/pricing'); setIsProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 transition-all"
                  >
                    <Shield size={18} /> {user?.role === UserRole.ADMIN ? 'Security Center' : 'Security & License'}
                  </button>
               </div>

               <div className="p-3 border-t border-slate-50">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 transition-all"
                  >
                    <LogOut size={18} /> De-authorize Session
                  </button>
               </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};