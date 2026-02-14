import React, { useMemo, useState, useEffect } from 'react';
import {
  Bell, CheckCircle2, Info, AlertTriangle,
  X, Filter, Trash2, Clock, Globe, Zap,
  Inbox, ChevronRight, Check, Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { callBackendAPI } from '../../api/apiClient.ts';

export const UserNotifications: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const resp = await callBackendAPI('/notifications', null, 'GET');
      setNotifications(resp || []);
    } catch (error) {
      console.error('Signal breach during telemetry fetch:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const filtered = useMemo(() => {
    if (activeTab === 'unread') return notifications.filter(n => !n.read);
    return notifications;
  }, [notifications, activeTab]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    try {
      await callBackendAPI('/notifications/mark-all-read', {}, 'POST');
      loadNotifications();
    } catch (error) {
      console.error('Batch read handshake failed:', error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await callBackendAPI(`/notifications/${id}`, null, 'DELETE');
      loadNotifications();
    } catch (error) {
      console.error('Node deletion failed:', error);
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={18} className="text-emerald-500" />;
      case 'warning': return <AlertTriangle size={18} className="text-amber-500" />;
      default: return <Info size={18} className="text-indigo-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">Alert Center</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">System Broadcasts & Node Lifecycle Feed</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            {['all', 'unread'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
            ))}
          </div>
          <button onClick={handleMarkAllRead} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2">
            <Check size={16} /> Mark All Read
          </button>
        </div>
      </div>

      <div className="space-y-4 relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-[3rem]">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          </div>
        )}
        {filtered.length === 0 ? (
          <div className="py-32 text-center bg-white rounded-[3rem] border border-slate-100 flex flex-col items-center gap-6 shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-indigo-100">
              <Bell size={40} className="opacity-20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Signal Protocol Clear</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">All system nodes are operating within nominal parameters.</p>
            </div>
          </div>
        ) : (
          filtered.map(notif => (
            <div key={notif._id} className={`p-8 bg-white rounded-[2.5rem] border transition-all flex items-start gap-6 group cursor-pointer ${notif.read ? 'border-slate-100 opacity-60 hover:opacity-100' : 'border-indigo-100 shadow-xl shadow-indigo-100/30'}`}>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm transition-transform group-hover:scale-105 ${notif.read ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                {getNotifIcon(notif.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">{notif.title}</h4>
                  <span className="text-[9px] font-black text-slate-300 uppercase shrink-0">#{notif._id.slice(-6).toUpperCase()}</span>
                </div>
                <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-2xl">{notif.message}</p>
                <div className="flex items-center gap-3 mt-4">
                  <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-widest border border-indigo-100">Node Sync</span>
                  <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(notif.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteNotification(notif._id)}
                className="mt-1 p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000"><Zap size={200} /></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="max-w-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20"><Globe size={24} /></div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Real-time Node Telemetry</h3>
            </div>
            <p className="text-blue-100 text-sm font-medium leading-relaxed uppercase tracking-tighter">Operational alerts are transmitted instantly across all authenticated device nodes for immediate response.</p>
          </div>
          <button className="px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-indigo-500 transition-all active:scale-95">Configure Channels</button>
        </div>
      </div>
    </div>
  );
};
