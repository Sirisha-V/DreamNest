import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Wallet, TrendingUp, CalendarDays, Target, HeartHandshake, Edit3, Trash2, Activity, BarChart3 } from 'lucide-react';
import { useDreams } from '../context/DreamContext';
import { type Goal } from '../lib/api';
import AddSavingsModal from '../components/AddSavingsModal';
import Toast from '../components/Toast';

const formatCurrency = (value: number) => `₹${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;

const DashboardPage = () => {
  const navigate = useNavigate();
  const { dashboard, goals, transactions, loading, error, removeDream, updateDream, saveToDream } = useDreams();
  const [toast, setToast] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [savingsOpen, setSavingsOpen] = useState(false);
  const [activeDream, setActiveDream] = useState<Goal | null>(null);

  const handleAction = (label: string, route: string) => {
    setSubmitting(true);
    navigate(route);
    setToast(`${label} opened`);
    setSubmitting(false);
  };

  const openAddSavings = (dream?: Goal) => {
    const selected = dream ?? goals[0] ?? null;
    if (!selected) {
      setToast('Create a dream first to add savings.');
      return;
    }

    setActiveDream(selected);
    setSavingsOpen(true);
  };

  const handleAddSavings = async (amount: number, notes: string) => {
    if (!activeDream) return;
    await saveToDream(activeDream.id, amount, notes);
    setToast(`Added ₹${amount} to ${activeDream.title}`);
    setSavingsOpen(false);
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

  const missionCards = useMemo(() => {
    const activeDream = goals[0];
    const todayTarget = Math.max(500, Math.round((dashboard?.monthly_saving ?? 0) * 0.15));
    const savingsTransactions = transactions.filter((item) => item.kind === 'savings');

    return [
      {
        label: `Save ₹${todayTarget.toLocaleString()} today`,
        detail: activeDream ? `Nudge ${activeDream.title} forward.` : 'Start with your first dream.',
      },
      {
        label: activeDream ? `Review ${activeDream.title}` : 'Review your top dream',
        detail: 'Check your target, savings pace, and remaining gap.',
      },
      {
        label: 'Stay under Food Budget',
        detail: savingsTransactions.length > 0 ? `${savingsTransactions.length} savings moves already logged.` : 'Protect your monthly surplus.',
      },
    ];
  }, [dashboard?.monthly_saving, goals, transactions]);

  const missionProgress = Math.round((completedMissions.length / 3) * 100);

  const achievementCards = useMemo(() => {
    const totalSaved = dashboard?.total_saved ?? 0;
    const topProgress = goals.reduce((highest, goal) => Math.max(highest, goal.progress), 0);
    const savingsStreak = transactions.filter((transaction) => transaction.kind === 'savings').length;

    return [
      { label: 'First Dream', unlocked: goals.length > 0, detail: 'Create your first milestone.' },
      { label: '25% Complete', unlocked: topProgress >= 25, detail: 'Any dream reaches 25%.' },
      { label: '50% Complete', unlocked: topProgress >= 50, detail: 'Halfway to a dream.' },
      { label: '75% Complete', unlocked: topProgress >= 75, detail: 'Goal momentum is strong.' },
      { label: '100% Complete', unlocked: topProgress >= 100, detail: 'A dream has been finished.' },
      { label: 'First ₹1L Saved', unlocked: totalSaved >= 100000, detail: 'Cross the first lakh.' },
      { label: 'Saving Streak', unlocked: savingsStreak >= 3, detail: 'Log three savings moves.' },
    ];
  }, [dashboard?.total_saved, goals, transactions]);

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
          <p className="hero-text">Your dashboard is tracking progress and preparing the next smart move for your financial future.</p>
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
            {goals.length === 0 ? (
              <div className="empty-inline">No dreams yet. Create one to start your next chapter.</div>
            ) : goals.map((dream) => (
              <motion.article
                key={`${dream.id}-${dream.progress}`}
                className="goal-card premium-dream-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="goal-head">
                  <div>
                    <p className="goal-tag">{dream.priority ?? 'Priority goal'}</p>
                    <h4>{dream.title}</h4>
                    <p className="goal-meta">Estimated completion: {dream.deadline ?? 'TBD'}</p>
                  </div>
                  <div className="goal-chip"><Sparkles /></div>
                </div>

                <div className="goal-progress-bar">
                  <motion.div className="goal-progress-fill" initial={{ width: 0 }} animate={{ width: `${dream.progress}%` }} transition={{ duration: 0.4 }} />
                </div>

                <div className="goal-meta-row dashboard-meta-grid">
                  <div>
                    <p className="meta-label">Saved</p>
                    <p className="meta-value">₹{dream.saved_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="meta-label">Target</p>
                    <p className="meta-value">₹{dream.target_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="meta-label">Remaining</p>
                    <p className="meta-value">₹{dream.remaining_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="meta-label">Days left</p>
                    <p className="meta-value">{dream.deadline ? Math.max(0, Math.ceil((new Date(dream.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0}</p>
                  </div>
                </div>

                <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Target size={15} /> Monthly contribution: ₹{dream.monthly_contribution || 0}</div>
                  <div className="flex items-center gap-2"><CalendarDays size={15} /> Estimated completion: {dream.deadline ?? 'TBD'}</div>
                  {dream.is_couple_goal ? <div className="flex items-center gap-2"><HeartHandshake size={15} /> Shared with {dream.partner_name || 'partner'}</div> : null}
                  {dream.plan_summary ? <div className="rounded-xl bg-white p-2">{dream.plan_summary}</div> : null}
                </div>

                <div className="panel-actions flex-wrap gap-3">
                  <button type="button" className="button button-ghost button-icon" onClick={() => openAddSavings(dream)}><Activity size={14} /> Add Savings</button>
                  <button type="button" className="button button-ghost button-icon" onClick={() => handleAction('Timeline', `/timeline/${dream.id}`)}><BarChart3 size={14} /> View Timeline</button>
                  <button type="button" className="button button-ghost button-icon" onClick={() => handleAction('Simulator', `/simulator/${dream.id}`)}><Sparkles size={14} /> Simulate</button>
                  <button type="button" className="button button-ghost button-icon" onClick={async () => {
                    const nextTarget = window.prompt('Update target amount', String(dream.target_amount));
                    if (!nextTarget) return;
                    await updateDream(dream.id, { target_amount: Number(nextTarget) });
                    setToast(`Updated ${dream.title}`);
                  }}><Edit3 size={14} /> Edit</button>
                  <button type="button" className="button button-ghost button-icon" onClick={async () => {
                    if (!window.confirm(`Delete ${dream.title}? This cannot be undone.`)) return;
                    await removeDream(dream.id);
                    setToast(`Deleted ${dream.title}`);
                  }}><Trash2 size={14} /> Delete</button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        <aside className="page-panel">
          <div className="section-header">
            <h3>Quick Insights</h3>
            <button type="button" className="link-button" onClick={() => handleAction('Insights', '/analytics')}>Open analytics</button>
          </div>
          <div className="space-y-3">
            <div className="setting-card">
              <p className="setting-title">Daily focus</p>
              <p className="setting-detail">Keep one savings action moving today and review your closest goal.</p>
            </div>
            <div className="setting-card">
              <p className="setting-title">Couple goals</p>
              <p className="setting-detail">Shared dreams still show up in Couple Corner, just without the AI narration.</p>
            </div>
          </div>
        </aside>
      </section>

      <section className="page-grid">
        <div className="page-panel">
          <div className="panel-actions">
            <div>
              <p className="theme-pill">Today&apos;s Mission</p>
              <h3 className="setting-title">Three things to finish today</h3>
            </div>
            <div className="mission-reward">Reward +5 Dream Score</div>
          </div>
          <div className="mission-progress">
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${missionProgress}%` }} /></div>
            <p className="setting-detail">{completedMissions.length} of 3 missions complete</p>
          </div>
          <div className="mission-list">
            {missionCards.map((mission) => {
              const completed = completedMissions.includes(mission.label);
              return (
                <button
                  type="button"
                  key={mission.label}
                  className={`mission-card ${completed ? 'mission-card-complete' : ''}`}
                  onClick={() => setCompletedMissions((current) => current.includes(mission.label) ? current.filter((item) => item !== mission.label) : [...current, mission.label])}
                >
                  <div>
                    <p className="setting-title">{mission.label}</p>
                    <p className="setting-detail">{mission.detail}</p>
                  </div>
                  <span className="mission-check">{completed ? 'Done' : 'Tap'}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="page-panel">
          <div className="panel-actions">
            <div>
              <p className="theme-pill">Achievements</p>
              <h3 className="setting-title">Unlocked and upcoming badges</h3>
            </div>
          </div>
          <div className="achievement-grid">
            {achievementCards.map((achievement) => (
              <div key={achievement.label} className={`achievement-card ${achievement.unlocked ? 'achievement-card-unlocked' : ''}`}>
                <p className="setting-title">{achievement.label}</p>
                <p className="setting-detail">{achievement.detail}</p>
                <p className="achievement-status">{achievement.unlocked ? 'Unlocked' : 'Locked'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <AddSavingsModal open={savingsOpen} onClose={() => setSavingsOpen(false)} onSave={handleAddSavings} />
      <Toast message={toast} open={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
};

export default DashboardPage;
