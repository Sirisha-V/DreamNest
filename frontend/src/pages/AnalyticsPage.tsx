import { useMemo } from 'react';
import { TrendingUp, Wallet2, Sparkles, Target, HeartHandshake, ShieldCheck } from 'lucide-react';
import { useDreams } from '../context/DreamContext';

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const AnalyticsPage = () => {
  const { dashboard, goals, transactionSummary } = useDreams();

  const summary = transactionSummary ?? {
    income: 0,
    expenses: 0,
    savings: 0,
    investments: 0,
    transfers: 0,
    net: 0,
    recent_transactions: [],
    breakdown: [],
  };

  const cards = useMemo(() => [
    { title: 'Dream Score', value: `${dashboard?.dream_score ?? 84}`, detail: 'Momentum across your whole nest', icon: Sparkles },
    { title: 'Monthly Savings', value: formatCurrency(dashboard?.monthly_saving ?? summary.savings), detail: 'What is flowing toward goals', icon: Wallet2 },
    { title: 'Goal Pace', value: dashboard?.overall_progress ? `${dashboard.overall_progress.toFixed(0)}%` : 'On track', detail: 'Current completion speed', icon: TrendingUp },
    { title: 'Couple Goals', value: `${goals.filter((goal) => goal.is_couple_goal).length}`, detail: 'Shared dreams in motion', icon: HeartHandshake },
  ], [dashboard, goals, summary.savings]);

  const insightCards = useMemo(() => {
    const total = summary.income + summary.expenses + summary.savings + summary.investments + summary.transfers;
    const topGoal = goals[0];
    return [
      {
        label: 'Nesty sees',
        title: total > 0 ? 'Your money is active, not idle.' : 'Your ledger is ready for the first move.',
        detail: total > 0
          ? `Income, savings, and goal transfers are now being tracked together across ${summary.recent_transactions.length} recent movements.`
          : 'Use the savings hub to start capturing income and expenses so the product can begin guiding your next step.',
      },
      {
        label: 'Fastest win',
        title: topGoal ? topGoal.title : 'Create a goal to unlock guidance.',
        detail: topGoal
          ? `The closest visible goal is ${topGoal.progress.toFixed(0)}% complete with ${formatCurrency(topGoal.remaining_amount)} left.`
          : 'Add a dream to surface the next best action here.',
      },
      {
        label: 'Guardrail',
        title: summary.expenses > summary.income ? 'Spending is outpacing income.' : 'Your flow is healthy.',
        detail: summary.expenses > summary.income
          ? 'Nesty would suggest slowing discretionary spend before increasing goal contributions.'
          : 'You have room to keep transferring toward savings if the next paycheck lands as planned.',
      },
    ];
  }, [goals, summary]);

  const chartRows = useMemo(() => {
    const rows = summary.breakdown.length > 0
      ? summary.breakdown
      : [
          { label: 'Income', value: summary.income },
          { label: 'Expenses', value: summary.expenses },
          { label: 'Savings', value: summary.savings },
          { label: 'Investments', value: summary.investments },
          { label: 'Transfers', value: summary.transfers },
        ];
    const maxValue = Math.max(...rows.map((row) => row.value), 1);
    return rows.map((row) => ({ ...row, width: Math.max(8, Math.round((row.value / maxValue) * 100)) }));
  }, [summary]);

  return (
    <div className="page-grid">
      <section className="page-panel page-hero">
        <div className="theme-pill">Analytics</div>
        <div>
          <h2>See what your money is teaching you.</h2>
          <p>Live signals from your goals, savings ledger, and monthly rhythm.</p>
        </div>
      </section>

      <section className="stat-grid">
        {cards.map(({ title, value, detail, icon: Icon }) => (
          <div key={title} className="metric-card">
            <div>
              <p className="metric-label">{title}</p>
              <p className="metric-value">{value}</p>
              <p className="metric-detail">{detail}</p>
            </div>
            <div className="icon-box"><Icon size={18} /></div>
          </div>
        ))}
      </section>

      <section className="page-grid">
        <div className="page-panel feature-card">
          <div className="panel-actions">
            <div>
              <h3 className="setting-title">Financial health overview</h3>
              <p className="setting-detail">A compact picture of the live ledger, rendered from your current activity.</p>
            </div>
            <div className="status-chip"><ShieldCheck size={16} /> Healthy flow</div>
          </div>
          <div className="mt-6 flex h-56 items-end gap-3 rounded-[24px] border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
            {chartRows.map(({ label, width, value }) => (
              <div key={label} className="flex-1 rounded-t-[16px] bg-gradient-to-t from-emerald-500 to-teal-400" style={{ height: `${width}%` }} title={`${label}: ${formatCurrency(value)}`} />
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-2"><Target size={16} /> Goal pacing</div>
              <p className="mt-2 text-sm text-slate-600">{dashboard?.overall_progress ? `Your nest is ${dashboard.overall_progress.toFixed(0)}% to the finish line.` : 'Add a goal to see exact pacing.'}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-2"><HeartHandshake size={16} /> Couple planning</div>
              <p className="mt-2 text-sm text-slate-600">{goals.some((goal) => goal.is_couple_goal) ? 'Shared goals are active and visible in the couple corner.' : 'Create a couple goal to unlock shared planning.'}</p>
            </div>
          </div>
        </div>
        <div className="page-panel">
          <h3 className="setting-title">Signals to watch</h3>
          <div className="mt-4 space-y-3">
            {insightCards.map((metric) => (
              <div key={metric.label} className="setting-card">
                <p className="setting-label">{metric.label}</p>
                <p className="setting-title">{metric.title}</p>
                <p className="setting-detail">{metric.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;
