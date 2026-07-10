import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowDownRight,
  ArrowUpRight,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet2,
} from 'lucide-react';
import { useDreams } from '../context/DreamContext';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const pieColors = ['#10b981', '#14b8a6', '#0ea5e9', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#22c55e'];

type MonthlyPoint = {
  key: string;
  label: string;
  income: number;
  expenses: number;
  savingsLedger: number;
  investments: number;
  goalSavings: number;
  calculatedSavings: number;
};

const formatCurrency = (value: number) => currencyFormatter.format(value);

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const parseDate = (value: string) => new Date(`${value}T00:00:00`);

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const monthLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(year, month - 1, 1));
};

const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1);

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const formatDate = (date: Date) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);

const diffLabel = (current: number, previous: number) => {
  const delta = current - previous;
  const percentage = previous === 0 ? null : (delta / previous) * 100;
  return {
    delta,
    percentage,
  };
};

const directionClass = (delta: number) => (delta >= 0 ? 'text-emerald-600' : 'text-rose-600');

const ProgressRing = ({ value, label, detail, tone }: { value: number; label: string; detail: string; tone: string }) => {
  const normalized = clamp(value, 0, 100);
  const radius = 42;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="analytics-ring-card">
      <div className="analytics-ring-wrap">
        <svg className="analytics-ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r={radius} stroke="rgba(148, 163, 184, 0.2)" strokeWidth={stroke} fill="none" />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={tone}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="analytics-ring-center">
          <strong>{percentFormatter.format(Math.round(normalized))}%</strong>
        </div>
      </div>
      <p className="setting-title">{label}</p>
      <p className="setting-detail">{detail}</p>
    </div>
  );
};

