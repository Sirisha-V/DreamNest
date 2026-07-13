import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createGoal, createTransaction, deleteGoal, deleteTransaction, fetchDashboard, fetchGoals, fetchTransactionSummary, fetchTransactions, type DashboardResponse, type Goal, type Transaction, type TransactionSummary, updateGoal, updateTransaction } from '../lib/api';

const CACHE_PREFIX = 'dreamnest-cache';

interface LocalDreamCache {
  goals: Goal[];
  transactions: Transaction[];
  transactionSummary: TransactionSummary | null;
  dashboard: DashboardResponse | null;
}

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return atob(`${normalized}${padding}`);
};

const getActiveUserEmail = () => {
  const token = localStorage.getItem('dreamnest_token');
  if (!token) return null;
  try {
    const decoded = base64UrlDecode(token);
    if (!decoded.startsWith('dreamnest:')) return null;
    return decoded.replace('dreamnest:', '').trim().toLowerCase() || null;
  } catch {
    return null;
  }
};

const getCacheKey = () => {
  const email = getActiveUserEmail();
  if (!email) return null;
  return `${CACHE_PREFIX}:${email}`;
};

const readLocalCache = (): LocalDreamCache | null => {
  const key = getCacheKey();
  if (!key) return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalDreamCache;
    return {
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      transactionSummary: parsed.transactionSummary ?? null,
      dashboard: parsed.dashboard ?? null,
    };
  } catch {
    return null;
  }
};

const writeLocalCache = (cache: LocalDreamCache) => {
  const key = getCacheKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(cache));
};

interface DreamContextValue {
  goals: Goal[];
  transactions: Transaction[];
  transactionSummary: TransactionSummary | null;
  dashboard: DashboardResponse | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  addDream: (payload: Parameters<typeof createGoal>[0]) => Promise<Goal>;
  saveToDream: (goalId: number, amount: number, notes?: string) => Promise<Goal>;
  removeDream: (goalId: number) => Promise<void>;
  updateDream: (goalId: number, data: Partial<Omit<Goal, 'id'>>) => Promise<Goal>;
  addIncome: (amount: number, category: string, note?: string) => Promise<Transaction>;
  addExpense: (amount: number, category: string, note?: string) => Promise<Transaction>;
  transferToSavings: (amount: number, goalId?: number | null, note?: string) => Promise<Transaction>;
  editTransaction: (transactionId: number, data: Partial<{
    kind: Transaction['kind'];
    category: string;
    amount: number;
    goal_id: number | null;
    note: string | null;
    occurred_on: string;
  }>) => Promise<Transaction>;
  removeTransaction: (transactionId: number) => Promise<void>;
}

const DreamContext = createContext<DreamContextValue | null>(null);

