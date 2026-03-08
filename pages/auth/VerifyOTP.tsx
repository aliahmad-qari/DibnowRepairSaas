import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const location = useLocation();
  const email = location.state?.email || 'user@example.com';

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const otpCode = otp.join('');

    try {
      const response = await fetch('/api/users/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp: otpCode })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Invalid verification code');
        setIsLoading(false);
        return;
      }

      // Login with the verified user
      await login(email, UserRole.USER);
      navigate('/user/dashboard');
    } catch (err) {
      setError('Connection error. Please try again.');
      console.error('OTP verification error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Check Your Email</h1>
        <p className="text-slate-500 mt-2">We sent a verification code to <b>{email}</b></p>
        
        <form onSubmit={handleVerify} className="mt-10 space-y-8">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
          <div className="flex justify-between gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                maxLength={1}
                className="w-12 h-14 text-center text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
              />
            ))}
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify & Create Account'}
          </button>
        </form>

        <p className="mt-8 text-sm text-slate-500">
          Didn't receive the code? <button className="text-indigo-600 font-bold">Resend OTP</button>
        </p>
      </div>
    </div>
  );
};