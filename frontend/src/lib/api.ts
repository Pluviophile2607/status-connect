// frontend/src/lib/api.ts

// 1. Get the API URL from Environment Variables (Best Practice)
// If VITE_API_URL is missing, it falls back to localhost for development.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  get: async (endpoint: string, params: Record<string, any> = {}) => {
    // 2. Clean up the endpoint to ensure valid URL
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${API_URL}${cleanEndpoint}`);
    
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(),
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'API Error' }));
        throw new Error(error.message || 'API request failed');
    }
    return response.json();
  },

  post: async (endpoint: string, body: any) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(`${API_URL}${cleanEndpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'API Error' }));
        throw new Error(error.message || 'API request failed');
    }
    return response.json();
  },

  put: async (endpoint: string, body: any) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(`${API_URL}${cleanEndpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const text = await response.text();
        try {
            const error = JSON.parse(text);
            throw new Error(error.message || 'API request failed');
        } catch (e: any) {
             throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
    }
    return response.json();
  },

  delete: async (endpoint: string) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(`${API_URL}${cleanEndpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'API Error' }));
        throw new Error(error.message || 'API request failed');
    }
    return response.json();
  }
};
