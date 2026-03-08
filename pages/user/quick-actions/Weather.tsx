
import React, { useState, useEffect, useMemo } from 'react';
import { Cloud, Sun, Wind, Droplets, MapPin, ChevronLeft, Loader2, Thermometer, CloudSun, Sunrise, Sunset, Radio, Zap, ShieldCheck, Timer, Waves, AlertTriangle, Calendar, Navigation, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext.tsx';
import { callBackendAPI } from '../../../api/apiClient.ts';

export const WeatherPage: React.FC = () => {
   const navigate = useNavigate();
   const { user } = useAuth();
   const [weather, setWeather] = useState<any>(null);
   const [loading, setLoading] = useState(true);

   // --- NEW ADDITIVE STATE: REAL-TIME ENGINE ---
   const [locationError, setLocationError] = useState(false);
   const [lastSync, setLastSync] = useState<string>('');

   // --- NEW ADDITIVE STATE: ADVANCED ANALYTICS & CACHING ---
   const [hourlyData, setHourlyData] = useState<any[]>([]);
   const [dailyForecast, setDailyForecast] = useState<any[]>([]);
   const [alerts, setAlerts] = useState<any[]>([]);
   const [isOffline, setIsOffline] = useState(false);

   // --- NEW ADDITIVE LOGIC: FETCH ENGINE ---
   const fetchWeatherData = async (lat?: number, lon?: number) => {
      try {
         const latitude = lat || 30.1575;
         const longitude = lon || 71.5249;

         const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`);

         const data = await res.json();

         if (data && data.current) {
            const processedWeather = {
               temp: Math.round(data.current.temperature_2m),
               condition: getWeatherCondition(data.current.weather_code),
               humidity: data.current.relative_humidity_2m,
               wind: data.current.wind_speed_10m,
               location: (lat && lon) ? 'Detected Node' : 'Multan, Pakistan',
               pressure: `${Math.round(data.current.surface_pressure)} hPa`,
               visibility: '12km',
               sunrise: data.daily.sunrise[0].split('T')[1],
               sunset: data.daily.sunset[0].split('T')[1],
               uvIndex: data.daily.uv_index_max[0],
               cloudCover: data.current.cloud_cover,
               dewPoint: '14°C',
               aqi: 'Moderate'
            };

            setWeather(processedWeather);

            // --- ADDITIVE: HOURLY DATA ---
            const hourly = data.hourly.time.slice(0, 24).map((t: string, i: number) => ({
               time: t.split('T')[1],
               temp: Math.round(data.hourly.temperature_2m[i]),
               condition: getWeatherCondition(data.hourly.weather_code[i]),
               prob: data.hourly.precipitation_probability[i]
            }));
            setHourlyData(hourly);

            // --- ADDITIVE: DAILY DATA ---
            const daily = data.daily.time.map((t: string, i: number) => ({
               date: new Date(t).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }),
               max: Math.round(data.daily.temperature_2m_max[i]),
               min: Math.round(data.daily.temperature_2m_min[i]),
               condition: getWeatherCondition(data.daily.weather_code[i])
            }));
            setDailyForecast(daily);

            // --- ADDITIVE: ALERTS LOGIC ---
            const activeAlerts = [];
            if (data.current.temperature_2m > 38) activeAlerts.push({ type: 'Heatwave', msg: 'Extreme thermal node detected. Limit outdoor exposure.' });
            if (data.current.precipitation > 0) activeAlerts.push({ type: 'Rainfall', msg: 'Active precipitation detected in area node.' });
            setAlerts(activeAlerts);

            // --- ADDITIVE: BACKEND CACHING ---
            if (user) {
               callBackendAPI(`/users/${user._id || user.id}`, {
                  metadata: {
                     ...user.metadata,
                     weatherCache: {
                        weather: processedWeather,
                        hourly,
                        daily,
                        timestamp: new Date().toISOString()
                     }
                  }
               }, 'PUT').catch(e => console.error('Weather cache sync failed:', e));
            }

            setLastSync(new Date().toLocaleTimeString());
            setIsOffline(false);
            await callBackendAPI('/activities', {
               actionType: 'Atmospheric Sync',
               moduleName: 'Meteorological',
               refId: 'WTHR_NODE',
               status: 'Success'
            });
         }
      } catch (err) {
         console.error("Satellite Handshake Failure:", err);
         // --- ADDITIVE: OFFLINE CACHE RESTORATION FROM USER METADATA ---
         if (user?.metadata?.weatherCache) {
            const parsed = user.metadata.weatherCache;
            setWeather(parsed.weather);
            setHourlyData(parsed.hourly);
            setDailyForecast(parsed.daily);
            setIsOffline(true);
            setLastSync(new Date(parsed.timestamp).toLocaleTimeString());
         }
      } finally {
         setLoading(false);
      }
   };

   const getWeatherCondition = (code: number) => {
      if (code === 0) return 'Clear Sky';
      if (code <= 3) return 'Partly Cloudy';
      if (code <= 48) return 'Foggy';
      if (code <= 67) return 'Rainy';
      if (code <= 77) return 'Snowy';
      return 'Stormy';
   };

   useEffect(() => {
      if (navigator.geolocation) {
         navigator.geolocation.getCurrentPosition(
            (pos) => fetchWeatherData(pos.coords.latitude, pos.coords.longitude),
            () => {
               setLocationError(true);
               fetchWeatherData();
            }
         );
      } else {
         fetchWeatherData();
      }

      const interval = setInterval(() => fetchWeatherData(), 600000);
      return () => clearInterval(interval);
   }, []);

   return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <button onClick={() => navigate(-1)} className="p-3 bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 shadow-sm transition-all"><ChevronLeft /></button>
               <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Atmospheric Analytics</h2>
                  <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">Satellite Meteorological Node</p>
               </div>
            </div>
            <div className="flex items-center gap-3">
               {isOffline && (
                  <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 flex items-center gap-2">
                     <History size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Offline Cache Mode</span>
                  </div>
               )}
               {lastSync && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                     <Timer size={14} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Last Sync: {lastSync}</span>
                  </div>
               )}
            </div>
         </div>

         {/* --- ADDITIVE: WEATHER ALERTS --- */}
         {alerts.length > 0 && (
            <div className="space-y-3">
               {alerts.map((alert, i) => (
                  <div key={i} className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2.5rem] flex items-center gap-5 animate-pulse">
                     <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><AlertTriangle size={24} /></div>
                     <div>
                        <h4 className="text-sm font-black text-rose-900 uppercase">Atmospheric Alert: {alert.type}</h4>
                        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1">{alert.msg}</p>
                     </div>
                  </div>
               ))}
            </div>
         )}

         {loading ? (
            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100 text-slate-300">
               <Loader2 className="animate-spin mb-4" size={48} />
               <p className="text-xs font-black uppercase tracking-[0.3em]">Interrogating Satellites...</p>
            </div>
         ) : (
            <>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-800 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl">
                     <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><Cloud size={350} /></div>
                     <div className="relative z-10 space-y-12">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3 bg-white/10 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
                              <MapPin size={18} className="text-blue-300" />
                              <span className="text-sm font-black uppercase tracking-widest">{weather.location}</span>
                           </div>
                           <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Status: Operational</div>
                        </div>

                        <div className="flex flex-col md:flex-row items-baseline gap-8">
                           <h1 className="text-[10rem] font-black tracking-tighter leading-none">{weather.temp}°</h1>
                           <div className="space-y-4">
                              <p className="text-4xl font-black uppercase tracking-tight">{weather.condition}</p>
                              <div className="flex gap-4">
                                 <span className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border border-white/10">Pressure: {weather.pressure}</span>
                                 <span className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border border-white/10">Visibility: {weather.visibility}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                     <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 shadow-sm hover:shadow-xl transition-all">
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-inner"><Wind size={32} /></div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Velocity</p>
                           <h3 className="text-2xl font-black text-slate-900">{weather.wind} km/h</h3>
                        </div>
                     </div>
                     <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 shadow-sm hover:shadow-xl transition-all">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-inner"><Droplets size={32} /></div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Humidity</p>
                           <h3 className="text-2xl font-black text-slate-900">{weather.humidity}%</h3>
                        </div>
                     </div>
                     <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 shadow-sm hover:shadow-xl transition-all">
                        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-[1.5rem] flex items-center justify-center shadow-inner"><Thermometer size={32} /></div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thermal Node</p>
                           <h3 className="text-2xl font-black text-slate-900">{weather.temp + 2}°C Feels</h3>
                        </div>
                     </div>
                  </div>
               </div>

               {/* --- ADDITIVE: HOURLY SLIDER SECTION --- */}
               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center"><Navigation size={20} /></div>
                     <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Hourly Atmospheric Flux</h4>
                  </div>
                  <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar">
                     {hourlyData.map((h, i) => (
                        <div key={i} className="min-w-[100px] p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col items-center gap-4 group hover:bg-indigo-600 hover:text-white transition-all">
                           <p className="text-[10px] font-black uppercase tracking-tighter opacity-50 group-hover:text-white">{h.time}</p>
                           <div className="group-hover:scale-110 transition-transform"><Cloud size={24} /></div>
                           <p className="text-2xl font-black">{h.temp}°</p>
                           <span className="text-[8px] font-bold uppercase group-hover:text-indigo-200">{h.prob}% Precip</span>
                        </div>
                     ))}
                  </div>
               </div>

               {/* --- ADDITIVE: 7-DAY FORECAST ANALYTICS --- */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center"><Calendar size={20} /></div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Extended Forecast Ledger</h4>
                     </div>
                     <div className="space-y-4">
                        {dailyForecast.map((d, i) => (
                           <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-400 transition-all">
                              <div className="flex items-center gap-6">
                                 <p className="text-[10px] font-black uppercase text-slate-400 min-w-[60px]">{d.date}</p>
                                 <CloudSun size={18} className="text-indigo-600" />
                                 <p className="text-[10px] font-black uppercase text-slate-800">{d.condition}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                 <span className="text-sm font-black text-slate-900">{d.max}°</span>
                                 <span className="text-sm font-black text-slate-400">{d.min}°</span>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                              <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Dew Point Analysis</h5>
                           </div>
                           <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Atmospheric Saturation</p>
                              <p className="text-2xl font-black text-slate-700">{weather.dewPoint}</p>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Cloud Coverage Node</h5>
                           </div>
                           <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                              <div className="flex justify-between items-end mb-2">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">Spatial Density</p>
                                 <p className="text-xl font-black text-slate-700">{weather.cloudCover}%</p>
                              </div>
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${weather.cloudCover}%` }} />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6 group hover:border-amber-400 transition-all">
                           <div className="flex items-center justify-between">
                              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Sunrise size={24} /></div>
                              <span className="text-[10px] font-black text-slate-400 uppercase">Sunrise</span>
                           </div>
                           <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{weather.sunrise}</h4>
                        </div>
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-6 group hover:border-indigo-400 transition-all">
                           <div className="flex items-center justify-between">
                              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Sunset size={24} /></div>
                              <span className="text-[10px] font-black text-slate-400 uppercase">Sunset</span>
                           </div>
                           <h4 className="text-3xl font-black text-slate-800 tracking-tighter">{weather.sunset}</h4>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex items-center justify-center gap-3 opacity-60">
                  <Zap size={14} className="text-indigo-600" />
                  <p className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest leading-relaxed">
                     {locationError ? 'Location Access Denied - Fallback protocol (Multan) initialized.' : 'Satellite Meteorological Node Active • Data synchronized with global atmospheric sensors.'}
                  </p>
               </div>
            </>
         )}
      </div>
   );
};
