
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { db } from '../../api/db';
import { 
  ChevronRight, ShieldCheck, Mail, Lock, User as UserIcon, 
  Shield, AlertTriangle, Eye, EyeOff, Loader2 
} from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    // Password validation
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    const result = await login(email.trim(), password, role);
    
    setIsLoading(false);
    
    if (!result.success) {
      setError(result.message || 'Access Denied.');
      
      // Log failed attempt
      db.activity.log({ 
        actionType: 'Failed Login Attempt', 
        moduleName: 'Authentication', 
        refId: email, 
        status: 'Failed' 
      });
      return;
    }

    // Log successful login
    db.activity.log({ 
      actionType: 'User Login', 
      moduleName: 'Authentication', 
      refId: email, 
      status: 'Success' 
    });
    
    // Navigate based on role
    navigate(role === UserRole.ADMIN ? '/admin/dashboard' : role === UserRole.SUPER_ADMIN ? '/superadmin/dashboard' : '/user/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Mesh Gradient */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0052FF] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00D1FF] blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-[1000px] flex flex-col md:flex-row bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Left Side: Branding & Welcome */}
        <div className="w-full md:w-5/12 p-12 md:p-16 flex flex-col justify-center bg-gradient-to-br from-[#0052FF] to-[#00A3FF] text-white">
           <div className="mb-10">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-6">
                 <div className="w-10 h-10 bg-[#0052FF] rounded-lg flex items-center justify-center text-white font-black text-sm italic">Dib</div>
              </div>
              <h1 className="text-3xl font-black leading-tight tracking-tight">Dib Now Gadget Industry Management</h1>
           </div>
           
           <p className="text-blue-50 text-sm leading-relaxed mb-8 font-medium opacity-80">
              Manage your entire repair business from one dashboard. Unified administrative control and multi-tenant security architecture.
           </p>

           <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs font-bold text-blue-100">
                 <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><ShieldCheck size={14}/></div>
                 Cloud-based Security
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-blue-100">
                 <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center"><ShieldCheck size={14}/></div>
                 Granular Access Control
              </div>
           </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-7/12 p-12 md:p-16 bg-white flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-800">Secure Sign In</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Enterprise Access Portal</p>
          </div>

          {/* Role Selection Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
            <button 
              onClick={() => { setRole(UserRole.USER); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === UserRole.USER ? 'bg-white shadow-lg text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <UserIcon size={12} /> Shop Owner
            </button>
            <button 
              onClick={() => { setRole(UserRole.ADMIN); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === UserRole.ADMIN ? 'bg-white shadow-lg text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Shield size={12} /> Administrator
            </button>
            <button 
              onClick={() => { setRole(UserRole.SUPER_ADMIN); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === UserRole.SUPER_ADMIN ? 'bg-slate-900 shadow-lg text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Root
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-in shake">
              <AlertTriangle size={18} />
              <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Email Address</label>
              <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                   type="email"
                   required
                   className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="name@example.com"
                   autoComplete="email"
                   disabled={isLoading}
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Password</label>
              <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                   type={showPassword ? 'text' : 'password'}
                   required
                   className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="Enter your password"
                   autoComplete="current-password"
                   disabled={isLoading}
                 />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link 
                to="/auth/forgot-password" 
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-widest"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full ${role === UserRole.SUPER_ADMIN ? 'bg-slate-900 hover:bg-black' : role === UserRole.ADMIN ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-[#0052FF] hover:bg-blue-700'} text-white font-black py-5 rounded-2xl shadow-2xl hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] mt-4 flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Secure Sign In
                </>
              )}
            </button>
          </form>

          {/* Security Indicators */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-center gap-6 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <div className="flex items-center gap-1.5">
                <Lock size={12} className="text-emerald-500" />
                <span>256-bit Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-blue-500" />
                <span>Multi-Tenant Secure</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cloud Infrastructure Active</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Don't have an account?{' '}
              <Link to="/auth/register" className="text-indigo-600 hover:text-indigo-800 font-black">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
