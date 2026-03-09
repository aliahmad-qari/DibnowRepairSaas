import React, { useState, useMemo, useEffect } from 'react';
import {
  Users, Search, UserPlus, Lock, Unlock, Trash2, X, Loader2, ShieldCheck
} from 'lucide-react';
import { callBackendAPI } from '../../api/apiClient.ts';

export const GlobalUserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await callBackendAPI('/api/superadmin/users', null, 'GET');
      console.log('✅ Users loaded:', usersData?.length || 0);
      setUsers(usersData || []);
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      alert('Failed to load users. Please check: 1) Backend is running on port 5002, 2) You are logged in as superadmin');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u._id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setIsCreating(true);
      await callBackendAPI('/api/superadmin/create-user', newUser, 'POST');
      setNewUser({ name: '', email: '', password: '' });
      setShowCreateForm(false);
      loadUsers();
      alert('User created successfully!');
    } catch (error: any) {
      console.error('Failed to create user:', error);
      alert(error?.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDisableUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to disable this user? They will not be able to login.')) {
      return;
    }

    try {
      await callBackendAPI(`/api/superadmin/users/${userId}/disable`, null, 'PUT');
      loadUsers();
    } catch (error) {
      console.error('Failed to disable user:', error);
      alert('Failed to disable user');
    }
  };

  const handleEnableUser = async (userId: string) => {
    try {
      await callBackendAPI(`/api/superadmin/users/${userId}/enable`, null, 'PUT');
      loadUsers();
    } catch (error) {
      console.error('Failed to enable user:', error);
      alert('Failed to enable user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await callBackendAPI(`/api/superadmin/users/${userId}`, null, 'DELETE');
      loadUsers();
      alert('User deleted successfully');
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center rounded-3xl">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-white/5 text-indigo-400 rounded-[2rem] flex items-center justify-center shadow-2xl border border-white/10">
              <Users size={32} />
           </div>
           <div>
              <h2 className="text-3xl font-black uppercase tracking-tight">User Management</h2>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em] mt-2">SuperAdmin User Control</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-sm shadow-xl hover:bg-indigo-500 transition-all flex items-center gap-2"
          >
            <UserPlus size={18} />
            Add New User
          </button>
          <div className="relative w-full md:w-96">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
             <input
               type="text"
               placeholder="Search users..."
               className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-sm font-bold text-white transition-all shadow-sm"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
        </div>
      </div>

      {/* Create User Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-white/5">
            <div className="p-8 border-b border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Create New User</h3>
                <button onClick={() => setShowCreateForm(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-500 transition-all"><X size={24}/></button>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Name</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-400 uppercase mb-2">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 py-3 bg-white/5 text-slate-400 rounded-xl font-bold uppercase text-sm border border-white/10 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase text-sm shadow-xl hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl border-b-8 border-b-indigo-600">
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
               <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] border-b border-white/5">
                  <tr>
                     <th className="px-10 py-6">User</th>
                     <th className="px-10 py-6">Role</th>
                     <th className="px-10 py-6 text-center">Status</th>
                     <th className="px-10 py-6 text-center">Created</th>
                     <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                  {filteredUsers.map(u => (
                    <tr key={u._id} className="hover:bg-white/5 transition-all">
                       <td className="px-10 py-7">
                          <div className="flex items-center gap-5">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-black text-indigo-400">
                                {u.name?.charAt(0).toUpperCase()}
                             </div>
                             <div>
                                <p className="font-black text-white text-sm uppercase tracking-tight">{u.name}</p>
                                <p className="text-[10px] text-slate-500 font-bold mt-1 lowercase italic">{u.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-7">
                          <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-xs font-bold uppercase">
                            {u.role}
                          </span>
                       </td>
                       <td className="px-10 py-7 text-center">
                          <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                            u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                            u.status === 'disabled' ? 'bg-rose-500/10 text-rose-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {u.status}
                          </span>
                       </td>
                       <td className="px-10 py-7 text-center">
                          <p className="text-xs text-slate-500 font-bold">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                       </td>
                       <td className="px-10 py-7 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.status === 'active' ? (
                              <button
                                onClick={() => handleDisableUser(u._id)}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl border border-rose-500/20 transition-all"
                                title="Disable User"
                              >
                                <Lock size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleEnableUser(u._id)}
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-xl border border-emerald-500/20 transition-all"
                                title="Enable User"
                              >
                                <Unlock size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="p-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-xl border border-red-500/20 transition-all"
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

      <div className="p-8 bg-slate-900 border border-white/5 rounded-[3rem] flex items-start gap-6 opacity-60">
         <ShieldCheck className="text-indigo-400 mt-1 shrink-0" size={24} />
         <p className="text-[11px] font-bold text-slate-500 uppercase leading-relaxed tracking-widest">
            SuperAdmin user management controls. Users created here will have role 'user' and can login normally to access the regular user dashboard.
         </p>
      </div>
    </div>
  );
};