export const DreamProvider = ({ children }: { children: React.ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary | null>(null);
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const persistCacheSnapshot = useCallback((snapshot: Partial<LocalDreamCache>) => {
    writeLocalCache({
      goals: snapshot.goals ?? goals,
      transactions: snapshot.transactions ?? transactions,
      transactionSummary: snapshot.transactionSummary ?? transactionSummary,
      dashboard: snapshot.dashboard ?? dashboard,
    });
  }, [goals, transactions, transactionSummary, dashboard]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardData, goalsData, transactionsData, transactionSummaryData] = await Promise.all([
        fetchDashboard(),
        fetchGoals(),
        fetchTransactions(),
        fetchTransactionSummary(),
      ]);

      const localCache = readLocalCache();
      const backendLooksEmpty = goalsData.length === 0 && transactionsData.length === 0;
      const hasLocalData = Boolean(localCache && (localCache.goals.length > 0 || localCache.transactions.length > 0));

      if (backendLooksEmpty && hasLocalData && localCache) {
        setDashboard(localCache.dashboard);
        setGoals(localCache.goals);
        setTransactions(localCache.transactions);
        setTransactionSummary(localCache.transactionSummary);
        return;
      }

      setDashboard(dashboardData);
      setGoals(goalsData);
      setTransactions(transactionsData);
      setTransactionSummary(transactionSummaryData);

      writeLocalCache({
        dashboard: dashboardData,
        goals: goalsData,
        transactions: transactionsData,
        transactionSummary: transactionSummaryData,
      });
    } catch (err) {
      const localCache = readLocalCache();
      if (localCache) {
        setDashboard(localCache.dashboard);
        setGoals(localCache.goals);
        setTransactions(localCache.transactions);
        setTransactionSummary(localCache.transactionSummary);
        setError('Using your saved local data while connection recovers.');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to refresh dreams');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('dreamnest_token')) {
      setLoading(false);
      return;
    }

    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!localStorage.getItem('dreamnest_token')) {
      return;
    }

    writeLocalCache({
      dashboard,
      goals,
      transactions,
      transactionSummary,
    });
  }, [dashboard, goals, transactions, transactionSummary]);

  const addDream = async (payload: Parameters<typeof createGoal>[0]) => {
    const dream = await createGoal(payload);
    const nextGoals = [dream, ...goals];
    setGoals(nextGoals);
    persistCacheSnapshot({ goals: nextGoals });
    await refresh();
    return dream;
  };

  const saveToDream = async (goalId: number, amount: number, notes?: string) => {
    const dream = goals.find((item) => item.id === goalId);
    if (!dream) throw new Error('Dream not found');
    const updated = await updateGoal(goalId, {
      saved_amount: dream.saved_amount + amount,
      notes: notes ?? dream.notes,
    });
    const nextGoals = goals.map((item) => (item.id === goalId ? updated : item));
    setGoals(nextGoals);
    persistCacheSnapshot({ goals: nextGoals });
    await refresh();
    return updated;
  };

  const removeDream = async (goalId: number) => {
    await deleteGoal(goalId);
    const nextGoals = goals.filter((item) => item.id !== goalId);
    setGoals(nextGoals);
    persistCacheSnapshot({ goals: nextGoals });
    await refresh();
  };

  const updateDream = async (goalId: number, data: Partial<Omit<Goal, 'id'>>) => {
    const updated = await updateGoal(goalId, data);
    const nextGoals = goals.map((item) => (item.id === goalId ? updated : item));
    setGoals(nextGoals);
    persistCacheSnapshot({ goals: nextGoals });
    await refresh();
    return updated;
  };

  const addIncome = async (amount: number, category: string, note?: string) => {
    const entry = await createTransaction({ kind: 'income', category, amount, note: note ?? null });
    const nextTransactions = [entry, ...transactions];
    setTransactions(nextTransactions);
    persistCacheSnapshot({ transactions: nextTransactions });
    await refresh();
    return entry;
  };

  const addExpense = async (amount: number, category: string, note?: string) => {
    const entry = await createTransaction({ kind: 'expense', category, amount, note: note ?? null });
    const nextTransactions = [entry, ...transactions];
    setTransactions(nextTransactions);
    persistCacheSnapshot({ transactions: nextTransactions });
    await refresh();
    return entry;
  };

  const transferToSavings = async (amount: number, goalId?: number | null, note?: string) => {
    const entry = await createTransaction({ kind: 'savings', category: 'Savings transfer', amount, goal_id: goalId ?? null, note: note ?? null });
    const nextTransactions = [entry, ...transactions];
    setTransactions(nextTransactions);
    persistCacheSnapshot({ transactions: nextTransactions });
    await refresh();
    return entry;
  };

  const editTransaction = async (transactionId: number, data: Partial<{
    kind: Transaction['kind'];
    category: string;
    amount: number;
    goal_id: number | null;
    note: string | null;
    occurred_on: string;
  }>) => {
    const updated = await updateTransaction(transactionId, data);
    const nextTransactions = transactions.map((item) => (item.id === transactionId ? updated : item));
    setTransactions(nextTransactions);
    persistCacheSnapshot({ transactions: nextTransactions });
    await refresh();
    return updated;
  };

  const removeTransaction = async (transactionId: number) => {
    await deleteTransaction(transactionId);
    const nextTransactions = transactions.filter((item) => item.id !== transactionId);
    setTransactions(nextTransactions);
    persistCacheSnapshot({ transactions: nextTransactions });
    await refresh();
  };

  const value = useMemo(
    () => ({ goals, transactions, transactionSummary, dashboard, loading, error, refresh, addDream, saveToDream, removeDream, updateDream, addIncome, addExpense, transferToSavings, editTransaction, removeTransaction }),
    [goals, transactions, transactionSummary, dashboard, loading, error, refresh],
  );

  return <DreamContext.Provider value={value}>{children}</DreamContext.Provider>;
};

export const useDreams = () => {
  const context = useContext(DreamContext);
  if (!context) {
    throw new Error('useDreams must be used within DreamProvider');
  }
  return context;
};
