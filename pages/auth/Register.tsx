
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, Lock, User, Smartphone, Building, MapPin, 
  Hash, Eye, EyeOff, CheckCircle, AlertCircle, 
  ShieldCheck, Loader2, ArrowRight 
} from 'lucide-react';
import { db } from '../../api/db';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  company: string;
  postcode: string;
  address: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  company?: string;
  postcode?: string;
  address?: string;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    company: '',
    postcode: '',
    address: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(formData.password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(formData.password), text: 'One lowercase letter' },
    { met: /\d/.test(formData.password), text: 'One number' },
    { met: /[@$!%*?&]/.test(formData.password), text: 'One special character' }
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          company: formData.company,
          postcode: formData.postcode,
          address: formData.address
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if user already exists and is verified
        if (data.alreadyExists && data.verified) {
          setGeneralError(
            <>
              {data.message}{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-bold">
                Login here
              </Link>
            </>
          );
        } else {
          setGeneralError(data.message || 'Registration failed. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      // Log activity
      db.activity.log({ 
        actionType: 'New Signup', 
        moduleName: 'Authentication', 
        refId: formData.email, 
        status: 'Success' 
      });

      setSuccess(true);

      // Redirect to dashboard (no email verification needed)
      navigate('/user/dashboard');
    } catch (error) {
      setGeneralError('Connection error. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 lg:p-6">
      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00D1FF] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#0052FF] blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-[1100px] flex flex-col lg:flex-row bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden relative z-10">
        
        {/* Left Side: Branding */}
        <div className="w-full lg:w-5/12 p-8 lg:p-12 xl:p-16 flex flex-col justify-center bg-gradient-to-br from-[#00A3FF] to-[#00D1FF] text-white relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/4 -translate-x-1/4" />
          
          <div className="relative z-10">
            <div className="mb-10">
               <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg mb-6">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#00A3FF] font-black text-sm italic">Dib</div>
               </div>
               <h1 className="text-3xl lg:text-4xl font-black leading-tight tracking-tight">Scale Your Gadget Business</h1>
            </div>
            
            <p className="text-blue-50 text-base leading-relaxed mb-8 font-medium opacity-90">
               Welcome to DibNow, your complete repair shop management solution. Start your journey for a smarter future today!
            </p>

            {/* Benefits */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-bold text-blue-100">
                 <CheckCircle size={20} className="text-white" />
                 <span>Unified dashboard for all repairs</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-blue-100">
                 <CheckCircle size={20} className="text-white" />
                 <span>AI-powered insights & diagnostics</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-blue-100">
                 <CheckCircle size={20} className="text-white" />
                 <span>Multi-location support</span>
              </div>
              <div className="flex items-center gap-3 text-sm font-bold text-blue-100">
                 <CheckCircle size={20} className="text-white" />
                 <span>Secure cloud backup</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto relative z-10 pt-8">
            <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
              <p className="text-xs font-black uppercase tracking-widest text-blue-100 mb-2">Already using DibNow?</p>
              <Link to="/login" className="text-white font-black text-sm hover:underline flex items-center gap-2">
                 Sign In to your account <ArrowRight size={14}/>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-7/12 p-8 lg:p-12 xl:p-16 bg-white flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-black text-slate-800">Create Your Account</h2>
            <p className="text-slate-500 text-xs lg:text-sm font-bold uppercase tracking-widest mt-1">Start Your Enterprise Journey</p>
          </div>

          {/* General Error */}
          {generalError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
              <AlertCircle size={20} />
              <p className="text-sm font-bold">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* First Row: First Name, Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'} rounded-2xl outline-none transition-all text-sm font-bold`}
                    placeholder="John"
                    required
                  />
                </div>
                {errors.firstName && <p className="text-red-500 text-xs ml-1">{errors.firstName}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'} rounded-2xl outline-none transition-all text-sm font-bold`}
                    placeholder="Doe"
                    required
                  />
                </div>
                {errors.lastName && <p className="text-red-500 text-xs ml-1">{errors.lastName}</p>}
              </div>
            </div>

            {/* Second Row: Email, Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'} rounded-2xl outline-none transition-all text-sm font-bold`}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs ml-1">{errors.email}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Phone Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 border ${errors.phone ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'} rounded-2xl outline-none transition-all text-sm font-bold`}
                    placeholder="+1 234 567 8900"
                    required
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-xs ml-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Third Row: Password, Company */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-12 py-3 bg-slate-50 border ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'} rounded-2xl outline-none transition-all text-sm font-bold`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs ml-1">{errors.password}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Company (Optional)</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                    placeholder="Your Company Name"
                  />
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            {formData.password && (
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Password Requirements</p>
                <div className="grid grid-cols-2 gap-2">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <CheckCircle size={14} className={req.met ? 'text-green-500' : 'text-slate-300'} />
                      <span className={req.met ? 'text-green-600 font-bold' : 'text-slate-400'}>{req.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fourth Row: Postcode, Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Postcode (Optional)</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                    placeholder="12345"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Address (Optional)</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                    placeholder="123 Main Street"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#00A3FF] to-[#0052FF] text-white font-black py-4 rounded-2xl shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-[0.2em] mt-4 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <ShieldCheck size={18} />
                  Create Enterprise Account
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
        </div>
      </div>
    </div>
  );
};
