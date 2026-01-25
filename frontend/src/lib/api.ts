// frontend/src/lib/api.ts

// 1. Strict Environment Variable Logic
// In Production (Vercel/Netlify), this uses the VITE_API_URL variable you set.
// In Development (Local), it defaults to localhost:5000 unless you override it in .env
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
    const url = new URL(`${API_URL}${endpoint}`);
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
    const response = await fetch(`${API_URL}${endpoint}`, {
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
    const response = await fetch(`${API_URL}${endpoint}`, {
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
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'API Error' }));
        throw new Error(error.message || 'API request failed');
    }
    return response.json();
  },
};
