const RUNTIME_HOST = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const IS_LOCAL_RUNTIME = RUNTIME_HOST === 'localhost' || RUNTIME_HOST === '127.0.0.1';
const API_BASE_URL = import.meta.env.VITE_API_URL || (IS_LOCAL_RUNTIME ? `http://${RUNTIME_HOST}:8000` : '/.netlify/functions/api');
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
  monthly_contribution: number;
  months_saved: number;
  monthly_income: number | null;
  mandatory_expenses: number | null;
  is_couple_goal: boolean;
  partner_name: string | null;
  plan_summary: string | null;
  notes: string | null;
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
}

export interface Transaction {
  id: number;
  user_id: number;
  goal_id: number | null;
  kind: 'income' | 'expense' | 'savings' | 'investment' | 'transfer';
  category: string;
  amount: number;
  note: string | null;
  occurred_on: string;
  created_at: string | null;
}

export interface TransactionSummaryItem {
  label: string;
  value: number;
}

export interface TransactionSummary {
  income: number;
  expenses: number;
  savings: number;
  investments: number;
  transfers: number;
  net: number;
  recent_transactions: Transaction[];
  breakdown: TransactionSummaryItem[];
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
    throw new Error('Not authenticated. Redirecting to login.');
  }

  let response: Response | undefined;
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
      if (response) break;
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

export async function resetPassword(payload: { email: string; password: string }) {
  return request<{ message: string }>('/api/v1/auth/reset-password', {
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
  monthly_contribution?: number;
  months_saved?: number;
  monthly_income?: number | null;
  mandatory_expenses?: number | null;
  is_couple_goal?: boolean;
  partner_name?: string | null;
  plan_summary?: string | null;
  notes?: string | null;
  deadline?: string | null;
  priority?: string | null;
}) {
  return request<Goal>('/api/v1/goals/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateGoal(goalId: number, payload: Partial<{
  title: string;
  target_amount: number;
  saved_amount: number;
  monthly_contribution: number;
  months_saved: number;
  monthly_income: number | null;
  mandatory_expenses: number | null;
  is_couple_goal: boolean;
  partner_name: string | null;
  plan_summary: string | null;
  notes: string | null;
  deadline: string | null;
  priority: string | null;
}>) {
  return request<Goal>(`/api/v1/goals/${goalId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteGoal(goalId: number) {
  return request<void>(`/api/v1/goals/${goalId}`, {
    method: 'DELETE',
  });
}

export async function fetchTransactions() {
  return request<Transaction[]>('/api/v1/transactions/');
}

export async function fetchTransactionSummary() {
  return request<TransactionSummary>('/api/v1/transactions/summary');
}

export async function createTransaction(payload: {
  kind: Transaction['kind'];
  category: string;
  amount: number;
  goal_id?: number | null;
  note?: string | null;
  occurred_on?: string;
}) {
  return request<Transaction>('/api/v1/transactions/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTransaction(transactionId: number, payload: Partial<{
  kind: Transaction['kind'];
  category: string;
  amount: number;
  goal_id: number | null;
  note: string | null;
  occurred_on: string;
}>) {
  return request<Transaction>(`/api/v1/transactions/${transactionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteTransaction(transactionId: number) {
  return request<void>(`/api/v1/transactions/${transactionId}`, {
    method: 'DELETE',
  });
}
