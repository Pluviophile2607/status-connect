
const API_URL = 'http://localhost:5001/api';

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
        console.error('API Error Response:', response.status, text);
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
