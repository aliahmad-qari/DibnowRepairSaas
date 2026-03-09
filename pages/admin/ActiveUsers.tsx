import React, { useState, useEffect } from 'react';
import { Users, Search, Crown, Calendar, CheckCircle } from 'lucide-react';
import { adminApi } from '../../api/adminApi';

export const ActiveUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        setLoading(true);
        const allUsers = await adminApi.getAllUsers();
        // Filter users with active plans (plan expiry date > current date)
        const activeUsers = allUsers.filter((user: any) => {
          if (!user.planExpireDate) return false;
          const expiryDate = new Date(user.planExpireDate);
          const now = new Date();
          return expiryDate > now && user.status === 'active';
        });
        setUsers(activeUsers);
      } catch (error) {
        console.error('Failed to fetch active users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveUsers();
  }, []);

  const getPlanColor = (planName: string) => {
    switch (planName?.toLowerCase()) {
      case 'premium': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'pro': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'basic': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Active Subscribers</h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
            <CheckCircle size={14} className="text-emerald-600" /> Users with active paid plans
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
          <Users size={16} /> {users.length} Active Users
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search active users..."
              className="w-full pl-14 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time Status</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-5">User</th>
                <th className="px-6 py-5">Plan</th>
                <th className="px-6 py-5">Expiry Date</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Join Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Active Users...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold">No active users found</td>
                </tr>
              ) : users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50/80 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                        <Users size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{user.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getPlanColor(user.planName)}`}>
                      {user.planName || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-700">
                        {user.planExpireDate ? new Date(user.planExpireDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};