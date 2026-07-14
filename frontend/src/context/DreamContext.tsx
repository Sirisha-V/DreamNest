import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createGoal,
  createTransaction,
  deleteGoal as deleteGoalRequest,
  deleteTransaction,
  fetchDashboard,
  fetchGoals,
  fetchTransactions,
  type DashboardResponse,
  type Goal,
  type Transaction,
  type TransactionSummary,
  updateGoal as updateGoalRequest,
  updateTransaction,
} from '../lib/api';
import { clearOnboardingPending } from '../lib/onboarding';

const CACHE_PREFIX = 'dreamnest-cache';
const FALLBACK_CACHE_KEY = `${CACHE_PREFIX}:last`;
const ACTIVE_USER_HINT_KEY = 'dreamnest_active_user_hint';
const DAILY_MISSION_IDS = ['save', 'review', 'budget'] as const;
type DailyMissionId = typeof DAILY_MISSION_IDS[number];

interface SavingsHistoryItem {
  id: number;
  date: string;
  dreamId: number | null;
  dreamName: string;
  amount: number;
  type: 'Savings';
  description: 'Added savings';
}

interface AddTransactionPayload {
  kind: Transaction['kind'];
  category: string;
  amount: number;
  goal_id?: number | null;
  note?: string | null;
  occurred_on?: string;
}

interface CoinEvent {
  date: string;
  coins: number;
  reason: string;
}

interface MissionHistoryItem {
  completedIds: DailyMissionId[];
  bonusClaimed: boolean;
}

interface CoachState {
  dreamCoins: number;
  coinsEarnedToday: number;
  missionHistory: Record<string, MissionHistoryItem>;
  unlockedMilestones: string[];
  coinEvents: CoinEvent[];
  dreamCreateEvents: string[];
  dailyLoginRewards: string[];
  dailyCheckIns: string[];
  dreamReviewRewards: string[];
  onboardingCompleted: boolean;
}

interface LocalDreamCache {
  goals: Goal[];
  transactions: Transaction[];
  dashboardStats: DashboardResponse;
  savingsHistory: SavingsHistoryItem[];
  coachState: CoachState;
}

interface MissionRewardResult {
  awardedCoins: number;
  bonusCoins: number;
  allCompleted: boolean;
  streak: number;
}

interface DreamContextValue {
  goals: Goal[];
  transactions: Transaction[];
  transactionSummary: TransactionSummary;
  dashboard: DashboardResponse;
  savingsHistory: SavingsHistoryItem[];
  dreamCoins: number;
  coinsEarnedToday: number;
  currentStreak: number;
  todayMissionCompletion: number;
  dailyBonusUnlocked: boolean;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  addDream: (payload: Parameters<typeof createGoal>[0]) => Promise<Goal>;
  addSavings: (goalId: number, amount: number, occurredOn?: string) => Promise<Goal>;
  addTransaction: (payload: AddTransactionPayload) => Promise<Transaction>;
  deleteDream: (goalId: number) => Promise<void>;
  recalculateDashboard: (nextGoals: Goal[], nextTransactions: Transaction[]) => DashboardResponse;
  saveToStorage: (snapshot?: Partial<LocalDreamCache>) => void;
  loadFromStorage: () => LocalDreamCache | null;
  clearAppData: () => void;
  saveToDream: (goalId: number, amount: number, notes?: string, occurredOn?: string) => Promise<Goal>;
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
  completeMission: (missionId: DailyMissionId, rewardCoins: number) => MissionRewardResult;
  claimDailyCheckIn: () => number;
  recordDreamReview: () => number;
  getBadgeUnlocked: (badgeId: string) => boolean;
  dreamJarLevel: string;
  dreamJarProgress: number;
  coinEvents: CoinEvent[];
  missionHistory: Record<string, MissionHistoryItem>;
  dreamCreateEvents: string[];
  onboardingCompleted: boolean;
  completeOnboarding: () => void;
  initializeUserData: (displayName?: string) => void;
  grantDreamCoins: (coins: number, reason: string) => void;
}

const DreamContext = createContext<DreamContextValue | null>(null);

const defaultDashboard = (user = 'Dreamer'): DashboardResponse => ({
  user,
  dream_score: 0,
  total_saved: 0,
  total_target: 0,
  overall_progress: 0,
  active_dreams: 0,
  completed_dreams: 0,
  monthly_saving: 0,
});

const defaultCoachState = (): CoachState => ({
  dreamCoins: 0,
  coinsEarnedToday: 0,
  missionHistory: {},
  unlockedMilestones: [],
  coinEvents: [],
  dreamCreateEvents: [],
  dailyLoginRewards: [],
  dailyCheckIns: [],
  dreamReviewRewards: [],
  onboardingCompleted: true,
});

