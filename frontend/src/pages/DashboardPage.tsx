import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, BarChart3, CalendarDays, CheckCircle2, HeartHandshake, Sparkles, Trash2, Wallet } from 'lucide-react';
import { useDreams } from '../context/DreamContext';
import { type Goal } from '../lib/api';
import { getOnboardingName } from '../lib/onboarding';
import AddSavingsModal from '../components/AddSavingsModal';
import Toast from '../components/Toast';

const formatCurrency = (value: number) => `₹${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}K`;

type MissionCard = {
  id: 'save' | 'review' | 'budget';
  title: string;
  detail: string;
  reward: number;
  icon: string;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const welcomeName = getOnboardingName();
  const {
    dashboard,
    goals,
    loading,
    error,
    removeDream,
    saveToDream,
    completeMission,
    dreamCoins,
    coinsEarnedToday,
    currentStreak,
    todayMissionCompletion,
    dailyBonusUnlocked,
    dreamJarLevel,
    dreamJarProgress,
  } = useDreams();

  const [toast, setToast] = useState('');
  const [savingsOpen, setSavingsOpen] = useState(false);
  const [activeDream, setActiveDream] = useState<Goal | null>(null);
  const [completedSet, setCompletedSet] = useState<string[]>([]);
  const [popup, setPopup] = useState<{ open: boolean; text: string; coins: number }>({ open: false, text: '', coins: 0 });

  const missionCards = useMemo<MissionCard[]>(() => {
    const primeDream = goals[0];
    return [
      {
        id: 'save',
        icon: '💰',
        title: 'Save ₹500',
        detail: primeDream ? `Push ${primeDream.title} ahead today.` : 'Add savings to your main dream.',
        reward: 20,
      },
      {
        id: 'review',
        icon: '📖',
        title: 'Review Your Biggest Dream',
        detail: 'Check timeline, pace, and completion date.',
        reward: 10,
      },
      {
        id: 'budget',
        icon: '💡',
        title: 'Stay Under Food Budget',
        detail: 'Protect this week’s surplus.',
        reward: 15,
      },
    ];
  }, [goals]);

  const handleAction = (label: string, route: string) => {
    navigate(route);
    setToast(`${label} opened`);
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

  const handleAddSavings = async (amount: number, date: string, notes: string) => {
    if (!activeDream) return;
    await saveToDream(activeDream.id, amount, notes, date);
    setToast(`Added ₹${amount} to ${activeDream.title}`);
    setSavingsOpen(false);
  };

  const handleMissionComplete = (mission: MissionCard) => {
    if (completedSet.includes(mission.id)) {
      return;
    }

    const result = completeMission(mission.id, mission.reward);
    if (result.awardedCoins === 0 && result.bonusCoins === 0) {
      return;
    }

    setCompletedSet((current) => [...current, mission.id]);

    const totalCoins = result.awardedCoins + result.bonusCoins;
    const popupText = result.bonusCoins > 0
      ? 'Outstanding, Nana! You finished every mission today.'
      : "You're getting closer to our dreams every day.";

    setPopup({
      open: true,
      text: popupText,
      coins: totalCoins,
    });

    window.setTimeout(() => {
      setPopup({ open: false, text: '', coins: 0 });
    }, 5000);
  };

  if (loading) {
    return <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 text-slate-600 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">Loading your dream dashboard…</div>;
  }

  if (error) {
    return <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">{error}</div>;
  }

  return (
    <div className="dashboard-page app-standard-page">
      <section className="hero-card coach-daily-hero">
        <div className="hero-copy">
          <p className="eyebrow">Today's Mission ❤️</p>
          <h2 className="hero-title">{`Welcome Home, ${welcomeName} ❤️`}</h2>
          <p className="hero-text">Today is Day 1 of something amazing.</p>
          <p className="setting-detail">{todayMissionCompletion}/3 missions complete today</p>
        </div>
        <div className="coach-coin-summary">
          <p className="score-label">Dream Coins</p>
          <p className="score-value coin-float">{dreamCoins} 🪙</p>
          <p className="setting-detail">Today +{coinsEarnedToday}</p>
          <p className="setting-detail">🔥 {currentStreak} Day Streak</p>
        </div>
      </section>

      <section className="stats-grid">
        <div className="metric-card interactive-card">
          <div>
            <p className="metric-label">Total Saved</p>
            <p className="metric-value">{formatCurrency(dashboard.total_saved)}</p>
            <p className="metric-detail">{dashboard.active_dreams} active dreams</p>
          </div>
          <div className="metric-icon"><Wallet /></div>
        </div>
        <div className="metric-card interactive-card">
          <div>
            <p className="metric-label">Target Goal</p>
            <p className="metric-value">{formatCurrency(dashboard.total_target)}</p>
            <p className="metric-detail">Overall stack</p>
          </div>
          <div className="metric-icon"><CalendarDays /></div>
        </div>
        <div className="metric-card interactive-card">
          <div>
            <p className="metric-label">Dream Jar Level</p>
            <p className="metric-value">{dreamJarLevel}</p>
            <p className="metric-detail">Progress {dreamJarProgress.toFixed(0)}%</p>
          </div>
          <div className="metric-icon"><Sparkles /></div>
        </div>
      </section>

      <section className="page-grid">
        <div className="page-panel coach-mission-panel">
          <div className="panel-actions">
            <div>
              <p className="theme-pill">Mission Cards</p>
              <h3 className="setting-title">Complete today's three mission goals</h3>
            </div>
            <div className="mission-reward">{todayMissionCompletion} / 3 Complete</div>
          </div>

          <div className="mission-progress">
            <div className="progress-bar"><div className="progress-fill coach-animated-progress" style={{ width: `${(todayMissionCompletion / 3) * 100}%` }} /></div>
            <p className="setting-detail">Daily streak continues when all missions are completed.</p>
          </div>

          <div className="mission-list coach-mission-list">
            {missionCards.map((mission) => {
              const completed = completedSet.includes(mission.id);
              return (
                <button
                  type="button"
                  key={mission.id}
                  className={`mission-card coach-mission-card ${completed ? 'mission-card-complete' : ''}`}
                  onClick={() => handleMissionComplete(mission)}
                >
                  <div>
                    <p className="setting-title">{mission.icon} {mission.title}</p>
                    <p className="setting-detail">{mission.detail}</p>
                    <p className="setting-detail">Reward: +{mission.reward} Dream Coins</p>
                  </div>
                  <span className="mission-check">{completed ? <CheckCircle2 size={16} /> : 'Tap'}</span>
                </button>
              );
            })}
          </div>

          {dailyBonusUnlocked ? (
            <div className="coach-daily-bonus">
              <p className="setting-title">🎁 Daily Bonus +50 Dream Coins</p>
              <p className="setting-detail">Outstanding, Nana! You finished every mission today. I'm so proud of you. Let's keep the streak alive ❤️</p>
              <p className="setting-detail">Love, Siri Papa</p>
            </div>
          ) : null}
        </div>

        <div className="page-panel goals-card interactive-card">
          <div className="section-header">
            <h3>Active Dreams</h3>
            <button type="button" className="link-button" onClick={() => handleAction('Dreams', '/dreams')}>View all</button>
          </div>
          <div className="goal-list">
            {goals.length === 0 ? (
              <div className="empty-inline">No dreams yet. Create one to start your next chapter.</div>
            ) : goals.map((dream) => (
              <article key={dream.id} className="goal-card premium-dream-card">
                <div className="goal-head">
                  <div>
                    <p className="goal-tag">{dream.priority ?? 'Priority goal'}</p>
                    <h4>{dream.title}</h4>
                    <p className="goal-meta">Estimated completion: {dream.deadline ?? 'TBD'}</p>
                  </div>
                  <div className="goal-chip"><Sparkles /></div>
                </div>

                <div className="goal-progress-bar">
                  <div className="goal-progress-fill coach-animated-progress" style={{ width: `${dream.progress}%` }} />
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
                </div>

                <div className="panel-actions flex-wrap gap-3">
                  <button type="button" className="button button-ghost button-icon" onClick={() => openAddSavings(dream)}><Activity size={14} /> Add Savings</button>
                  <button type="button" className="button button-ghost button-icon" onClick={() => handleAction('Timeline', `/timeline/${dream.id}`)}><BarChart3 size={14} /> View Timeline</button>
                  <button type="button" className="button button-ghost button-icon" onClick={async () => {
                    if (!window.confirm(`Delete ${dream.title}? This cannot be undone.`)) return;
                    await removeDream(dream.id);
                    setToast(`Deleted ${dream.title}`);
                  }}><Trash2 size={14} /> Delete</button>
                </div>

                {dream.is_couple_goal ? <p className="setting-detail"><HeartHandshake size={14} /> Shared with {dream.partner_name || 'partner'}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      {popup.open ? (
        <div className="coach-popup-overlay">
          <div className="birthday-confetti coach-confetti">
            {Array.from({ length: 16 }).map((_, index) => <span key={index} className="confetti-piece" />)}
          </div>
          <article className="coach-mission-popup">
            <p className="theme-pill">🎉 Amazing Nana!!</p>
            <h3>Mission Completed!</h3>
            <p className="coin-float">+{popup.coins} Dream Coins 🪙</p>
            <p>{popup.text}</p>
            <p>Love, Siri Papa ❤️</p>
          </article>
        </div>
      ) : null}

      <AddSavingsModal open={savingsOpen} onClose={() => setSavingsOpen(false)} onSave={handleAddSavings} />
      <Toast message={toast} open={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
};

export default DashboardPage;
