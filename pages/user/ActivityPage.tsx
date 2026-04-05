import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ChevronLeft, User, Package, Wrench, Tag, Layers,
  Calendar, Clock, CheckCircle2, AlertTriangle, Info, Zap,
  Filter, Search, RefreshCw
} from 'lucide-react';
import { callBackendAPI } from '../../api/apiClient';
import { BackButton } from '../../components/common/BackButton';
import { useAuth } from '../../context/AuthContext';

export const UserActivity: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadActivities = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const response = await callBackendAPI('/api/activities', null, 'GET');
        setActivities(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Failed to load activities:', error);
        setActivities([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadActivities();
  }, [user]);

  const getActivityIcon = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'user login':
      case 'user logout':
        return <User size={18} className="text-blue-500" />;
      case 'stock item added':
      case 'stock item updated':
        return <Package size={18} className="text-emerald-500" />;
      case 'repair created':
      case 'repair updated':
        return <Wrench size={18} className="text-amber-500" />;
      case 'brand created':
        return <Tag size={18} className="text-indigo-500" />;
      case 'category created':
        return <Layers size={18} className="text-purple-500" />;
      case 'sale registered':
        return <CheckCircle2 size={18} className="text-green-500" />;
      default:
        return <Activity size={18} className="text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'failed':
      case 'error':
        return 'text-rose-600 bg-rose-50 border-rose-100';
      case 'pending':
        return 'text-amber-600 bg-amber-50 border-amber-100';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = filter === 'all' || activity.moduleName?.toLowerCase() === filter.toLowerCase();
    const matchesSearch = !searchTerm || 
      activity.actionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.moduleName?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await callBackendAPI('/api/activities', null, 'GET');
      setActivities(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to refresh activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-32 animate-in fade-in duration-500 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pt-4">
        <BackButton />
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase leading-tight">Activity Monitor</h2>
          <p className="text-slate-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest mt-1">
            System Event Stream & User Actions
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 relative group w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} sm:size={20} />
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 sm:pl-14 pr-6 py-3 sm:py-4 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 text-sm font-bold transition-all"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex-1 lg:flex-none flex items-center gap-2 px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl">
            <Filter size={16} className="text-slate-400 shrink-0" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-transparent text-[9px] sm:text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
            >
              <option value="all">All Modules</option>
              <option value="inventory">Inventory</option>
              <option value="repairs">Repairs</option>
              <option value="brands">Brands</option>
              <option value="categories">Categories</option>
              <option value="sales">Sales</option>
              <option value="auth">Authentication</option>
            </select>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-3 sm:p-3.5 bg-indigo-600 text-white rounded-xl sm:rounded-2xl hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 shrink-0"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden border-b-8 border-b-indigo-600">
        {isLoading ? (
          <div className="p-20 text-center">
            <Activity className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="p-20 text-center">
            <Activity size={48} className="mx-auto mb-4 opacity-20 text-slate-400" />
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">No Activities Found</h4>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
              {searchTerm || filter !== 'all' ? 'Try adjusting your filters' : 'No system events recorded yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100 whitespace-nowrap">
                <tr>
                  <th className="px-6 sm:px-10 py-6">Activity</th>
                  <th className="px-6 py-6">Module</th>
                  <th className="px-6 py-6 text-center">Status</th>
                  <th className="px-6 py-6">User</th>
                  <th className="px-6 sm:px-10 py-6 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 whitespace-nowrap">
                {filteredActivities.map((activity, index) => (
                  <tr key={activity._id || index} className="hover:bg-indigo-50/30 transition-all group">
                    <td className="px-6 sm:px-10 py-7">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 rounded-lg sm:rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-white transition-all shrink-0">
                          {getActivityIcon(activity.actionType)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 text-sm tracking-tight uppercase truncate">
                            {activity.actionType}
                          </p>
                          {activity.refId && (
                            <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase mt-1">
                              REF: {activity.refId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-7">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">
                        {activity.moduleName || 'System'}
                      </span>
                    </td>
                    <td className="px-6 py-7 text-center">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(activity.status)}`}>
                        {activity.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-7">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-black">
                          {(activity.userId === user?.id ? user?.name : 'System')?.charAt(0) || 'S'}
                        </div>
                        <span className="text-xs font-bold text-slate-600 uppercase">
                          {activity.userId === user?.id ? user?.name : 'System'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 sm:px-10 py-7 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-slate-800 uppercase">
                          {new Date(activity.timestamp || activity.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mt-1">
                          {new Date(activity.timestamp || activity.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {!isLoading && filteredActivities.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3">
              <Activity size={20} sm:size={24} />
            </div>
            <h4 className="text-xl sm:text-2xl font-black text-slate-800">{filteredActivities.length}</h4>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Events</p>
          </div>
          
          <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={20} sm:size={24} />
            </div>
            <h4 className="text-xl sm:text-2xl font-black text-slate-800">
              {filteredActivities.filter(a => a.status === 'Success').length}
            </h4>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Successful</p>
          </div>
          
          <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-rose-50 text-rose-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={20} sm:size={24} />
            </div>
            <h4 className="text-xl sm:text-2xl font-black text-slate-800">
              {filteredActivities.filter(a => a.status === 'Failed' || a.status === 'Error').length}
            </h4>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Failed</p>
          </div>
          
          <div className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 text-slate-600 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3">
              <Clock size={20} sm:size={24} />
            </div>
            <h4 className="text-xl sm:text-2xl font-black text-slate-800">
              {filteredActivities.length > 0 ? 'Today' : '--'}
            </h4>
            <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Last Activity</p>
          </div>
        </div>
      )}
    </div>
  );
};