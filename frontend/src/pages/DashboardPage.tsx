import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Wallet, TrendingUp, CalendarDays, Target, HeartHandshake } from 'lucide-react';
import { useDreams } from '../context/DreamContext';
import Toast from '../components/Toast';

const formatCurrency = (value: number) => `₹${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;

const DashboardPage = () => {
  const navigate = useNavigate();
  const { dashboard, goals, loading, error } = useDreams();
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAction = (label: string, route: string) => {
    setSubmitting(true);
    navigate(route);
    setToast(`${label} opened`);
    setSubmitting(false);
  };

  const stats = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      { label: 'Dream Score', value: `${dashboard.dream_score}`, detail: `${dashboard.overall_progress}% progress`, icon: Sparkles, route: '/analytics', actionLabel: 'Open' },
      { label: 'Total Saved', value: formatCurrency(dashboard.total_saved), detail: `${dashboard.active_dreams} active dreams`, icon: Wallet, route: '/transactions', actionLabel: 'Open' },
      { label: 'Monthly Saving', value: formatCurrency(dashboard.monthly_saving), detail: `${dashboard.completed_dreams} completed`, icon: TrendingUp, route: '/monthly-savings', actionLabel: 'Open' },
      { label: 'Target Goal', value: formatCurrency(dashboard.total_target), detail: 'Overall stack', icon: CalendarDays, route: '/dreams', actionLabel: 'Open' },
    ];
  }, [dashboard]);

  if (loading) {
    return <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 text-slate-600 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">Loading your dream dashboard…</div>;
  }

  if (error) {
    return <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">{error}</div>;
  }

  return (
    <div className="dashboard-page">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Good morning, {dashboard?.user ?? 'Dreamer'}</p>
          <h2 className="hero-title">Your dreams are already moving forward.</h2>
          <p className="hero-text">Nesty is watching your progress and preparing the next smart move for your financial future.</p>
        </div>
        <div className="score-card">
          <p className="score-label">Dream Score</p>
          <p className="score-value">{dashboard?.dream_score ?? 0} ⭐</p>
        </div>
      </section>

      <section className="stats-grid">
        {stats.map(({ label, value, detail, icon: Icon, route, actionLabel }) => (
          <div key={label} className="metric-card interactive-card">
            <div>
              <p className="metric-label">{label}</p>
              <p className="metric-value">{value}</p>
              <p className="metric-detail">{detail}</p>
            </div>
            <div className="metric-icon"><Icon /></div>
            <button type="button" className="button button-ghost" onClick={() => handleAction(label, route)} disabled={submitting}>{actionLabel}</button>
          </div>
        ))}
      </section>

      <section className="insight-grid">
        <div className="goals-card interactive-card">
          <div className="section-header">
            <h3>Active Dreams</h3>
            <button type="button" className="link-button" onClick={() => handleAction('Dreams', '/dreams')}>View all</button>
          </div>
          <div className="goal-list">
            {goals.map((dream) => (
              <div key={dream.id} className="goal-card">
                <div className="goal-head">
                  <div>
                    <p className="goal-tag">{dream.priority ?? 'Priority goal'}</p>
                    <h4>{dream.title}</h4>
                    <p className="goal-meta">Saved ₹{dream.saved_amount} of ₹{dream.target_amount}</p>
                  </div>
                  <span className="goal-progress">{dream.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${dream.progress}%` }} />
                </div>
                <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Target size={15} /> Monthly contribution: ₹{dream.monthly_contribution || 0}</div>
                  <div>Months saved: {dream.months_saved || 0}</div>
                  {dream.is_couple_goal ? <div className="flex items-center gap-2"><HeartHandshake size={15} /> Shared with {dream.partner_name || 'partner'}</div> : null}
                  {dream.plan_summary ? <div className="rounded-xl bg-white p-2">{dream.plan_summary}</div> : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="nesty-card interactive-card">
          <div className="nesty-head">
            <div>
              <p className="eyebrow text-white/80">Nesty AI</p>
              <h3>{dashboard?.nesty?.title ?? 'You’re doing great!'}</h3>
            </div>
            <div className="nesty-emoji"><Sparkles /></div>
          </div>
          <p className="nesty-text">{dashboard?.nesty?.message ?? 'Your dreams are moving forward.'}</p>
          <div className="space-y-2 rounded-2xl bg-white/10 p-3 text-sm text-white/90">
            <p>• Personalized savings path based on income and essential expenses</p>
            <p>• Shared savings guidance for couple goals</p>
            <p>• Milestones and savings challenges to stay motivated</p>
          </div>
          <button type="button" className="button button-secondary" onClick={() => handleAction('Insights', '/analytics')}>Explore insights</button>
        </aside>
      </section>
      <Toast message={toast} open={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
};

export default DashboardPage;
