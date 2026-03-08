// API Configuration
// Get API URL from environment variable or use relative path for same-origin

const getApiBaseUrl = (): string => {
  // Check for environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Use relative path for same-origin (works with Vercel rewrites or proxy)
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

export const getApiUrl = (endpoint: string): string => {
  // If API_BASE_URL is empty, use relative path
  if (!API_BASE_URL) {
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
  
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL.replace(/\/$/, '')}/${cleanEndpoint}`;
};
