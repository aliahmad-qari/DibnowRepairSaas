import { useState, useEffect, useCallback } from 'react';
import { callBackendAPI } from '../api/apiClient';
import { useAuth } from '../context/AuthContext';

export interface QuotaLimit {
  used: number;
  limit: number;
  percentage: number;
}

export interface QuotaStatus {
  success: boolean;
  planId: string | null;
  planName: string;
  limits: {
    repairs: QuotaLimit;
    stock: QuotaLimit;
    team: QuotaLimit;
    brands: QuotaLimit;
    categories: QuotaLimit;
    aiDiagnostics: boolean;
  };
  status: string;
  timestamp: string;
}

export const useQuotas = () => {
  const { user } = useAuth();
  const [quotas, setQuotas] = useState<QuotaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotas = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await callBackendAPI('/api/quotas/status', null, 'GET');
      if (response && response.success) {
        setQuotas(response);
        setError(null);
      } else {
        setError(response?.message || 'Failed to fetch quotas');
      }
    } catch (err: any) {
      console.error('[useQuotas] Error:', err);
      setError(err.message || 'Network error');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchQuotas();
  }, [fetchQuotas]);

  return { quotas, isLoading, error, refetch: fetchQuotas };
};
