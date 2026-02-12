import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole, Permission } from '../types';
import { db } from '../api/db';

// Session timeout configuration (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_TIMEOUT = 2 * 60 * 1000; // 2 minutes before

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  refreshToken: () => Promise<boolean>;
  showSessionWarning: boolean;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionExpiring, setSessionExpiring] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Reset session timer on user activity
  const resetSessionTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    
    setShowSessionWarning(false);
    setSessionExpiring(false);

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      setShowSessionWarning(true);
      setSessionExpiring(true);
    }, SESSION_TIMEOUT - WARNING_BEFORE_TIMEOUT);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      console.log('[AUTH] Session expired due to inactivity');
      logout();
      alert("Your session has expired due to inactivity. Please log in again.");
    }, SESSION_TIMEOUT);
  }, []);

  // Extend session (called when user clicks "Stay Logged In")
  const extendSession = useCallback(() => {
    setShowSessionWarning(false);
    resetSessionTimer();
  }, [resetSessionTimer]);

  // Listen for user activity
  useEffect(() => {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      if (user) {
        resetSessionTimer();
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [user, resetSessionTimer]);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('fixit_user');
        const token = localStorage.getItem('dibnow_token');
        
        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          
          // Verify token with backend
          try {
            const response = await fetch('/api/users/profile', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const userData = await response.json();
              setUser(userData);
              resetSessionTimer();
            } else {
              // Token invalid, clear storage
              localStorage.removeItem('fixit_user');
              localStorage.removeItem('dibnow_token');
              localStorage.removeItem('dibnow_refresh_token');
            }
          } catch (error) {
            // Backend not available, use stored data
            console.log('[AUTH] Backend not available, using cached session');
            setUser(parsedUser);
            resetSessionTimer();
          }
        }
      } catch (error) {
        console.error('[AUTH] Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [resetSessionTimer]);

  // Remote session revocation listener
  useEffect(() => {
    const handleRemoteRevoke = (e: StorageEvent) => {
      if (e.key === 'dibnow_session_revoke') {
        const payload = JSON.parse(e.newValue || '{}');
        const currentUser = JSON.parse(localStorage.getItem('fixit_user') || '{}');
        if (payload.userId === currentUser.id) {
          logout();
          alert("Your account has been disabled by Super Admin. Session Terminated.");
          window.location.href = '/#/login';
        }
      }
      if (e.key === 'fixit_user') {
        const storedUser = localStorage.getItem('fixit_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
    };

    window.addEventListener('storage', handleRemoteRevoke);
    return () => window.removeEventListener('storage', handleRemoteRevoke);
  }, []);

  // Login function with backend validation
  const login = async (email: string, password: string, role: UserRole): Promise<{ success: boolean; message?: string }> => {
    try {
      // Validate inputs
      if (!email || !password) {
        return { success: false, message: 'Email and password are required' };
      }

      // For ADMIN role, use admin login endpoint
      if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
        const response = await fetch('/api/users/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, message: data.message || 'Login failed' };
        }

        // Store user data and tokens
        const userData: User = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: role,
          subRole: role === UserRole.SUPER_ADMIN ? 'Platform Root' : 'Administrator',
          permissions: role === UserRole.SUPER_ADMIN 
            ? ['manage_repairs', 'manage_inventory', 'manage_sales', 'manage_billing', 'manage_team', 'view_reports', 'manage_system', 'manage_support']
            : ['manage_repairs', 'manage_inventory', 'manage_sales', 'manage_billing', 'manage_team', 'view_reports'],
          walletBalance: 0,
          status: data.user.status,
          planId: 'starter'
        };

        setUser(userData);
        localStorage.setItem('fixit_user', JSON.stringify(userData));
        localStorage.setItem('dibnow_token', data.token);
        localStorage.setItem('dibnow_refresh_token', data.refreshToken);
        window.dispatchEvent(new Event('storage'));
        resetSessionTimer();

        // Log activity
        db.activity.log({ 
          actionType: 'User Login', 
          moduleName: 'Authentication', 
          refId: email, 
          status: 'Success' 
        });

        return { success: true };
      }

      // For regular USER login
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Login failed' };
      }

      // Check if email verification is required
      if (data.requiresEmailVerification) {
        // Store temp user for verification
        localStorage.setItem('dibnow_pending_email', email);
        return { success: false, message: 'Please verify your email before logging in. Check your inbox for the verification link.' };
      }

      // Store user data and tokens
      const userData: User = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: role,
        subRole: 'Owner',
        permissions: ['manage_repairs', 'manage_inventory', 'manage_sales', 'manage_billing', 'manage_team', 'view_reports'],
        walletBalance: 0,
        status: data.user.status,
        planId: 'starter'
      };

      setUser(userData);
      localStorage.setItem('fixit_user', JSON.stringify(userData));
      localStorage.setItem('dibnow_token', data.token);
      localStorage.setItem('dibnow_refresh_token', data.refreshToken);
      window.dispatchEvent(new Event('storage'));
      resetSessionTimer();

      // Log activity
      db.activity.log({ 
        actionType: 'User Login', 
        moduleName: 'Authentication', 
        refId: email, 
        status: 'Success' 
      });

      return { success: true };
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      return { success: false, message: 'Connection error. Please try again.' };
    }
  };

  // Logout function
  const logout = () => {
    const token = localStorage.getItem('dibnow_token');
    
    // Notify backend of logout (optional)
    if (token && user) {
      fetch('/api/users/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).catch(console.error);
    }

    setUser(null);
    setShowSessionWarning(false);
    localStorage.removeItem('fixit_user');
    localStorage.removeItem('dibnow_token');
    localStorage.removeItem('dibnow_refresh_token');
    localStorage.removeItem('dibnow_pending_email');
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    
    window.dispatchEvent(new Event('storage'));
  };

  // Refresh token function
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('dibnow_refresh_token');
      if (!refreshToken) return false;

      const response = await fetch('/api/users/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('dibnow_token', data.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[AUTH] Token refresh error:', error);
      return false;
    }
  };

  // Permission check
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    // Super Admin bypasses all checks
    if (user.role === UserRole.SUPER_ADMIN) return true;
    // Check if user has the permission
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading,
      login, 
      logout, 
      hasPermission,
      refreshToken,
      showSessionWarning,
      extendSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
