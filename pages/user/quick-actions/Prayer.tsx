import React, { useState, useEffect, useCallback } from 'react';
import { Moon, MapPin, Clock, Loader2, ChevronLeft, Bell, BellOff, Info, ShieldCheck, Settings, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../api/db.ts';

export const PrayerPage: React.FC = () => {
  const navigate = useNavigate();
  const [timings, setTimings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('Multan, Pakistan');
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('dibnow_prayer_notifs') === 'true');
  const [notifyLeadTime, setNotifyLeadTime] = useState(() => Number(localStorage.getItem('dibnow_prayer_lead') || 10));
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(typeof Notification !== 'undefined' ? Notification.permission : 'default');

  // --- ADDITIVE: NOTIFICATION ENGINE ---

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);
    if (permission === "granted") {
      setNotificationsEnabled(true);
      localStorage.setItem('dibnow_prayer_notifs', 'true');
      db.activity.log({ actionType: 'Prayer Alerts Enabled', moduleName: 'Spiritual', refId: 'NOTIF_NODE', status: 'Success' });
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('dibnow_prayer_notifs', 'false');
    }
  };

  const handleToggleNotifications = () => {
    const nextVal = !notificationsEnabled;
    if (nextVal) {
      requestNotificationPermission();
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem('dibnow_prayer_notifs', 'false');
      db.activity.log({ actionType: 'Prayer Alerts Disabled', moduleName: 'Spiritual', refId: 'NOTIF_NODE', status: 'Success' });
    }
  };

  const handleLeadTimeChange = (mins: number) => {
    setNotifyLeadTime(mins);
    localStorage.setItem('dibnow_prayer_lead', String(mins));
  };

  const scheduleNextCheck = useCallback((currentTimings: any) => {
    if (!notificationsEnabled || permissionStatus !== 'granted') return;

    const now = new Date();
    Object.entries(currentTimings).forEach(([name, time]: [string, any]) => {
      if (['Imsak', 'Midnight', 'Sunset', 'Sunrise'].includes(name)) return;

      const [hours, minutes] = time.split(':');
      const prayerTime = new Date();
      prayerTime.setHours(parseInt(hours), parseInt(minutes), 0);
      
      const diffMs = prayerTime.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      // Trigger notification if within the user-defined lead time window
      if (diffMins === notifyLeadTime && diffMs > 0) {
        new Notification(`🕌 ${name} Prayer Reminder`, {
          body: `${name} prayer will begin in ${notifyLeadTime} minutes.\nLocation: ${locationName}`,
          icon: "/favicon.ico"
        });
      }
    });
  }, [notificationsEnabled, permissionStatus, notifyLeadTime, locationName]);

  // --- EXISTING FETCH ENGINE (REFINED FALLBACKS) ---

  const fetchTimings = useCallback(async (lat?: number, lon?: number, city?: string, country?: string) => {
    setLoading(true);
    setError(null);
    try {
      let url = '';
      let source = 'Fallback (Multan)';
      
      if (lat && lon) {
        url = `https://api.aladhan.com/v1/timingsByAddress?address=${lat},${lon}&method=1&school=1`;
        setLocationName('Detected Location');
        source = 'Browser Auto-Detect';
      } else if (city) {
        url = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country || 'Pakistan'}&method=1&school=1`;
        setLocationName(`${city}, ${country}`);
        source = 'Manual Switch';
      } else {
        // Fallback default: Multan, Pakistan
        url = `https://api.aladhan.com/v1/timingsByCity?city=Multan&country=Pakistan&method=1&school=1`;
        setLocationName(`Multan, Pakistan`);
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setTimings(json.data.timings);
        db.activity.log({ 
          actionType: 'Prayer Sync', 
          moduleName: 'Spiritual', 
          refId: source, 
          status: 'Success' 
        });
      }
    } catch (e) {
      setError("Protocol mismatch: Unable to reach Aladhan nodes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchTimings(pos.coords.latitude, pos.coords.longitude),
        () => fetchTimings() // Default Multan
      );
    } else {
      fetchTimings();
    }
  }, [fetchTimings]);

  // Background check for notifications every minute
  useEffect(() => {
    if (timings && notificationsEnabled) {
      const interval = setInterval(() => scheduleNextCheck(timings), 60000);
      return () => clearInterval(interval);
    }
  }, [timings, notificationsEnabled, scheduleNextCheck]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 shadow-sm transition-all"><ChevronLeft /></button>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Prayer Command</h2>
            <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Regional Spiritual Node Localisation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`px-5 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 border ${notificationsEnabled ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-400 border-slate-100'}`}>
            {notificationsEnabled ? <Bell size={14} /> : <BellOff size={14} />}
            {notificationsEnabled ? 'Alerts Active' : 'Alerts Disabled'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full h-96 flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-300">
              <Loader2 className="animate-spin mb-4" size={40} />
              <span className="text-[10px] font-black uppercase tracking-widest">Handshaking with Aladhan Nodes...</span>
            </div>
          ) : timings && Object.entries(timings).filter(([k]) => !['Imsak', 'Midnight', 'Sunset'].includes(k)).map(([name, time]) => (
            <div key={name} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative border-b-4 hover:border-b-indigo-600">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 text-indigo-600"><Moon size={100} /></div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{name}</p>
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{time as string}</h3>
                <div className="mt-4 flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified Timing Node</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><MapPin size={150} /></div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">Current Coordinate Node</h4>
            <h2 className="text-3xl font-black tracking-tight">{locationName}</h2>
            <p className="text-slate-400 text-[10px] font-bold mt-4 leading-relaxed uppercase tracking-widest">Solar calculations provided by Karachi Method (Pakistan).</p>
            
            <div className="mt-10 grid grid-cols-1 gap-3">
               <button onClick={() => fetchTimings(undefined, undefined, 'Multan', 'Pakistan')} className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                 <RefreshCw size={14} /> Force Multan Node
               </button>
               <button onClick={() => fetchTimings(undefined, undefined, 'London', 'UK')} className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">London Node Switch</button>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
              <ShieldCheck size={20} className="text-indigo-600" />
              <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Protocol Audit</h4>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <Clock size={14} className="text-indigo-500" /> Method: University of Karachi
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <MapPin size={14} className="text-indigo-500" /> Timezone: Asia/Karachi (UTC+5)
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                <Info size={14} className="text-indigo-500" /> School: Hanafi (Method 1)
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
            <div className="flex gap-4">
              <Bell className="text-indigo-600 shrink-0" size={20} />
              <p className="text-[9px] font-bold text-indigo-700 uppercase leading-relaxed tracking-wider">
                System remains synchronized with global solar nodes. Calculations are accurate within +/- 2 minutes of atmospheric observation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- NEW ADDITIVE SECTION: PRAYER NOTIFICATION CONTROLS --- */}
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-8 md:p-10 animate-in slide-in-from-bottom-4 duration-700">
         <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
               <Settings size={24} />
            </div>
            <div>
               <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 leading-none">Notification Control Matrix</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Manage browser reminders and alerts</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
               <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div>
                    <h5 className="text-xs font-black uppercase text-slate-800">Enable Notifications</h5>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter mt-1">Receive technical reminders before prayer starts</p>
                  </div>
                  <button 
                    onClick={handleToggleNotifications}
                    className={`w-12 h-6 rounded-full relative transition-all ${notificationsEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notificationsEnabled ? 'left-7' : 'left-1'}`} />
                  </button>
               </div>
               
               {permissionStatus === 'denied' && (
                 <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
                   <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                   <p className="text-[9px] font-bold text-rose-600 uppercase leading-relaxed">
                     Browser permission denied. Please reset notification settings in your browser to enable this node.
                   </p>
                 </div>
               )}

               {notificationsEnabled && permissionStatus === 'granted' && (
                 <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                   <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                   <p className="text-[9px] font-bold text-emerald-600 uppercase leading-relaxed">
                     Reminders authorized. Ensure this browser tab remains active or open for the system pings to function.
                   </p>
                 </div>
               )}
            </div>

            <div className={`space-y-6 transition-opacity duration-300 ${!notificationsEnabled ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
               <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Notify Before Node Entry</h5>
               <div className="grid grid-cols-3 gap-3">
                  {[15, 10, 5].map(mins => (
                    <button 
                      key={mins}
                      onClick={() => handleLeadTimeChange(mins)}
                      className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${notifyLeadTime === mins ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
                    >
                      {mins} Minutes
                    </button>
                  ))}
               </div>
               <p className="text-[8px] font-bold text-slate-400 uppercase text-center tracking-tighter italic">
                 Note: Notification timing depends on local system clock accuracy.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};