const todayIso = () => new Date().toISOString().slice(0, 10);

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Request timed out')), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return atob(`${normalized}${padding}`);
};

const normalizeIdentityValue = (value: string | null | undefined) => value?.trim().toLowerCase() || null;

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payloadRaw = base64UrlDecode(parts[1]);
    const payload = JSON.parse(payloadRaw) as Record<string, unknown>;
    return payload;
  } catch {
    return null;
  }
};

const getActiveUserIdentity = () => {
  const token = localStorage.getItem('dreamnest_token');
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (payload) {
    const emailCandidate = [payload.email, payload.preferred_username, payload.upn]
      .find((candidate): candidate is string => typeof candidate === 'string' && candidate.includes('@'));
    const normalizedEmail = normalizeIdentityValue(emailCandidate);
    if (normalizedEmail) {
      return `email:${normalizedEmail}`;
    }

    const idCandidate = [payload.user_id, payload.uid, payload.id, payload.sub]
      .find((candidate) => typeof candidate === 'number' || typeof candidate === 'string');
    if (idCandidate !== undefined && idCandidate !== null) {
      const normalizedId = normalizeIdentityValue(String(idCandidate));
      if (normalizedId) {
        return `id:${normalizedId}`;
      }
    }
  }

  try {
    const decoded = base64UrlDecode(token);
    if (decoded.startsWith('dreamnest:')) {
      const legacyEmail = normalizeIdentityValue(decoded.replace('dreamnest:', ''));
      if (legacyEmail) {
        return `email:${legacyEmail}`;
      }
    }
  } catch {
    // token format may not be decodable as a single base64 string.
  }

  const userHint = normalizeIdentityValue(localStorage.getItem(ACTIVE_USER_HINT_KEY));
  if (userHint) {
    return `hint:${userHint}`;
  }

  const tokenFingerprint = normalizeIdentityValue(token.slice(-24));
  if (tokenFingerprint) {
    return `token:${tokenFingerprint}`;
  }

  return null;
};

const getCacheKey = () => {
  const identity = getActiveUserIdentity();
  if (!identity) return FALLBACK_CACHE_KEY;
  return `${CACHE_PREFIX}:${identity}`;
};

const normalizeCoachState = (input: Partial<CoachState> | null | undefined): CoachState => {
  const base = defaultCoachState();
  if (!input) return base;
  return {
    dreamCoins: Number(input.dreamCoins ?? base.dreamCoins),
    coinsEarnedToday: Number(input.coinsEarnedToday ?? base.coinsEarnedToday),
    missionHistory: input.missionHistory ?? base.missionHistory,
    unlockedMilestones: Array.isArray(input.unlockedMilestones) ? input.unlockedMilestones : [],
    coinEvents: Array.isArray(input.coinEvents) ? input.coinEvents : [],
    dreamCreateEvents: Array.isArray(input.dreamCreateEvents) ? input.dreamCreateEvents : [],
    dailyLoginRewards: Array.isArray(input.dailyLoginRewards) ? input.dailyLoginRewards : [],
    dailyCheckIns: Array.isArray(input.dailyCheckIns) ? input.dailyCheckIns : [],
    dreamReviewRewards: Array.isArray(input.dreamReviewRewards) ? input.dreamReviewRewards : [],
    onboardingCompleted: typeof input.onboardingCompleted === 'boolean' ? input.onboardingCompleted : true,
  };
};

const readLocalCache = (): LocalDreamCache | null => {
  const primaryKey = getCacheKey();
  const candidates = [primaryKey];

  for (const key of candidates) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Partial<LocalDreamCache>;
      return {
        goals: Array.isArray(parsed.goals) ? parsed.goals : [],
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        dashboardStats: parsed.dashboardStats ?? defaultDashboard(),
        savingsHistory: Array.isArray(parsed.savingsHistory) ? parsed.savingsHistory : [],
        coachState: normalizeCoachState(parsed.coachState),
      };
    } catch {
      continue;
    }
  }

  return null;
};

const writeLocalCache = (cache: LocalDreamCache) => {
  const key = getCacheKey();
  const serialized = JSON.stringify(cache);
  localStorage.setItem(key, serialized);
};

