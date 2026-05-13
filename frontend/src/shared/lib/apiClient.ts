const API_URL = import.meta.env.PUBLIC_API_URL || 'http://127.0.0.1:3000';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  status: number;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nutrisight_token');
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nutrisight_token', token);
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('nutrisight_token');
  }
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}/api${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      let errorMessage = 'Terjadi kesalahan';
      if (data.message) {
        errorMessage = Array.isArray(data.message) ? data.message[0] : data.message;
      }
      return {
        data: null,
        error: errorMessage,
        status: response.status,
      };
    }

    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (error) {
    return {
      data: null,
      error: 'Tidak dapat terhubung ke server',
      status: 0,
    };
  }
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'PUT', body }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    api.post<{ user: any; accessToken: string }>('/auth/login', { email, password }),
  
  register: (email: string, password: string, name: string) => 
    api.post<{ user: any; accessToken: string }>('/auth/register', { email, password, name }),
  
  getMe: () => api.get<any>('/auth/me'),
};

// Nutrition API
export const nutritionApi = {
  getAll: (search?: string, category?: string) => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    const qs = params.toString();
    return api.get<any[]>(`/nutrition${qs ? `?${qs}` : ''}`);
  },
  getCategories: () => api.get<string[]>('/nutrition/categories'),
  getMenus: () => api.get<any[]>('/nutrition/menus'),
  getStats: () => api.get<any>('/nutrition/stats'),
};

// History API
export const historyApi = {
  getAll: (page = 1, limit = 10) => 
    api.get<any>(`/history?page=${page}&limit=${limit}`),
  getStats: () => api.get<any>('/history/stats'),
  create: (data: any) => api.post<any>('/history', data),
  delete: (id: string) => api.delete<any>(`/history/${id}`),
};

// Detection API — calls NestJS backend which proxies to Python Flask
export const detectionApi = {
  analyze: async (file: File): Promise<ApiResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(`${API_URL}/api/detection/analyze`, {
        method: 'POST',
        headers,
        body: formData,
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        return { data: null, error: 'Response tidak valid dari server', status: response.status };
      }

      if (!response.ok) {
        const errorMessage = data?.error || data?.message || 'Terjadi kesalahan';
        return { data: null, error: errorMessage, status: response.status };
      }

      return { data, error: null, status: response.status };
    } catch (error) {
      return { data: null, error: 'Tidak dapat terhubung ke server', status: 0 };
    }
  },
};

