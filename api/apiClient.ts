/**
 * API Client for Backend Communication
 * Handles all API calls to the backend server with proper error handling
 */

// Use the environment variable that matches Vercel config
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dibnowrepairsaas.onrender.com';

/**
 * Make an HTTP request to the backend API
 * @param endpoint - API endpoint path (e.g., '/api/stripe/create-checkout-session')
 * @param data - Request payload (optional for GET requests)
 * @param method - HTTP method (default: 'POST')
 * @returns Response data from the API
 */
export async function callBackendAPI(endpoint: string, data?: any, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST') {
    // 🔍 Log request details
    console.log('🚀 [API Client] Request:', {
        method: method,
        endpoint: endpoint,
        fullUrl: `${API_BASE_URL}${endpoint}`,
        data: data,
        timestamp: new Date().toISOString()
    });

    try {
        const token = localStorage.getItem('dibnow_token');

        const fetchOptions: RequestInit = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                // Include auth token if available
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };

        // Add body for non-GET requests if data exists
        if (method !== 'GET' && data) {
            fetchOptions.body = JSON.stringify(data);
        }

        console.log('📤 [API Client] Sending request with options:', fetchOptions);

        const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

        console.log('📥 [API Client] Response received:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            url: response.url
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: `HTTP ${response.status}: ${response.statusText}`
            }));

            console.error('❌ [API Client] Request failed:', {
                endpoint: endpoint,
                status: response.status,
                error: error,
                timestamp: new Date().toISOString()
            });

            // If it's a specific limit error, throw an error that includes the data
            if (response.status === 403 && error.limitHit) {
                const limitErr = new Error(error.message);
                (limitErr as any).limitHit = true;
                (limitErr as any).resourceType = error.resourceType;
                (limitErr as any).limit = error.limit;
                (limitErr as any).upgradeRequired = error.upgradeRequired;
                (limitErr as any).upgradeMessage = error.upgradeMessage;
                throw limitErr;
            }

            throw new Error(error.message || 'API request failed');
        }

        const responseData = await response.json();

        console.log('✅ [API Client] Success:', {
            endpoint: endpoint,
            response: responseData,
            timestamp: new Date().toISOString()
        });

        return responseData;
    } catch (error: any) {
        console.error('💥 [API Client] Exception caught:', {
            endpoint: endpoint,
            method: method,
            error: error,
            errorMessage: error.message,
            errorStack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Return a user-friendly error message
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to payment server. Please check your internet connection.');
        }
        throw error;
    }
}

/**
 * Get the current user ID from localStorage
 * @returns User ID string
 */
export function getBackendUserId(): string {
    const user = JSON.parse(localStorage.getItem('fixit_user') || '{}');
    return user.id || '';
}

/**
 * Get the current user's currency code
 * @returns Currency code (e.g., 'USD', 'GBP')
 */
export function getCurrentCurrency(): string {
    // Try to get from CurrencyContext if available, otherwise default to GBP
    return 'GBP'; // This will be overridden by the actual currency from context
}