const AnalyticsPage = () => {
  const { dashboard, goals, transactions } = useDreams();

  const analytics = useMemo(() => {
    const incomeTransactions = transactions.filter((transaction) => transaction.kind === 'income');
    const expenseTransactions = transactions.filter((transaction) => transaction.kind === 'expense');
    const investmentTransactions = transactions.filter((transaction) => transaction.kind === 'investment');
    const savingsTransactions = transactions.filter((transaction) => transaction.kind === 'savings');

    const totalIncome = incomeTransactions.reduce((total, transaction) => total + transaction.amount, 0);
    const totalExpenses = expenseTransactions.reduce((total, transaction) => total + transaction.amount, 0);
    const investmentTotal = investmentTransactions.reduce((total, transaction) => total + transaction.amount, 0);
    const generalSavingsTotal = savingsTransactions.filter((transaction) => transaction.goal_id === null).reduce((total, transaction) => total + transaction.amount, 0);
    const goalSavingsTotal = goals.reduce((total, goal) => total + goal.saved_amount, 0);
    const totalSavings = goalSavingsTotal + generalSavingsTotal;
    const netSavings = totalIncome - totalExpenses - investmentTotal - totalSavings;
    const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
    const overallGoalProgress = goals.length > 0
      ? goals.reduce((total, goal) => total + goal.progress, 0) / goals.length
      : 0;
    const totalTarget = goals.reduce((total, goal) => total + goal.target_amount, 0);
    const goalSavingsRate = totalTarget > 0 ? (goalSavingsTotal / totalTarget) * 100 : 0;

    const now = startOfMonth(new Date());
    const currentMonthKey = monthKey(now);
    const previousMonthKey = monthKey(addMonths(now, -1));

    const timelineSourceDates = transactions.map((transaction) => parseDate(transaction.occurred_on));
    const earliestDate = timelineSourceDates.length > 0
      ? new Date(Math.min(...timelineSourceDates.map((date) => date.getTime())))
      : now;

    const monthKeys: string[] = [];
    let cursor = startOfMonth(earliestDate);
    while (cursor <= now) {
      monthKeys.push(monthKey(cursor));
      cursor = addMonths(cursor, 1);
    }

    const monthlyMap = new Map<string, MonthlyPoint>();
    monthKeys.forEach((key) => {
      monthlyMap.set(key, {
        key,
        label: monthLabel(key),
        income: 0,
        expenses: 0,
        savingsLedger: 0,
        investments: 0,
        goalSavings: 0,
        calculatedSavings: 0,
      });
    });

    transactions.forEach((transaction) => {
      const key = monthKey(parseDate(transaction.occurred_on));
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, {
          key,
          label: monthLabel(key),
          income: 0,
          expenses: 0,
          savingsLedger: 0,
          investments: 0,
          goalSavings: 0,
          calculatedSavings: 0,
        });
      }

      const bucket = monthlyMap.get(key)!;
      if (transaction.kind === 'income') {
        bucket.income += transaction.amount;
      }
      if (transaction.kind === 'expense') {
        bucket.expenses += transaction.amount;
      }
      if (transaction.kind === 'investment') {
        bucket.investments += transaction.amount;
      }
      if (transaction.kind === 'savings') {
        bucket.savingsLedger += transaction.amount;
        if (transaction.goal_id !== null) {
          bucket.goalSavings += transaction.amount;
        }
      }
    });

    const monthlySeries = Array.from(monthlyMap.values())
      .sort((left, right) => left.key.localeCompare(right.key))
      .map((entry) => ({
        ...entry,
        calculatedSavings: entry.income - entry.expenses,
      }));

    const currentMonth = monthlyMap.get(currentMonthKey) ?? {
      key: currentMonthKey,
      label: monthLabel(currentMonthKey),
      income: 0,
      expenses: 0,
      savingsLedger: 0,
      investments: 0,
      goalSavings: 0,
      calculatedSavings: 0,
    };

    const previousMonth = monthlyMap.get(previousMonthKey) ?? {
      key: previousMonthKey,
      label: monthLabel(previousMonthKey),
      income: 0,
      expenses: 0,
      savingsLedger: 0,
      investments: 0,
      goalSavings: 0,
      calculatedSavings: 0,
    };

    const currentMonthSavings = currentMonth.income - currentMonth.expenses;
    const currentMonthSavingsRate = currentMonth.income > 0 ? (currentMonthSavings / currentMonth.income) * 100 : 0;
    const currentMonthGoalProgress = totalTarget > 0 ? (currentMonth.goalSavings / totalTarget) * 100 : 0;

    const previousMonthSavings = previousMonth.income - previousMonth.expenses;
    const previousMonthSavingsRate = previousMonth.income > 0 ? (previousMonthSavings / previousMonth.income) * 100 : 0;
    const previousMonthGoalProgress = totalTarget > 0 ? (previousMonth.goalSavings / totalTarget) * 100 : 0;

    const highestExpenseCategory = expenseTransactions.reduce((leader, transaction) => {
      const current = leader[transaction.category] ?? 0;
      leader[transaction.category] = current + transaction.amount;
      return leader;
    }, {} as Record<string, number>);

    const highestIncomeCategory = incomeTransactions.reduce((leader, transaction) => {
      const current = leader[transaction.category] ?? 0;
      leader[transaction.category] = current + transaction.amount;
      return leader;
    }, {} as Record<string, number>);

    const expenseBreakdown = Object.entries(highestExpenseCategory)
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value);

    const dreamProgressSeries = goals
      .map((goal) => ({
        label: goal.title,
        progress: goal.progress,
        remaining: goal.remaining_amount,
      }))
      .sort((left, right) => right.progress - left.progress);

    const healthComponentSavingsRate = clamp(savingsRate, 0, 100);
    const averageMonthlyExpenses = monthKeys.length > 0 ? totalExpenses / monthKeys.length : 0;
    const emergencyFundMonths = averageMonthlyExpenses > 0 ? totalSavings / averageMonthlyExpenses : 0;
    const healthComponentEmergency = clamp((emergencyFundMonths / 6) * 100, 0, 100);
    const healthComponentInvestment = totalIncome > 0 ? clamp((investmentTotal / totalIncome) * 100, 0, 100) : 0;
    const healthComponentGoals = clamp(overallGoalProgress, 0, 100);
    const financialHealthScore = Math.round(
      (healthComponentSavingsRate * 0.35)
      + (healthComponentEmergency * 0.25)
      + (healthComponentInvestment * 0.15)
      + (healthComponentGoals * 0.25),
    );

    const financialHealthStatus = financialHealthScore >= 80
      ? 'Excellent'
      : financialHealthScore >= 60
        ? 'Good'
        : 'Needs Improvement';

    const monthlyDreamScore = Math.round(
      (clamp(currentMonthSavingsRate, 0, 100) * 0.35)
      + (clamp(currentMonthGoalProgress, 0, 100) * 0.25)
      + (totalIncome > 0 ? clamp((currentMonth.investments / totalIncome) * 100, 0, 100) * 0.15 : 0)
      + (clamp(overallGoalProgress, 0, 100) * 0.25),
    );

    const previousDreamScore = Math.round(
      (clamp(previousMonthSavingsRate, 0, 100) * 0.35)
      + (clamp(previousMonthGoalProgress, 0, 100) * 0.25)
      + (totalIncome > 0 ? clamp((previousMonth.investments / totalIncome) * 100, 0, 100) * 0.15 : 0)
      + (clamp(overallGoalProgress, 0, 100) * 0.25),
    );

    const savingsChange = diffLabel(currentMonthSavings, previousMonthSavings);
    const expenseChange = diffLabel(currentMonth.expenses, previousMonth.expenses);
    const incomeChange = diffLabel(currentMonth.income, previousMonth.income);
    const dreamScoreChange = diffLabel(monthlyDreamScore, previousDreamScore);

    const topExpenseCategory = expenseBreakdown[0] ?? null;
    const topIncomeCategory = Object.entries(highestIncomeCategory)
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value)[0] ?? null;

    const monthlyReport = {
      income: currentMonth.income,
      expenses: currentMonth.expenses,
      saved: currentMonthSavings,
      savingsRate: currentMonthSavingsRate,
      dreamProgress: currentMonthGoalProgress,
      highestExpenseCategory: topExpenseCategory,
      largestIncome: topIncomeCategory,
    };

    const insights: string[] = [];
    if (savingsChange.delta !== 0 || currentMonthSavings !== 0 || previousMonthSavings !== 0) {
      if (savingsChange.delta > 0) {
        insights.push(`You saved ${Math.abs(savingsChange.percentage ?? 0).toFixed(0)}% more than last month.`);
      } else if (savingsChange.delta < 0) {
        insights.push(`You saved ${Math.abs(savingsChange.percentage ?? 0).toFixed(0)}% less than last month.`);
      }
    }

    if (expenseChange.delta !== 0) {
      const formatted = formatCurrency(Math.abs(expenseChange.delta));
      insights.push(expenseChange.delta > 0
        ? `Your expenses increased by ${formatted} this month.`
        : `Your expenses decreased by ${formatted} this month.`);
    }

    if (topExpenseCategory && previousMonth.expenses > 0) {
      insights.push(`${topExpenseCategory.label} is your highest expense category this month.`);
    }

    if (topIncomeCategory) {
      insights.push(`${topIncomeCategory.label} is your largest income source this month.`);
    }

    const nearestDream = [...goals].sort((left, right) => left.remaining_amount - right.remaining_amount)[0] ?? null;
    if (nearestDream) {
      const avgContribution = nearestDream.monthly_contribution > 0
        ? nearestDream.monthly_contribution
        : nearestDream.months_saved > 0
          ? nearestDream.saved_amount / nearestDream.months_saved
          : 0;
      if (avgContribution > 0 && nearestDream.remaining_amount > 0) {
        const monthsRemaining = Math.ceil(nearestDream.remaining_amount / avgContribution);
        insights.push(`${nearestDream.title} will finish in about ${monthsRemaining} months at the current pace.`);
      }
    }

    const foodTransaction = expenseTransactions.find((transaction) => transaction.category.toLowerCase().includes('food'));
    if (foodTransaction) {
      insights.push(`Food spending is currently anchored by ${formatCurrency(foodTransaction.amount)} in ${foodTransaction.category}.`);
    }

    return {
      totalIncome,
      totalExpenses,
      totalSavings,
      netSavings,
      savingsRate,
      overallGoalProgress,
      goalSavingsRate,
      dreamScore: dashboard?.dream_score ?? monthlyDreamScore,
      financialHealthScore,
      financialHealthStatus,
      healthComponentSavingsRate,
      healthComponentEmergency,
      healthComponentInvestment,
      healthComponentGoals,
      monthlySeries,
      currentMonth,
      previousMonth,
      currentMonthSavings,
      currentMonthSavingsRate,
      currentMonthGoalProgress,
      currentMonthGoalSavings: currentMonth.goalSavings,
      previousMonthSavings,
      previousMonthSavingsRate,
      previousMonthGoalProgress,
      monthlyDreamScore,
      previousDreamScore,
      savingsChange,
      expenseChange,
      incomeChange,
      dreamScoreChange,
      expenseBreakdown,
      dreamProgressSeries,
      monthlyReport,
      insights,
      monthlyExpenseAverage: averageMonthlyExpenses,
      emergencyFundMonths,
      investmentTotal,
      goalSavingsTotal,
      totalTarget,
      topExpenseCategory,
      topIncomeCategory,
    };
  }, [dashboard?.dream_score, goals, transactions]);

  const totalCards = [
    { title: 'Total Income', value: formatCurrency(analytics.totalIncome), detail: 'All income recorded from your ledger.', icon: ArrowUpRight, tone: '#16a34a' },
    { title: 'Total Expenses', value: formatCurrency(analytics.totalExpenses), detail: 'All expense transactions captured so far.', icon: ArrowDownRight, tone: '#dc2626' },
    { title: 'Total Savings', value: formatCurrency(analytics.totalSavings), detail: 'Goal savings plus unallocated savings entries.', icon: PiggyBank, tone: '#10b981' },
    { title: 'Net Savings', value: formatCurrency(analytics.netSavings), detail: 'Income left after expenses, investments, and savings.', icon: Wallet2, tone: '#0f766e' },
    { title: 'Savings Rate', value: `${analytics.savingsRate.toFixed(0)}%`, detail: 'Savings as a share of total income.', icon: TrendingUp, tone: '#0ea5e9' },
    { title: 'Dream Score', value: `${analytics.dreamScore}`, detail: 'Calculated from live financial momentum.', icon: Sparkles, tone: '#7c3aed' },
    { title: 'Financial Health Score', value: `${analytics.financialHealthScore}`, detail: `${analytics.financialHealthStatus} based on savings, emergency fund, investments, and goal progress.`, icon: ShieldCheck, tone: '#f59e0b' },
  ];

  const hasTransactions = transactions.length > 0;
  const hasGoals = goals.length > 0;

  return (
    <div className="page-grid analytics-page">
      <section className="page-panel page-hero">
        <div className="theme-pill">Analytics</div>
        <div>
          <h2>Live analytics from your real financial data.</h2>
          <p>Every chart and metric updates from the transactions and dreams currently stored in your account.</p>
        </div>
      </section>

      <section className="stat-grid analytics-kpi-grid">
        {totalCards.map(({ title, value, detail, icon: Icon, tone }) => (
          <article key={title} className="metric-card analytics-kpi-card">
            <div>
              <p className="metric-label">{title}</p>
              <p className="metric-value">{value}</p>
              <p className="metric-detail">{detail}</p>
            </div>
            <div className="icon-box" style={{ color: tone }}><Icon size={18} /></div>
          </article>
        ))}
      </section>

      <section className="analytics-chart-grid">
        <div className="page-panel chart-panel">
          <div className="panel-actions">
            <div>
              <h3 className="setting-title">Savings Trend</h3>
              <p className="setting-detail">Savings = Income - Expenses grouped by month.</p>
            </div>
          </div>
          {hasTransactions ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.monthlySeries}>
                  <defs>
                    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Math.round(Number(value) / 1000)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Area type="monotone" dataKey="calculatedSavings" stroke="#10b981" fill="url(#savingsGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-inline analytics-empty">Add income and expense transactions to generate a savings trend.</div>
          )}
        </div>

        <div className="page-panel chart-panel">
          <div className="panel-actions">
            <div>
              <h3 className="setting-title">Income vs Expense</h3>
              <p className="setting-detail">Monthly cashflow comparison from live ledger entries.</p>
            </div>
          </div>
          {hasTransactions ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.monthlySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Math.round(Number(value) / 1000)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={3} dot={false} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={3} dot={false} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-inline analytics-empty">Add income and expense transactions to compare monthly cashflow.</div>
          )}
        </div>

        <div className="page-panel chart-panel">
          <div className="panel-actions">
            <div>
              <h3 className="setting-title">Expense Breakdown</h3>
              <p className="setting-detail">Spending by category from actual expense entries.</p>
            </div>
          </div>
          {analytics.expenseBreakdown.length > 0 ? (
            <div className="chart-container chart-container-pie">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                  <Legend />
                  <Pie data={analytics.expenseBreakdown} dataKey="value" nameKey="label" innerRadius={56} outerRadius={92} paddingAngle={3}>
                    {analytics.expenseBreakdown.map((entry, index) => (
                      <Cell key={entry.label} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-inline analytics-empty">Add expense entries to see category spending.</div>
          )}
        </div>

        <div className="page-panel chart-panel">
          <div className="panel-actions">
            <div>
              <h3 className="setting-title">Dream Analytics</h3>
              <p className="setting-detail">Progress, remaining amount, and estimated completion for every dream.</p>
            </div>
          </div>
          {hasGoals ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.dreamProgressSeries} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={120} />
                  <Tooltip formatter={(value) => `${Math.round(Number(value ?? 0))}%`} />
                  <Legend />
                  <Bar dataKey="progress" name="Progress %" fill="#10b981" radius={[0, 12, 12, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-inline analytics-empty">Create your first dream to unlock dream-level analytics.</div>
          )}
        </div>
      </section>

      <section className="analytics-dual-grid">
        <div className="page-panel">
          <div className="panel-actions">
            <div>
              <h3 className="setting-title">Financial Health</h3>
              <p className="setting-detail">Calculated from savings rate, emergency fund coverage, investment ratio, and goal progress.</p>
            </div>
            <div className={`status-chip ${analytics.financialHealthStatus === 'Excellent' ? 'status-chip-good' : analytics.financialHealthStatus === 'Good' ? 'status-chip-warning' : 'status-chip-alert'}`}>
              {analytics.financialHealthStatus}
            </div>
          </div>
          <div className="analytics-ring-grid">
            <ProgressRing
              value={analytics.healthComponentSavingsRate}
              label="Savings Rate"
              detail={`${analytics.savingsRate.toFixed(0)}% of total income is being saved.`}
              tone="#10b981"
            />
            <ProgressRing
              value={analytics.healthComponentEmergency}
              label="Emergency Fund"
              detail={`${analytics.emergencyFundMonths.toFixed(1)} months of expenses covered.`}
              tone="#0ea5e9"
            />
            <ProgressRing
              value={analytics.healthComponentGoals}
              label="Goal Progress"
              detail={`${analytics.overallGoalProgress.toFixed(0)}% of your dreams completed.`}
              tone="#f59e0b"
            />
          </div>
          <div className="setting-card analytics-explanation">
            <p className="setting-title">Why this score?</p>
            <p className="setting-detail">
              Savings rate contributes {analytics.healthComponentSavingsRate.toFixed(0)} points, emergency coverage adds {analytics.healthComponentEmergency.toFixed(0)},
              investment ratio adds {analytics.healthComponentInvestment.toFixed(0)}, and goal progress adds {analytics.healthComponentGoals.toFixed(0)}.
            </p>
          </div>
        </div>

        <div className="page-panel">
          <div className="panel-actions">
            <div>
              <h3 className="setting-title">Monthly Report</h3>
              <p className="setting-detail">Auto-generated from this month’s actual activity.</p>
            </div>
          </div>
          <div className="analytics-report-card">
            <div className="report-row">
              <span>This month income</span>
              <strong>{formatCurrency(analytics.monthlyReport.income)}</strong>
            </div>
            <div className="report-row">
              <span>This month expenses</span>
              <strong>{formatCurrency(analytics.monthlyReport.expenses)}</strong>
            </div>
            <div className="report-row">
              <span>This month saved</span>
              <strong>{formatCurrency(analytics.monthlyReport.saved)}</strong>
            </div>
            <div className="report-row">
              <span>Savings rate</span>
              <strong>{analytics.monthlyReport.savingsRate.toFixed(0)}%</strong>
            </div>
            <div className="report-row">
              <span>Dream progress added</span>
              <strong>{analytics.monthlyReport.dreamProgress.toFixed(0)}%</strong>
            </div>
            <div className="report-row">
              <span>Highest expense category</span>
              <strong>{analytics.monthlyReport.highestExpenseCategory ? analytics.monthlyReport.highestExpenseCategory.label : 'No expenses yet'}</strong>
            </div>
            <div className="report-row">
              <span>Largest income source</span>
              <strong>{analytics.monthlyReport.largestIncome ? analytics.monthlyReport.largestIncome.label : 'No income yet'}</strong>
            </div>
          </div>

          <div className="analytics-trend-grid">
            <div className="trend-card">
              <p className="setting-title">Savings Trend</p>
              <p className={`metric-detail ${directionClass(analytics.savingsChange.delta)}`}>
                {analytics.savingsChange.delta >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(analytics.savingsChange.delta))}
                {analytics.savingsChange.percentage === null ? '' : ` (${Math.abs(analytics.savingsChange.percentage).toFixed(0)}%)`}
              </p>
            </div>
            <div className="trend-card">
              <p className="setting-title">Expenses Trend</p>
              <p className={`metric-detail ${directionClass(analytics.expenseChange.delta)}`}>
                {analytics.expenseChange.delta >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(analytics.expenseChange.delta))}
                {analytics.expenseChange.percentage === null ? '' : ` (${Math.abs(analytics.expenseChange.percentage).toFixed(0)}%)`}
              </p>
            </div>
            <div className="trend-card">
              <p className="setting-title">Income Trend</p>
              <p className={`metric-detail ${directionClass(analytics.incomeChange.delta)}`}>
                {analytics.incomeChange.delta >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(analytics.incomeChange.delta))}
                {analytics.incomeChange.percentage === null ? '' : ` (${Math.abs(analytics.incomeChange.percentage).toFixed(0)}%)`}
              </p>
            </div>
            <div className="trend-card">
              <p className="setting-title">Dream Score Trend</p>
              <p className={`metric-detail ${directionClass(analytics.dreamScoreChange.delta)}`}>
                {analytics.dreamScoreChange.delta >= 0 ? '▲' : '▼'} {Math.abs(analytics.dreamScoreChange.delta)}
                {analytics.dreamScoreChange.percentage === null ? '' : ` (${Math.abs(analytics.dreamScoreChange.percentage).toFixed(0)}%)`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-panel">
        <div className="panel-actions">
          <div>
            <h3 className="setting-title">Dream Analytics Cards</h3>
            <p className="setting-detail">A live breakdown for every dream in your account.</p>
          </div>
        </div>
        {hasGoals ? (
          <div className="analytics-dream-grid">
            {goals.map((goal) => {
              const averageMonthlyContribution = goal.monthly_contribution > 0
                ? goal.monthly_contribution
                : goal.months_saved > 0
                  ? goal.saved_amount / goal.months_saved
                  : 0;
              const estimatedMonthsRemaining = averageMonthlyContribution > 0 && goal.remaining_amount > 0
                ? Math.ceil(goal.remaining_amount / averageMonthlyContribution)
                : 0;
              const estimatedCompletionDate = goal.deadline
                ? parseDate(goal.deadline)
                : averageMonthlyContribution > 0 && goal.remaining_amount > 0
                  ? addMonths(new Date(), estimatedMonthsRemaining)
                  : null;
              const daysRemaining = estimatedCompletionDate
                ? Math.max(0, Math.ceil((estimatedCompletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : null;

              return (
                <article key={goal.id} className="dream-analytics-card">
                  <div className="panel-actions">
                    <div>
                      <p className="goal-tag">{goal.priority ?? 'Priority goal'}</p>
                      <h4>{goal.title}</h4>
                    </div>
                    <div className="goal-chip"><Sparkles size={16} /></div>
                  </div>
                  <div className="goal-progress-bar">
                    <div className="goal-progress-fill" style={{ width: `${goal.progress}%` }} />
                  </div>
                  <div className="goal-meta-row analytics-dream-meta">
                    <div>
                      <p className="meta-label">Progress</p>
                      <p className="meta-value">{goal.progress.toFixed(0)}%</p>
                    </div>
                    <div>
                      <p className="meta-label">Remaining</p>
                      <p className="meta-value">{formatCurrency(goal.remaining_amount)}</p>
                    </div>
                    <div>
                      <p className="meta-label">Avg monthly contribution</p>
                      <p className="meta-value">{averageMonthlyContribution > 0 ? formatCurrency(averageMonthlyContribution) : 'Not set'}</p>
                    </div>
                    <div>
                      <p className="meta-label">Days remaining</p>
                      <p className="meta-value">{daysRemaining === null ? 'TBD' : `${daysRemaining}`}</p>
                    </div>
                  </div>
                  <div className="setting-card">
                    <p className="setting-title">Estimated completion</p>
                    <p className="setting-detail">{estimatedCompletionDate ? formatDate(estimatedCompletionDate) : 'Set a monthly contribution to estimate completion.'}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-inline analytics-empty">Create a dream to unlock dream analytics cards.</div>
        )}
      </section>

      <section className="page-panel">
        <div className="panel-actions">
          <div>
            <h3 className="setting-title">Insights</h3>
            <p className="setting-detail">Generated only from actual calculations in your account.</p>
          </div>
        </div>
        {analytics.insights.length > 0 ? (
          <div className="analytics-insight-grid">
            {analytics.insights.map((insight) => (
              <article key={insight} className="setting-card">
                <p className="setting-title">Insight</p>
                <p className="setting-detail">{insight}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-inline analytics-empty">Add income, expenses, and savings to generate live insights.</div>
        )}
      </section>
    </div>
  );
};

export default AnalyticsPage;