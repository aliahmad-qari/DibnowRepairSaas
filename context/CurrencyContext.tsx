import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../api/db.ts';
import { callBackendAPI } from '../api/apiClient';

interface Currency {
  symbol: string;
  code: string;
  country: string;
}

interface CurrencyContextType {
  currency: Currency;
  isDetecting: boolean;
  setManualCurrency: (currencyCode: string) => void;
  availableCurrencies: any[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrency] = useState<Currency>({ symbol: '£', code: 'GBP', country: 'GB' });
  const [isDetecting, setIsDetecting] = useState(true);
  const [availableCurrencies, setAvailableCurrencies] = useState<any[]>([]);

  const loadAvailable = () => {
    const all = db.currencies.getAll();
    setAvailableCurrencies(all);
    return all;
  };

  const setManualCurrency = (currencyCode: string) => {
    const all = db.currencies.getAll();
    const selected = all.find(c => c.currencyCode === currencyCode);
    if (selected) {
      const newCurrency = {
        symbol: selected.symbol,
        code: selected.currencyCode,
        country: selected.countryCode
      };
      setCurrency(newCurrency);
      localStorage.setItem('fixit_active_currency', JSON.stringify(newCurrency));
      window.dispatchEvent(new Event('storage'));
    }
  };

  useEffect(() => {
    const initCurrency = async () => {
      loadAvailable();

      const saved = localStorage.getItem('fixit_active_currency');
      const savedLocation = localStorage.getItem('dibnow_user_location');

      if (saved) {
        setCurrency(JSON.parse(saved));
        setIsDetecting(false);
        return;
      }

      console.log('🌍 [Location] Starting detection sequence...');

      // Function to map country code to currency
      const applyMapping = (countryCode: string) => {
        const mapping = db.currencies.getByCountry(countryCode);
        if (mapping) {
          const newCurrency = {
            symbol: mapping.symbol,
            code: mapping.currencyCode,
            country: countryCode
          };
          setCurrency(newCurrency);
          localStorage.setItem('fixit_active_currency', JSON.stringify(newCurrency));
          console.log(`✅ [Location] Currency set to ${newCurrency.code} for ${countryCode}`);
        }
      };

      // 1. Try Browser Geolocation API first
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            console.log(`📍 [Location] Browser detection success: ${latitude}, ${longitude}`);

            // Call backend to get country from lat/long if possible, 
            // or just use backend IP detect as it's more reliable for country mapping
            try {
              const response = await callBackendAPI('/api/location/detect', undefined, 'GET');
              if (response.success) {
                const locData = { ...response, latitude, longitude };
                localStorage.setItem('dibnow_user_location', JSON.stringify(locData));
                applyMapping(response.countryCode);
              }
            } catch (err) {
              console.error('❌ [Location] Backend detection failed after browser success');
            }
            setIsDetecting(false);
          },
          async (error) => {
            console.warn(`⚠️ [Location] Browser permission denied or error: ${error.message}`);

            // 2. Fallback to Backend IP-based Geolocation
            try {
              console.log('🌐 [Location] Falling back to Backend IP detection...');
              const response = await callBackendAPI('/api/location/detect', undefined, 'GET');
              if (response.success) {
                localStorage.setItem('dibnow_user_location', JSON.stringify(response));
                applyMapping(response.countryCode);
                console.log('✅ [Location] Backend detection successful');
              } else {
                throw new Error(response.message || 'Unknown error');
              }
            } catch (err) {
              console.error('❌ [Location] All detection methods failed');
              // Final fallback to default
              applyMapping('GB');
            }
            setIsDetecting(false);
          },
          { timeout: 10000, enableHighAccuracy: false }
        );
      } else {
        // Fallback directly if geolocation not supported
        try {
          const response = await callBackendAPI('/api/location/detect', undefined, 'GET');
          if (response.success) {
            localStorage.setItem('dibnow_user_location', JSON.stringify(response));
            applyMapping(response.countryCode);
          }
        } catch (err) {
          applyMapping('GB');
        }
        setIsDetecting(false);
      }
    };

    initCurrency();

    const handleStorage = () => {
      const saved = localStorage.getItem('fixit_active_currency');
      if (saved) setCurrency(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, isDetecting, setManualCurrency, availableCurrencies }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error('useCurrency must be used within CurrencyProvider');
  return context;
};