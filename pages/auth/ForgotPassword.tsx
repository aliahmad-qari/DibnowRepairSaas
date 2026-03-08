
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  Mail, Lock, ArrowLeft, AlertCircle, CheckCircle, 
  Loader2, Eye, EyeOff, ShieldCheck 
} from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Steps: email -> otp -> password -> success
  const [step, setStep] = useState<'email' | 'otp' | 'password' | 'success'>('email');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password strength requirements
  const passwordRequirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[a-z]/.test(password), text: 'One lowercase letter' },
    { met: /\d/.test(password), text: 'One number' },
    { met: /[@$!%*?&]/.test(password), text: 'One special character (@$!%*?&)' },
    { met: password === confirmPassword && password.length > 0, text: 'Passwords match' }
  ];

  const validatePassword = (): boolean => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/\d/.test(password)) {
      setError('Password must contain at least one number');
      return false;
    }
    if (!/[@$!%*?&]/.test(password)) {
      setError('Password must contain at least one special character (@$!%*?&)');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  // Step 1: Send OTP to email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to send OTP');
      } else {
        setMessage('A 6-digit code has been sent to your email. Please enter it below.');
        setStep('otp');
        
        // Auto-fill OTP if returned
        if (data.otp) {
          const otpDigits = data.otp.split('');
          setOtp(otpDigits);
        }
        
        // Focus first OTP input
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 100);
      }
    } catch (error) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    
    // Handle paste event (multiple digits)
    if (value.length > 1) {
      const digits = value.slice(0, 6).split('');
      digits.forEach((digit, i) => {
        if (i < 6) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);
      // Focus last filled input or the next empty one
      const nextIndex = Math.min(digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle OTP key down (for backspace)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/verify-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp: otpCode })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Invalid OTP code');
      } else {
        // Store the reset token for password reset
        setResetToken(data.resetToken || otpCode);
        setMessage('OTP verified successfully. Please set your new password.');
        setStep('password');
      }
    } catch (error) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    if (!validatePassword()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email, 
          token: resetToken,
          otp: otp.join(''),
          password, 
          confirmPassword 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to reset password');
      } else {
        setMessage('Password reset successful!');
        setStep('success');
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);
      }
    } catch (error) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);
    setOtp(['', '', '', '', '', '']);

    try {
      const response = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to resend OTP');
      } else {
        setMessage('A new 6-digit code has been sent to your email.');
        otpRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit OTP when all 6 digits are entered
  useEffect(() => {
    const otpCode = otp.join('');
    if (otpCode.length === 6 && step === 'otp') {
      // Auto verify after a short delay
      const timer = setTimeout(() => {
        handleVerifyOTP({ preventDefault: () => {} } as React.FormEvent);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [otp, step]);

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Mesh Gradient */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#6366f1] blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#8b5cf6] blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-[500px] relative z-10">
        {/* Back Button */}
        <Link 
          to="/auth/login" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Back to Login</span>
        </Link>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="p-12 bg-white">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                {step === 'email' && <Mail size={28} className="text-indigo-600" />}
                {step === 'otp' && <ShieldCheck size={28} className="text-indigo-600" />}
                {(step === 'password' || step === 'success') && <Lock size={28} className="text-indigo-600" />}
              </div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                {step === 'email' && 'Forgot Password'}
                {step === 'otp' && 'Verify Code'}
                {step === 'password' && 'Reset Password'}
                {step === 'success' && 'Success!'}
              </h1>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
                {step === 'email' && 'Enter your email to receive a verification code'}
                {step === 'otp' && 'Enter the 6-digit code sent to your email'}
                {step === 'password' && 'Enter your new password'}
                {step === 'success' && 'Your password has been reset'}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <p className="text-xs font-bold">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {message && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-emerald-600">
                <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
                <p className="text-xs font-bold">{message}</p>
              </div>
            )}

            {/* Step 1: Email Form */}
            {step === 'email' && (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </form>
            )}

            {/* Step 2: OTP Form */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 text-center block">
                    Enter 6-Digit Code
                  </label>
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className="w-12 h-14 text-center text-xl font-black bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedData = e.clipboardData.getData('text');
                          handleOtpChange(0, pastedData);
                        }}
                        disabled={isLoading}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  <p className="text-center text-slate-400 text-xs mt-2">
                    Code sent to: <span className="font-bold text-slate-600">{email}</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.join('').length !== 6}
                  className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-indigo-600 text-xs font-bold hover:underline disabled:opacity-50"
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Password Form */}
            {step === 'password' && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
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

                {/* Password Requirements */}
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3">Password Requirements</p>
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <CheckCircle size={14} className={req.met ? 'text-emerald-500' : 'text-slate-300'} />
                      <span className={req.met ? 'text-emerald-600 font-bold' : 'text-slate-400'}>{req.text}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            )}

            {/* Step 4: Success State */}
            {step === 'success' && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <p className="text-sm text-slate-600">
                  Your password has been reset successfully. Redirecting to login...
                </p>
                <Link
                  to="/auth/login"
                  className="inline-block w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
                >
                  Back to Login
                </Link>
              </div>
            )}

            {/* Security Note */}
            <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
              <ShieldCheck size={14} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Secured by DibNow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