const computeTransactionSummary = (items: Transaction[]): TransactionSummary => {
  const totals = {
    income: 0,
    expenses: 0,
    savings: 0,
    investments: 0,
    transfers: 0,
  };

  const breakdownMap = new Map<string, number>();

  items.forEach((item) => {
    if (item.kind === 'income') totals.income += item.amount;
    if (item.kind === 'expense') totals.expenses += item.amount;
    if (item.kind === 'savings') totals.savings += item.amount;
    if (item.kind === 'investment') totals.investments += item.amount;
    if (item.kind === 'transfer') totals.transfers += item.amount;

    const current = breakdownMap.get(item.category) ?? 0;
    breakdownMap.set(item.category, current + item.amount);
  });

  const breakdown = [...breakdownMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return {
    income: totals.income,
    expenses: totals.expenses,
    savings: totals.savings,
    investments: totals.investments,
    transfers: totals.transfers,
    net: totals.income - totals.expenses,
    recent_transactions: items.slice(0, 8),
    breakdown,
  };
};

const buildSavingsHistory = (goals: Goal[], items: Transaction[], previous: SavingsHistoryItem[] = []): SavingsHistoryItem[] => {
  const goalNameById = new Map<number, string>();
  goals.forEach((goal) => goalNameById.set(goal.id, goal.title));
  previous.forEach((entry) => {
    if (entry.dreamId !== null && !goalNameById.has(entry.dreamId)) {
      goalNameById.set(entry.dreamId, entry.dreamName);
    }
  });

  return items
    .filter((item) => item.kind === 'savings')
    .map((item) => ({
      id: item.id,
      date: item.occurred_on,
      dreamId: item.goal_id,
      dreamName: item.goal_id !== null ? goalNameById.get(item.goal_id) ?? item.category : item.category,
      amount: item.amount,
      type: 'Savings' as const,
      description: 'Added savings' as const,
    }));
};

const computeDashboard = (user: string, goals: Goal[], items: Transaction[]): DashboardResponse => {
  const income = items.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expenses = items.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const transfers = items.filter((item) => item.kind === 'transfer').reduce((sum, item) => sum + item.amount, 0);

  const totalSaved = goals.reduce((sum, goal) => sum + goal.saved_amount, 0);
  const totalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const completedDreams = goals.filter((goal) => goal.target_amount > 0 && goal.saved_amount >= goal.target_amount).length;
  const monthlySaving = items.filter((item) => item.kind === 'savings').reduce((sum, item) => sum + item.amount, 0);
  const overallProgress = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;
  const net = income - expenses - transfers;
  const activityBonus = Math.min(12, items.length * 2);
  const dreamScore = Math.round(Math.min(100, Math.max(0, overallProgress * 0.65 + completedDreams * 8 + (net > 0 ? 10 : 0) + activityBonus)));

  return {
    user,
    dream_score: dreamScore,
    total_saved: totalSaved,
    total_target: totalTarget,
    overall_progress: overallProgress,
    active_dreams: goals.length,
    completed_dreams: completedDreams,
    monthly_saving: monthlySaving,
  };
};

const computeStreak = (missionHistory: Record<string, MissionHistoryItem>) => {
  const completeDays = new Set(
    Object.entries(missionHistory)
      .filter(([, value]) => DAILY_MISSION_IDS.every((id) => value.completedIds.includes(id)))
      .map(([date]) => date),
  );

  let streak = 0;
  let cursor = new Date();
  while (true) {
    const day = cursor.toISOString().slice(0, 10);
    if (!completeDays.has(day)) {
      break;
    }
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const getDreamJarMeta = (coins: number) => {
  const levels = [
    { name: 'Explorer', min: 0, max: 199 },
    { name: 'Dream Builder', min: 200, max: 599 },
    { name: 'Future Maker', min: 600, max: 1199 },
    { name: 'Visionary', min: 1200, max: 2199 },
    { name: 'Legend', min: 2200, max: Number.POSITIVE_INFINITY },
  ];

  const level = levels.find((item) => coins >= item.min && coins <= item.max) ?? levels[levels.length - 1];
  const progress = Number.isFinite(level.max)
    ? Math.min(100, ((coins - level.min) / Math.max(1, level.max - level.min + 1)) * 100)
    : 100;

  return {
    level: level.name,
    progress,
  };
};

const saveAppData = (cache: LocalDreamCache) => {
  writeLocalCache(cache);
};

const loadAppData = () => readLocalCache();

const clearAppData = () => {
  const key = getCacheKey();
  localStorage.removeItem(key);
  if (key === FALLBACK_CACHE_KEY) {
    localStorage.removeItem(FALLBACK_CACHE_KEY);
  }
};

export const DreamProvider = ({ children }: { children: React.ReactNode }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dashboardUser, setDashboardUser] = useState('Dreamer');
  const [savingsHistory, setSavingsHistory] = useState<SavingsHistoryItem[]>([]);
  const [coachState, setCoachState] = useState<CoachState>(defaultCoachState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const recentSavingsOpRef = useRef<Map<string, number>>(new Map());

  const transactionSummary = useMemo(() => computeTransactionSummary(transactions), [transactions]);
  const dashboard = useMemo(() => computeDashboard(dashboardUser, goals, transactions), [dashboardUser, goals, transactions]);

  const today = todayIso();
  const todayMission = coachState.missionHistory[today] ?? { completedIds: [], bonusClaimed: false };
  const currentStreak = useMemo(() => computeStreak(coachState.missionHistory), [coachState.missionHistory]);
  const jarMeta = useMemo(() => getDreamJarMeta(coachState.dreamCoins), [coachState.dreamCoins]);

  const saveToStorage = useCallback((snapshot?: Partial<LocalDreamCache>) => {
    saveAppData({
      goals: snapshot?.goals ?? goals,
      transactions: snapshot?.transactions ?? transactions,
      dashboardStats: snapshot?.dashboardStats ?? dashboard,
      savingsHistory: snapshot?.savingsHistory ?? savingsHistory,
      coachState: snapshot?.coachState ?? coachState,
    });
  }, [goals, transactions, dashboard, savingsHistory, coachState]);

  const loadFromStorage = useCallback(() => loadAppData(), []);

  const clearStoredAppData = useCallback(() => {
    clearAppData();
  }, []);

  const recalculateDashboard = useCallback((nextGoals: Goal[], nextTransactions: Transaction[]) => computeDashboard(dashboardUser, nextGoals, nextTransactions), [dashboardUser]);

  const awardCoins = useCallback((coins: number, reason: string, eventDate = todayIso()) => {
    if (coins <= 0) return;
    setCoachState((prev) => {
      const lastEventDate = prev.coinEvents[0]?.date;
      const nextCoinsToday = lastEventDate === eventDate || eventDate === todayIso()
        ? prev.coinsEarnedToday + coins
        : coins;

      return {
        ...prev,
        dreamCoins: prev.dreamCoins + coins,
        coinsEarnedToday: nextCoinsToday,
        coinEvents: [{ date: eventDate, coins, reason }, ...prev.coinEvents].slice(0, 240),
      };
    });
  }, []);

  const grantDreamCoins = useCallback((coins: number, reason: string) => {
    awardCoins(coins, reason, todayIso());
  }, [awardCoins]);

  const applySnapshot = useCallback((nextGoals: Goal[], nextTransactions: Transaction[], nextSavingsHistory?: SavingsHistoryItem[]) => {
    const mergedHistory = nextSavingsHistory ?? buildSavingsHistory(nextGoals, nextTransactions, savingsHistory);
    setGoals(nextGoals);
    setTransactions(nextTransactions);
    setSavingsHistory(mergedHistory);
    saveToStorage({
      goals: nextGoals,
      transactions: nextTransactions,
      dashboardStats: recalculateDashboard(nextGoals, nextTransactions),
      savingsHistory: mergedHistory,
    });
  }, [recalculateDashboard, saveToStorage, savingsHistory]);

  const mergeTransaction = useCallback((entry: Transaction, current: Transaction[]) => {
    const existingById = current.find((item) => item.id === entry.id);
    if (existingById) {
      const sameEntry =
        existingById.kind === entry.kind &&
        existingById.category === entry.category &&
        existingById.amount === entry.amount &&
        existingById.goal_id === entry.goal_id &&
        existingById.occurred_on === entry.occurred_on &&
        (existingById.note ?? null) === (entry.note ?? null);

      if (sameEntry) {
        return current;
      }

      // Netlify function memory can reset IDs; preserve the new entry locally with a synthetic ID.
      const collisionSafeEntry: Transaction = {
        ...entry,
        id: -Math.floor(Date.now() + Math.random() * 1000),
      };
      return [collisionSafeEntry, ...current];
    }
    return [entry, ...current];
  }, []);

  const addTransaction = useCallback(async (payload: AddTransactionPayload) => {
    try {
      return await withTimeout(createTransaction(payload), 4500);
    } catch {
      const now = new Date().toISOString();
      return {
        id: -Math.floor(Date.now() + Math.random() * 1000),
        user_id: 0,
        goal_id: payload.goal_id ?? null,
        kind: payload.kind,
        category: payload.category,
        amount: payload.amount,
        note: payload.note ?? null,
        occurred_on: payload.occurred_on ?? now.slice(0, 10),
        created_at: now,
      };
    }
  }, []);

  const markMilestoneReward = useCallback((goalId: number, threshold: 25 | 50 | 75 | 100) => {
    const key = `${goalId}-${threshold}`;
    let shouldReward = false;
    setCoachState((prev) => {
      if (prev.unlockedMilestones.includes(key)) {
        return prev;
      }
      shouldReward = true;
      return {
        ...prev,
        unlockedMilestones: [...prev.unlockedMilestones, key],
      };
    });

    if (shouldReward) {
      const reward = threshold === 25 ? 50 : threshold === 50 ? 100 : threshold === 75 ? 150 : 300;
      awardCoins(reward, `${threshold}% milestone`);
    }
  }, [awardCoins]);

  const addSavings = useCallback(async (goalId: number, amount: number, occurredOn?: string) => {
    const goal = goals.find((item) => item.id === goalId);
    if (!goal) {
      throw new Error('Dream not found');
    }

    const date = occurredOn || todayIso();
    const opKey = `${goalId}|${amount}|${date}|Added savings`;
    const now = Date.now();

    for (const [key, timestamp] of recentSavingsOpRef.current.entries()) {
      if (now - timestamp > 7000) {
        recentSavingsOpRef.current.delete(key);
      }
    }

    if (recentSavingsOpRef.current.has(opKey)) {
      return goal;
    }

    const existing = transactions.find((item) => (
      item.kind === 'savings'
      && item.goal_id === goalId
      && item.amount === amount
      && item.occurred_on === date
      && (item.note ?? '') === 'Added savings'
    ));
    if (existing) {
      return goal;
    }

    recentSavingsOpRef.current.set(opKey, now);

    const entry = await addTransaction({
      kind: 'savings',
      category: goal.title,
      amount,
      goal_id: goalId,
      note: 'Added savings',
      occurred_on: date,
    });

    let updatedGoal = goal;
    try {
      updatedGoal = await withTimeout(updateGoalRequest(goalId, {
        saved_amount: goal.saved_amount + amount,
      }), 4500);
    } catch {
      const nextSaved = goal.saved_amount + amount;
      updatedGoal = {
        ...goal,
        saved_amount: nextSaved,
        remaining_amount: Math.max(0, goal.target_amount - nextSaved),
        progress: goal.target_amount > 0 ? Math.min(100, (nextSaved / goal.target_amount) * 100) : 0,
      };
    }

    const nextGoals = goals.map((item) => (item.id === goalId ? updatedGoal : item));
    const nextTransactions = mergeTransaction(entry, transactions);
    const nextHistory = buildSavingsHistory(nextGoals, nextTransactions, savingsHistory);
    applySnapshot(nextGoals, nextTransactions, nextHistory);

    awardCoins(25, 'Add savings', date);

    const previousProgress = Math.floor(goal.progress);
    const nextProgress = Math.floor(updatedGoal.progress);
    if (previousProgress < 25 && nextProgress >= 25) markMilestoneReward(goal.id, 25);
    if (previousProgress < 50 && nextProgress >= 50) markMilestoneReward(goal.id, 50);
    if (previousProgress < 75 && nextProgress >= 75) markMilestoneReward(goal.id, 75);
    if (previousProgress < 100 && nextProgress >= 100) markMilestoneReward(goal.id, 100);

    return updatedGoal;
  }, [addTransaction, applySnapshot, awardCoins, goals, markMilestoneReward, mergeTransaction, savingsHistory, transactions]);

  const updateDream = useCallback(async (goalId: number, data: Partial<Omit<Goal, 'id'>>) => {
    const currentGoal = goals.find((item) => item.id === goalId);
    if (!currentGoal) {
      throw new Error('Dream not found');
    }

    let updated: Goal;
    try {
      updated = await withTimeout(updateGoalRequest(goalId, data), 4500);
    } catch {
      const merged = { ...currentGoal, ...data };
      const savedAmount = merged.saved_amount;
      const targetAmount = merged.target_amount;
      updated = {
        ...merged,
        progress: targetAmount > 0 ? Math.min(100, (savedAmount / targetAmount) * 100) : 0,
        remaining_amount: Math.max(0, targetAmount - savedAmount),
      };
    }

    const nextGoals = goals.map((item) => (item.id === goalId ? updated : item));
    applySnapshot(nextGoals, transactions);
    return updated;
  }, [applySnapshot, goals, transactions]);

  const deleteDream = useCallback(async (goalId: number) => {
    try {
      await withTimeout(deleteGoalRequest(goalId), 4500);
    } catch {
      // fallback to local optimistic removal.
    }

    const nextGoals = goals.filter((item) => item.id !== goalId);
    applySnapshot(nextGoals, transactions);
  }, [applySnapshot, goals, transactions]);

  const addDream = useCallback(async (payload: Parameters<typeof createGoal>[0]) => {
    let dream: Goal;
    try {
      dream = await withTimeout(createGoal(payload), 4500);
    } catch {
      const now = new Date().toISOString();
      dream = {
        id: -Math.floor(Date.now() + Math.random() * 1000),
        title: payload.title,
        target_amount: payload.target_amount,
        saved_amount: payload.saved_amount ?? 0,
        monthly_contribution: payload.monthly_contribution ?? 0,
        months_saved: payload.months_saved ?? 0,
        monthly_income: payload.monthly_income ?? null,
        mandatory_expenses: payload.mandatory_expenses ?? null,
        is_couple_goal: payload.is_couple_goal ?? false,
        partner_name: payload.partner_name ?? null,
        plan_summary: payload.plan_summary ?? null,
        notes: payload.notes ?? null,
        deadline: payload.deadline ?? null,
        priority: payload.priority ?? null,
        progress: payload.target_amount > 0 ? Math.min(100, ((payload.saved_amount ?? 0) / payload.target_amount) * 100) : 0,
        remaining_amount: Math.max(0, payload.target_amount - (payload.saved_amount ?? 0)),
      };
      console.warn('Falling back to local-only dream create due to API unavailability at', now);
    }

    const nextGoals = [dream, ...goals];
    applySnapshot(nextGoals, transactions);

    setCoachState((prev) => ({
      ...prev,
      dreamCreateEvents: [todayIso(), ...prev.dreamCreateEvents].slice(0, 120),
    }));

    return dream;
  }, [applySnapshot, goals, transactions]);

  const addIncome = useCallback(async (amount: number, category: string, note?: string) => {
    const entry = await addTransaction({ kind: 'income', category, amount, note: note ?? null });
    const nextTransactions = mergeTransaction(entry, transactions);
    applySnapshot(goals, nextTransactions);
    return entry;
  }, [addTransaction, applySnapshot, goals, mergeTransaction, transactions]);

  const addExpense = useCallback(async (amount: number, category: string, note?: string) => {
    const entry = await addTransaction({ kind: 'expense', category, amount, note: note ?? null });
    const nextTransactions = mergeTransaction(entry, transactions);
    applySnapshot(goals, nextTransactions);
    return entry;
  }, [addTransaction, applySnapshot, goals, mergeTransaction, transactions]);

  const transferToSavings = useCallback(async (amount: number, goalId?: number | null, note?: string) => {
    if (goalId) {
      const updated = await addSavings(goalId, amount);
      const latest = transactions.find((item) => item.kind === 'savings' && item.goal_id === goalId && item.amount === amount && item.note === 'Added savings');
      if (latest) {
        return latest;
      }

      return {
        id: -Math.floor(Date.now() + Math.random() * 1000),
        user_id: 0,
        goal_id: updated.id,
        kind: 'savings' as const,
        category: updated.title,
        amount,
        note: 'Added savings' as const,
        occurred_on: todayIso(),
        created_at: new Date().toISOString(),
      };
    }

    const entry = await addTransaction({
      kind: 'savings',
      category: 'General Savings',
      amount,
      goal_id: null,
      note: note ?? 'Added savings',
      occurred_on: todayIso(),
    });
    const nextTransactions = mergeTransaction(entry, transactions);
    const nextHistory = buildSavingsHistory(goals, nextTransactions, savingsHistory);
    applySnapshot(goals, nextTransactions, nextHistory);
    awardCoins(25, 'Add savings');
    return entry;
  }, [addSavings, addTransaction, applySnapshot, awardCoins, goals, mergeTransaction, savingsHistory, transactions]);

  const editTransaction = useCallback(async (transactionId: number, data: Partial<{
    kind: Transaction['kind'];
    category: string;
    amount: number;
    goal_id: number | null;
    note: string | null;
    occurred_on: string;
  }>) => {
    const updated = await withTimeout(updateTransaction(transactionId, data), 4500);
    const nextTransactions = transactions.map((item) => (item.id === transactionId ? updated : item));
    const nextHistory = buildSavingsHistory(goals, nextTransactions, savingsHistory);
    applySnapshot(goals, nextTransactions, nextHistory);
    return updated;
  }, [applySnapshot, goals, savingsHistory, transactions]);

  const removeTransaction = useCallback(async (transactionId: number) => {
    const previousTransactions = transactions;
    const optimisticTransactions = previousTransactions.filter((item) => item.id !== transactionId);
    const optimisticHistory = buildSavingsHistory(goals, optimisticTransactions, savingsHistory);

    // Optimistically remove the item so UI stays responsive.
    applySnapshot(goals, optimisticTransactions, optimisticHistory);

    try {
      await withTimeout(deleteTransaction(transactionId), 4500);
      return;
    } catch (err) {
      // Reconcile against backend state to avoid false-negative delete failures.
      try {
        const latestTransactions = await withTimeout(fetchTransactions(), 4500);
        const stillExists = latestTransactions.some((item) => item.id === transactionId);
        if (!stillExists) {
          const nextHistory = buildSavingsHistory(goals, latestTransactions, savingsHistory);
          applySnapshot(goals, latestTransactions, nextHistory);
          return;
        }
      } catch {
        // If reconciliation also fails, surface the original error.
      }

      // Roll back optimistic deletion when backend confirms item still exists.
      const rollbackHistory = buildSavingsHistory(goals, previousTransactions, savingsHistory);
      applySnapshot(goals, previousTransactions, rollbackHistory);

      throw err;
    }
  }, [applySnapshot, goals, savingsHistory, transactions]);

  const saveToDream = useCallback(async (goalId: number, amount: number, _notes?: string, occurredOn?: string) => (
    addSavings(goalId, amount, occurredOn)
  ), [addSavings]);

  const removeDream = useCallback(async (goalId: number) => {
    await deleteDream(goalId);
  }, [deleteDream]);

  const initializeUserData = useCallback((displayName?: string) => {
    const userName = (displayName || 'Nana').trim() || 'Nana';
    setDashboardUser(userName);
    setGoals([]);
    setTransactions([]);
    setSavingsHistory([]);
    setCoachState((prev) => ({
      ...prev,
      onboardingCompleted: false,
    }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setCoachState((prev) => ({
      ...prev,
      onboardingCompleted: true,
    }));
    clearOnboardingPending();
  }, []);

  const claimDailyCheckIn = useCallback(() => {
    const day = todayIso();
    let awarded = 0;
    setCoachState((prev) => {
      if (prev.dailyCheckIns.includes(day)) {
        return prev;
      }
      awarded = 10;
      return {
        ...prev,
        dailyCheckIns: [day, ...prev.dailyCheckIns],
      };
    });
    if (awarded > 0) {
      awardCoins(awarded, 'Daily check-in', day);
    }
    return awarded;
  }, [awardCoins]);

  const recordDreamReview = useCallback(() => {
    const day = todayIso();
    let awarded = 0;
    setCoachState((prev) => {
      if (prev.dreamReviewRewards.includes(day)) {
        return prev;
      }
      awarded = 10;
      return {
        ...prev,
        dreamReviewRewards: [day, ...prev.dreamReviewRewards],
      };
    });
    if (awarded > 0) {
      awardCoins(awarded, 'Review dream', day);
    }
    return awarded;
  }, [awardCoins]);

  const completeMission = useCallback((missionId: DailyMissionId, rewardCoins: number): MissionRewardResult => {
    const day = todayIso();
    let awardedCoins = 0;
    let bonusCoins = 0;
    let allCompleted = false;
    let streak = 0;

    setCoachState((prev) => {
      const todayProgress = prev.missionHistory[day] ?? { completedIds: [], bonusClaimed: false };
      if (todayProgress.completedIds.includes(missionId)) {
        streak = computeStreak(prev.missionHistory);
        return prev;
      }

      const nextCompleted = [...todayProgress.completedIds, missionId] as DailyMissionId[];
      allCompleted = DAILY_MISSION_IDS.every((id) => nextCompleted.includes(id));
      awardedCoins = rewardCoins;

      const nextToday: MissionHistoryItem = {
        completedIds: nextCompleted,
        bonusClaimed: todayProgress.bonusClaimed,
      };

      if (allCompleted && !todayProgress.bonusClaimed) {
        bonusCoins = 50;
        nextToday.bonusClaimed = true;
      }

      const nextHistory = {
        ...prev.missionHistory,
        [day]: nextToday,
      };

      streak = computeStreak(nextHistory);

      return {
        ...prev,
        missionHistory: nextHistory,
      };
    });

    if (awardedCoins > 0) {
      awardCoins(awardedCoins, `Mission: ${missionId}`, day);
    }
    if (bonusCoins > 0) {
      awardCoins(bonusCoins, 'Daily bonus', day);
    }

    return { awardedCoins, bonusCoins, allCompleted, streak };
  }, [awardCoins]);

  const getBadgeUnlocked = useCallback((badgeId: string) => {
    if (badgeId === 'first-dream') return goals.length > 0;
    if (badgeId === 'first-100') return dashboard.total_saved >= 100;
    if (badgeId === 'first-1000') return dashboard.total_saved >= 1000;
    if (badgeId === 'streak-7') return currentStreak >= 7;
    if (badgeId === 'quarter') return goals.some((goal) => goal.progress >= 25);
    if (badgeId === 'fifty-transactions') return transactions.length >= 50;
    if (badgeId === 'dream-complete') return goals.some((goal) => goal.progress >= 100);
    return false;
  }, [currentStreak, dashboard.total_saved, goals, transactions.length]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const cached = loadFromStorage();
      if (cached) {
        setDashboardUser(cached.dashboardStats.user || 'Dreamer');
        setGoals(cached.goals);
        setTransactions(cached.transactions);
        setSavingsHistory(cached.savingsHistory.length > 0 ? cached.savingsHistory : buildSavingsHistory(cached.goals, cached.transactions));
        setCoachState(normalizeCoachState(cached.coachState));
      }

      const [dashboardData, goalsData, transactionsData] = await Promise.all([
        fetchDashboard().catch(() => null),
        fetchGoals(),
        fetchTransactions(),
      ]);

      const localCache = loadFromStorage();
      const backendLooksEmpty = goalsData.length === 0 && transactionsData.length === 0;
      const hasLocalData = Boolean(localCache && (localCache.goals.length > 0 || localCache.transactions.length > 0));

      if (backendLooksEmpty && hasLocalData && localCache) {
        setDashboardUser(localCache.dashboardStats.user || 'Dreamer');
        setGoals(localCache.goals);
        setTransactions(localCache.transactions);
        setSavingsHistory(localCache.savingsHistory.length > 0 ? localCache.savingsHistory : buildSavingsHistory(localCache.goals, localCache.transactions));
        setCoachState(normalizeCoachState(localCache.coachState));
        return;
      }

      setDashboardUser(dashboardData?.user || 'Dreamer');
      applySnapshot(goalsData, transactionsData);
    } catch (err) {
      const localCache = loadFromStorage();
      if (localCache) {
        setDashboardUser(localCache.dashboardStats.user || 'Dreamer');
        setGoals(localCache.goals);
        setTransactions(localCache.transactions);
        setSavingsHistory(localCache.savingsHistory.length > 0 ? localCache.savingsHistory : buildSavingsHistory(localCache.goals, localCache.transactions));
        setCoachState(normalizeCoachState(localCache.coachState));
        setError('Using your saved local data while connection recovers.');
      } else {
        setError(err instanceof Error ? err.message : 'Unable to refresh dreams');
      }
    } finally {
      setLoading(false);
    }
  }, [applySnapshot, loadFromStorage]);

  useEffect(() => {
    if (!localStorage.getItem('dreamnest_token')) {
      setLoading(false);
      return;
    }

    void refresh();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('dreamnest_token')) {
      return;
    }

    saveToStorage();
  }, [coachState, dashboard, goals, savingsHistory, saveToStorage, transactions]);

  useEffect(() => {
    const day = todayIso();
    if (!localStorage.getItem('dreamnest_token')) {
      return;
    }

    let shouldAwardLogin = false;
    setCoachState((prev) => {
      if (prev.dailyLoginRewards.includes(day)) {
        return prev;
      }
      shouldAwardLogin = true;
      return {
        ...prev,
        dailyLoginRewards: [day, ...prev.dailyLoginRewards],
      };
    });

    if (shouldAwardLogin) {
      awardCoins(5, 'Login reward', day);
    }

    claimDailyCheckIn();
  }, [awardCoins, claimDailyCheckIn]);

  const value = useMemo(
    () => ({
      goals,
      transactions,
      transactionSummary,
      dashboard,
      savingsHistory,
      dreamCoins: coachState.dreamCoins,
      coinsEarnedToday: coachState.coinsEarnedToday,
      currentStreak,
      todayMissionCompletion: todayMission.completedIds.length,
      dailyBonusUnlocked: todayMission.bonusClaimed,
      loading,
      error,
      refresh,
      addDream,
      addSavings,
      addTransaction,
      deleteDream,
      recalculateDashboard,
      saveToStorage,
      loadFromStorage,
      clearAppData: clearStoredAppData,
      saveToDream,
      removeDream,
      updateDream,
      addIncome,
      addExpense,
      transferToSavings,
      editTransaction,
      removeTransaction,
      completeMission,
      claimDailyCheckIn,
      recordDreamReview,
      getBadgeUnlocked,
      dreamJarLevel: jarMeta.level,
      dreamJarProgress: jarMeta.progress,
      coinEvents: coachState.coinEvents,
      missionHistory: coachState.missionHistory,
      dreamCreateEvents: coachState.dreamCreateEvents,
      onboardingCompleted: coachState.onboardingCompleted,
      completeOnboarding,
      initializeUserData,
      grantDreamCoins,
    }),
    [
      goals,
      transactions,
      transactionSummary,
      dashboard,
      savingsHistory,
      coachState.dreamCoins,
      coachState.coinsEarnedToday,
      coachState.coinEvents,
      currentStreak,
      coachState.dreamCreateEvents,
      coachState.missionHistory,
      coachState.onboardingCompleted,
      todayMission.completedIds.length,
      todayMission.bonusClaimed,
      loading,
      error,
      refresh,
      addDream,
      addSavings,
      addTransaction,
      deleteDream,
      recalculateDashboard,
      saveToStorage,
      loadFromStorage,
      clearStoredAppData,
      saveToDream,
      removeDream,
      updateDream,
      addIncome,
      addExpense,
      transferToSavings,
      editTransaction,
      removeTransaction,
      completeMission,
      claimDailyCheckIn,
      recordDreamReview,
      getBadgeUnlocked,
      jarMeta.level,
      jarMeta.progress,
      completeOnboarding,
      initializeUserData,
      grantDreamCoins,
    ],
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
