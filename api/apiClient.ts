/**
 * API Client for Backend Communication
 * Handles all API calls to the backend server with proper error handling
 */

// Use the environment variable that matches Vercel config
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dibnowrepairsaas.onrender.com';

/**
 * Make a POST request to the backend API
 * @param endpoint - API endpoint path (e.g., '/api/stripe/create-checkout-session')
 * @param data - Request payload
 * @returns Response data from the API
 */
export async function callBackendAPI(endpoint: string, data: any) {
    try {
        const token = localStorage.getItem('dibnow_token');

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Include auth token if available
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({
                message: `HTTP ${response.status}: ${response.statusText}`
            }));
            throw new Error(error.message || 'API request failed');
        }

        return await response.json();
    } catch (error: any) {
        console.error('[API Client] Error:', error);
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
