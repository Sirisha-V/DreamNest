import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Wallet, TrendingUp, CalendarDays } from 'lucide-react';
import { fetchDashboard, fetchGoals, type DashboardResponse, type Goal } from '../lib/api';

const formatCurrency = (value: number) => `₹${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;

const DashboardPage = () => {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboardData, goalsData] = await Promise.all([fetchDashboard(), fetchGoals()]);
        setDashboard(dashboardData);
        setGoals(goalsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const stats = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    return [
      { label: 'Dream Score', value: `${dashboard.dream_score}`, detail: `${dashboard.overall_progress}% progress`, icon: Sparkles },
      { label: 'Total Saved', value: formatCurrency(dashboard.total_saved), detail: `${dashboard.active_dreams} active dreams`, icon: Wallet },
      { label: 'Monthly Saving', value: formatCurrency(dashboard.monthly_saving), detail: `${dashboard.completed_dreams} completed`, icon: TrendingUp },
      { label: 'Target Goal', value: formatCurrency(dashboard.total_target), detail: 'Overall stack', icon: CalendarDays },
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
        {stats.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="metric-card">
            <div>
              <p className="metric-label">{label}</p>
              <p className="metric-value">{value}</p>
              <p className="metric-detail">{detail}</p>
            </div>
            <div className="metric-icon"><Icon /></div>
          </div>
        ))}
      </section>

      <section className="insight-grid">
        <div className="goals-card">
          <div className="section-header">
            <h3>Active Dreams</h3>
            <button className="link-button">View all</button>
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
              </div>
            ))}
          </div>
        </div>

        <aside className="nesty-card">
          <div className="nesty-head">
            <div>
              <p className="eyebrow text-white/80">Nesty AI</p>
              <h3>{dashboard?.nesty?.title ?? 'You’re doing great!'}</h3>
            </div>
            <div className="nesty-emoji"><Sparkles /></div>
          </div>
          <p className="nesty-text">{dashboard?.nesty?.message ?? 'Your dreams are moving forward.'}</p>
          <button className="button button-secondary">Explore insights</button>
        </aside>
      </section>
    </div>
  );
};

export default DashboardPage;
