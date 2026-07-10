import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createGoal, createTransaction, deleteGoal, deleteTransaction, fetchDashboard, fetchGoals, fetchTransactionSummary, fetchTransactions, type DashboardResponse, type Goal, type Transaction, type TransactionSummary, updateGoal, updateTransaction } from '../lib/api';

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
      setDashboard(dashboardData);
      setGoals(goalsData);
      setTransactions(transactionsData);
      setTransactionSummary(transactionSummaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to refresh dreams');
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

  const addDream = async (payload: Parameters<typeof createGoal>[0]) => {
    const dream = await createGoal(payload);
    setGoals((current) => [dream, ...current]);
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
    setGoals((current) => current.map((item) => (item.id === goalId ? updated : item)));
    await refresh();
    return updated;
  };

  const removeDream = async (goalId: number) => {
    await deleteGoal(goalId);
    setGoals((current) => current.filter((item) => item.id !== goalId));
    await refresh();
  };

  const updateDream = async (goalId: number, data: Partial<Omit<Goal, 'id'>>) => {
    const updated = await updateGoal(goalId, data);
    setGoals((current) => current.map((item) => (item.id === goalId ? updated : item)));
    await refresh();
    return updated;
  };

  const addIncome = async (amount: number, category: string, note?: string) => {
    const entry = await createTransaction({ kind: 'income', category, amount, note: note ?? null });
    await refresh();
    return entry;
  };

  const addExpense = async (amount: number, category: string, note?: string) => {
    const entry = await createTransaction({ kind: 'expense', category, amount, note: note ?? null });
    await refresh();
    return entry;
  };

  const transferToSavings = async (amount: number, goalId?: number | null, note?: string) => {
    const entry = await createTransaction({ kind: 'savings', category: 'Savings transfer', amount, goal_id: goalId ?? null, note: note ?? null });
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
    await refresh();
    return updated;
  };

  const removeTransaction = async (transactionId: number) => {
    await deleteTransaction(transactionId);
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
