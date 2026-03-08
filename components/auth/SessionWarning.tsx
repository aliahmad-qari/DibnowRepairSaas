import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, Clock, LogOut, Loader2 } from 'lucide-react';

export const SessionWarning: React.FC = () => {
  const { showSessionWarning, logout, extendSession } = useAuth();
  const [countdown, setCountdown] = useState(120); // 2 minutes
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (showSessionWarning) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [showSessionWarning, logout]);

  const handleExtend = async () => {
    setIsLoading(true);
    try {
      extendSession();
      setCountdown(120);
    } catch (error) {
      console.error('Failed to extend session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showSessionWarning) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-amber-500 p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Session Expiring
          </h2>
          <p className="text-amber-100 text-sm font-medium mt-2">
            Your session will expire due to inactivity
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Countdown */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-100 rounded-full mb-4">
              <Clock size={40} className="text-slate-600" />
            </div>
            <p className="text-5xl font-black text-slate-800 tracking-tighter font-mono">
              {formatTime(countdown)}
            </p>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
              Time Remaining
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <button
              onClick={handleExtend}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl hover:scale-[1.01] active:scale-95 transition-all text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Extending...
                </>
              ) : (
                <>
                  Stay Logged In
                </>
              )}
            </button>

            <button
              onClick={logout}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-black py-4 rounded-2xl transition-all text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-2"
            >
              <LogOut size={18} />
              Log Out Now
            </button>
          </div>

          {/* Info */}
          <p className="text-slate-400 text-xs text-center mt-6">
            For security purposes, you'll be automatically logged out after 30 minutes of inactivity.
          </p>
        </div>
      </div>
    </div>
  );
};
