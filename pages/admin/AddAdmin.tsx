import React, { useState } from 'react';
import { UserPlus, Mail, Lock, User, Shield, CheckCircle2 } from 'lucide-react';
import { callBackendAPI } from '../../api/apiClient.ts';
import { BackButton } from '../../components/common/BackButton';

export const AddAdmin: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ADMIN'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      await callBackendAPI('/api/admin/create-admin', formData, 'POST');
      alert("Administrator created successfully");
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'ADMIN'
      });
    } catch (error: any) {
      console.error('Failed to create admin:', error);
      alert(error.message || 'Failed to create admin account');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8 px-4 sm:px-0 pb-12">
      <BackButton />
      <div className="space-y-1 sm:space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">Add New Administrator</h2>
        <p className="text-slate-500 text-sm">Create a new system-level user with elevated privileges.</p>
      </div>

      <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 font-black uppercase tracking-widest text-[10px]">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
                  placeholder="Enter admin name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 font-black uppercase tracking-widest text-[10px]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
                  placeholder="admin@fixit-saas.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 font-black uppercase tracking-widest text-[10px]">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 font-black uppercase tracking-widest text-[10px]">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 font-black uppercase tracking-widest text-[10px]">Admin Level / Role</label>
              <select 
                className="w-full px-4 py-3 sm:py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm text-slate-600 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="ADMIN">System Admin (Full Access)</option>
                <option value="SUPER_ADMIN">Super Admin (Management Access)</option>
                <option value="SUPPORT_ADMIN">Support Admin (Tickets Access)</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white font-black py-4 sm:py-5 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[11px] active:scale-[0.98]"
            >
              <UserPlus size={20} />
              Create Admin Account
            </button>
          </div>
        </form>
      </div>

      <div className="bg-indigo-50 border border-indigo-100 p-4 sm:p-6 rounded-xl sm:rounded-2xl flex items-start gap-3 sm:gap-4">
        <Shield className="text-indigo-600 mt-1 shrink-0" size={20} sm:size={24} />
        <div>
          <h4 className="font-bold text-indigo-900 text-sm sm:text-base tracking-tight leading-none uppercase mb-1">Security Warning</h4>
          <p className="text-xs sm:text-sm text-indigo-700 mt-1 leading-relaxed font-medium">
            New administrators will have the ability to view all shop data, manage wallets, and change global platform settings. Only invite trusted personnel.
          </p>
        </div>
      </div>
    </div>
  );
};
