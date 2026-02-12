import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../api/db.ts';

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
      if (saved) {
        setCurrency(JSON.parse(saved));
        setIsDetecting(false);
        return;
      }

      let detectedCountry = 'GB';
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const geo = await response.json();
          if (geo && geo.country_code) {
            detectedCountry = geo.country_code;
          }
        }
      } catch (error) {
        console.warn("Geo-detection failed, using fallback.");
      }

      const mapping = db.currencies.getByCountry(detectedCountry);
      if (mapping) {
        setCurrency({
          symbol: mapping.symbol,
          code: mapping.currencyCode,
          country: detectedCountry
        });
      }
      setIsDetecting(false);
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