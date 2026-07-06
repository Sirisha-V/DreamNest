const RUNTIME_HOST = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${RUNTIME_HOST}:8000`;
const API_FALLBACK_BASE_URL = import.meta.env.VITE_API_URL
  ? undefined
  : RUNTIME_HOST === 'localhost'
  ? 'http://127.0.0.1:8000'
  : 'http://localhost:8000';

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface Goal {
  id: number;
  title: string;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
  priority: string | null;
  progress: number;
  remaining_amount: number;
}

export interface DashboardResponse {
  user: string;
  dream_score: number;
  total_saved: number;
  total_target: number;
  overall_progress: number;
  active_dreams: number;
  completed_dreams: number;
  monthly_saving: number;
  nesty: {
    title: string;
    message: string;
  };
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem('dreamnest_token');

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && options.auth !== false) {
    headers.set('Authorization', `Bearer ${token}`);
  } else if (options.auth !== false) {
    localStorage.removeItem('dreamnest_token');
    window.location.replace('/login');
    throw new Error('Not authenticated. Redirecting to login.');
  }

  let response: Response;
  const baseUrls = [API_BASE_URL];
  if (API_FALLBACK_BASE_URL) {
    baseUrls.push(API_FALLBACK_BASE_URL);
  }

  let lastError: unknown;
  for (const baseUrl of baseUrls) {
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers,
      });
      break;
    } catch (error) {
      lastError = error;
      console.warn(`Fetch failed for ${baseUrl}${path}:`, error);
    }
  }

  if (!response) {
    console.error('Network error connecting to DreamNest API:', lastError);
    throw new Error('Unable to connect to the DreamNest API. Please check that the backend is running.');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('dreamnest_token');
      window.location.replace('/login');
      throw new Error('Session expired. Please sign in again.');
    }
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function loginUser(payload: { email: string; password: string }) {
  return request<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: false,
  });
}

export async function registerUser(payload: { name: string; email: string; password: string }) {
  return request<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: false,
  });
}

export async function fetchDashboard() {
  return request<DashboardResponse>('/api/v1/dashboard/');
}

export async function fetchGoals() {
  return request<Goal[]>('/api/v1/goals/');
}

export async function createGoal(payload: {
  title: string;
  target_amount: number;
  saved_amount?: number;
  deadline?: string | null;
  priority?: string | null;
}) {
  return request<Goal>('/api/v1/goals/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
