
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  MoreVertical, 
  Shield, 
  Zap, 
  AlertCircle,
  Mail,
  Filter,
  Trash2,
  Power
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { apiClient } from '../../api/apiClient';

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersData, plansData] = await Promise.all([
          adminApi.getAllUsers(),
          apiClient.get('/plans/all')
        ]);
        setAllUsers(usersData);
        setUsers(usersData);
        setPlans(plansData.plans || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPlan === 'all') {
      setUsers(allUsers);
    } else {
      setUsers(allUsers.filter(u => u.planName === selectedPlan));
    }
  }, [selectedPlan, allUsers]);

  const handleToggleStatus = async (userId: string) => {
    try {
      await adminApi.toggleUserStatus(userId);
      setAllUsers(allUsers.map(u => u._id === userId ? { ...u, is_disabled: !u.is_disabled } : u));
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await adminApi.deleteUser(userId);
      setAllUsers(allUsers.filter(u => u._id !== userId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Platform Users</h2>
          <p className="text-slate-500">Oversee all registered shop accounts and their status.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 transition-all flex items-center gap-2">
            Export Leads
          </button>
          <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
            <Mail size={18} />
            Broadcast Notification
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/30">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by business name, owner or email..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm flex items-center gap-2 hover:bg-slate-50">
              <Filter size={18} />
              Filter
            </button>
            <select 
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm outline-none"
            >
              <option value="all">All Plans</option>
              {plans.map(plan => (
                <option key={plan._id} value={plan.name}>{plan.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.1em] border-b border-slate-100">
              <tr>
                <th className="px-6 py-5">Business / Owner</th>
                <th className="px-6 py-5">Subscription</th>
                <th className="px-6 py-5">Team Size</th>
                <th className="px-6 py-5">Wallet</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Users...</p>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-400 font-bold">No users found</td>
                </tr>
              ) : users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/80 transition-all group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">{u.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className={u.planName !== 'Free Trial' ? 'text-amber-500' : 'text-slate-300'} />
                      <span className="text-sm font-bold text-slate-700">{u.planName || 'Free Trial'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                      <Users size={14} />
                      1 seat
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-900">${(u.walletBalance || 0).toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${u.is_disabled ? 'bg-slate-100 text-slate-700' : u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${u.is_disabled ? 'bg-slate-500' : u.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                      {u.is_disabled ? 'Disabled' : u.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleToggleStatus(u._id)}
                        className={`p-2 border rounded-lg shadow-sm transition-all ${u.is_disabled ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                        title={u.is_disabled ? 'Enable User' : 'Disable User'}
                      >
                        <Power size={16} />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(u._id)}
                        className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 hover:bg-rose-100 shadow-sm transition-all"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete User</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to permanently delete this user? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
