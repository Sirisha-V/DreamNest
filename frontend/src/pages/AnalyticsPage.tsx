import { useMemo, useState } from 'react';
import { Coins, Sparkles } from 'lucide-react';
import { useDreams } from '../context/DreamContext';

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const getMotivationMessage = (progress: number) => {
  if (progress >= 100) {
    return `You did it Nana!!\nI'm so proud of you.\n\nLove,\nSiri Papa ❤️`;
  }
  if (progress >= 75) {
    return 'The finish line is close.';
  }
  if (progress >= 50) {
    return "We're over halfway there ❤️";
  }
  if (progress >= 25) {
    return "You're making incredible progress.";
  }
  return 'Every big dream begins\nwith one small step.';
};

const toMonthLabel = (monthsAhead: number) => {
  const target = new Date();
  target.setMonth(target.getMonth() + Math.max(0, monthsAhead));
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(target);
};

const AnalyticsPage = () => {
  const {
    goals,
    dashboard,
    savingsHistory,
    dreamCoins,
    coinsEarnedToday,
    currentStreak,
    dreamJarLevel,
    dreamJarProgress,
    coinEvents,
    missionHistory,
    dreamCreateEvents,
    getBadgeUnlocked,
  } = useDreams();

  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);

  const analytics = useMemo(() => {
    const totalSaved = dashboard.total_saved;
    const totalTarget = dashboard.total_target;
    const totalDreams = goals.length;
    const remainingAmount = Math.max(0, totalTarget - totalSaved);
    const overallCompletion = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

    const dreamCards = goals.map((goal, index) => {
      const suggestedWeekly = Math.max(200, Math.ceil((goal.remaining_amount / 12) / 100) * 100);
      const currentMonthly = Math.max(goal.monthly_contribution || 0, suggestedWeekly * 4);
      const baselineMonths = currentMonthly > 0 ? Math.ceil(goal.remaining_amount / currentMonthly) : 0;
      const acceleratedMonths = suggestedWeekly > 0 ? Math.ceil(goal.remaining_amount / (suggestedWeekly * 4.33)) : baselineMonths;
      const earlierByMonths = Math.max(0, baselineMonths - acceleratedMonths);

      return {
        id: goal.id,
        emoji: ['🇯🇵', '✈️', '🏡', '🚗', '💍', '🌍'][index % 6],
        name: goal.title,
        progress: goal.progress,
        saved: goal.saved_amount,
        target: goal.target_amount,
        remaining: goal.remaining_amount,
        completionDate: goal.deadline ?? toMonthLabel(acceleratedMonths),
        suggestedWeekly,
        earlierByMonths,
      };
    });

    const totalRemaining = goals.reduce((sum, goal) => sum + goal.remaining_amount, 0);
    const forecastSlowMonths = Math.ceil(totalRemaining / (500 * 4.33 || 1));
    const forecastFastMonths = Math.ceil(totalRemaining / (800 * 4.33 || 1));

    const badges = [
      { id: 'first-dream', icon: '✅', title: 'First Dream', detail: 'Created your first dream.' },
      { id: 'first-100', icon: '✅', title: 'First ₹100 Saved', detail: 'You crossed your first ₹100.' },
      { id: 'first-1000', icon: '✅', title: 'First ₹1000 Saved', detail: 'Strong start with four digits saved.' },
      { id: 'streak-7', icon: '🔥', title: '7-Day Saving Streak', detail: 'Completed missions for seven straight days.' },
      { id: 'quarter', icon: '🏆', title: '25% Dream Completed', detail: 'One dream reached 25% progress.' },
      { id: 'fifty-transactions', icon: '⭐', title: '50 Transactions', detail: 'Fifty money moves logged.' },
      { id: 'dream-complete', icon: '🎉', title: 'Dream Completed', detail: 'A dream reached 100%.' },
    ].map((badge) => ({
      ...badge,
      unlocked: getBadgeUnlocked(badge.id),
    }));

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    const weekStartIso = weekStart.toISOString().slice(0, 10);

    const moneySavedThisWeek = savingsHistory
      .filter((entry) => entry.date >= weekStartIso)
      .reduce((sum, entry) => sum + entry.amount, 0);

    const dreamsCreatedThisWeek = dreamCreateEvents.filter((date) => date >= weekStartIso).length;
    const dreamCoinsEarnedWeek = coinEvents.filter((event) => event.date >= weekStartIso).reduce((sum, event) => sum + event.coins, 0);

    const completedMissionsWeek = Object.entries(missionHistory)
      .filter(([date, mission]) => date >= weekStartIso && mission.completedIds.length > 0)
      .reduce((sum, [, mission]) => sum + mission.completedIds.length, 0);

    const biggestAchievement = badges.find((badge) => badge.unlocked)?.title ?? 'Next unlock incoming';

    return {
      totalSaved,
      totalTarget,
      totalDreams,
      remainingAmount,
      overallCompletion,
      dreamCards,
      forecastSlow: toMonthLabel(forecastSlowMonths),
      forecastFast: toMonthLabel(forecastFastMonths),
      finishEarlier: Math.max(0, forecastSlowMonths - forecastFastMonths),
      badges,
      motivation: getMotivationMessage(overallCompletion),
      weekly: {
        dreamsCreated: dreamsCreatedThisWeek,
        moneySaved: moneySavedThisWeek,
        dreamCoinsEarned: dreamCoinsEarnedWeek,
        streak: currentStreak,
        missions: completedMissionsWeek,
        biggestAchievement,
      },
    };
  }, [coinEvents, currentStreak, dashboard.total_saved, dashboard.total_target, dreamCreateEvents, getBadgeUnlocked, goals, missionHistory, savingsHistory]);

  const selectedBadge = analytics.badges.find((badge) => badge.id === selectedBadgeId) ?? null;

  return (
    <div className="page-grid analytics-story app-standard-page">
      <section className="page-panel coach-hero">
        <div className="coach-message">
          <p className="theme-pill">Hi Nana ❤️</p>
          <h2>Every rupee you save today<br />brings us one step closer<br />to the life we dream about.</h2>
          <p className="coach-signature">- Love,<br />Siri Papa</p>
        </div>
        <div className="coach-ring-wrap" style={{ ['--progress' as string]: `${analytics.overallCompletion}%` }}>
          <div className="coach-ring">
            <div className="coach-ring-inner">
              <strong>{analytics.overallCompletion.toFixed(0)}%</strong>
              <span>Overall Completion</span>
            </div>
          </div>
          <div className="coach-summary-grid">
            <div><p>Total Dreams</p><strong>{analytics.totalDreams}</strong></div>
            <div><p>Total Saved</p><strong>{formatCurrency(analytics.totalSaved)}</strong></div>
            <div><p>Remaining Amount</p><strong>{formatCurrency(analytics.remainingAmount)}</strong></div>
            <div><p>Overall Progress</p><strong>{analytics.overallCompletion.toFixed(0)}%</strong></div>
          </div>
        </div>
      </section>

      <section className="page-panel">
        <div className="panel-actions">
          <div>
            <p className="theme-pill">Dream Analytics</p>
            <h3 className="setting-title">Progress cards for every dream</h3>
          </div>
        </div>
        <div className="coach-dream-grid">
          {analytics.dreamCards.length === 0 ? (
            <div className="empty-inline">Create your first dream to unlock personalized coaching cards.</div>
          ) : analytics.dreamCards.map((dream) => (
            <article key={dream.id} className="coach-dream-card">
              <div className="coach-dream-head">
                <h4>{dream.emoji} {dream.name}</h4>
                <span>{dream.progress.toFixed(0)}%</span>
              </div>
              <div className="goal-progress-bar">
                <div className="goal-progress-fill coach-animated-progress" style={{ width: `${dream.progress}%` }} />
              </div>
              <p className="setting-detail">{formatCurrency(dream.saved)} / {formatCurrency(dream.target)}</p>
              <p className="setting-detail">Need {formatCurrency(dream.remaining)} more</p>
              <p className="setting-detail">Estimated Completion: {dream.completionDate}</p>
              <p className="setting-title">Save {formatCurrency(dream.suggestedWeekly)}/week to finish {dream.earlierByMonths} months earlier.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="page-panel coach-forecast">
        <div>
          <p className="theme-pill">Dream Forecast</p>
          <h3 className="setting-title">Predict completion with your pace</h3>
        </div>
        <div className="coach-forecast-grid">
          <article className="setting-card">
            <p className="setting-title">If you continue saving ₹500/week</p>
            <p className="metric-value">Expected Completion: {analytics.forecastSlow}</p>
          </article>
          <article className="setting-card">
            <p className="setting-title">If you increase to ₹800/week</p>
            <p className="metric-value">Expected Completion: {analytics.forecastFast}</p>
            <p className="setting-detail">Finish {analytics.finishEarlier} months earlier</p>
          </article>
        </div>
      </section>

      <section className="page-panel">
        <div className="panel-actions">
          <div>
            <p className="theme-pill">Achievements</p>
            <h3 className="setting-title">Unlockable badge collection</h3>
          </div>
        </div>
        <div className="coach-badge-grid">
          {analytics.badges.map((badge) => (
            <button
              key={badge.id}
              type="button"
              className={`coach-badge ${badge.unlocked ? 'coach-badge-unlocked' : 'coach-badge-locked'}`}
              onClick={() => setSelectedBadgeId(badge.id)}
            >
              <span className="coach-badge-icon">{badge.icon}</span>
              <strong>{badge.title}</strong>
              <p>{badge.unlocked ? 'Unlocked' : 'Locked'}</p>
            </button>
          ))}
        </div>
        {selectedBadge ? (
          <div className="coach-badge-detail">
            <p className="setting-title">{selectedBadge.icon} {selectedBadge.title}</p>
            <p className="setting-detail">{selectedBadge.detail}</p>
          </div>
        ) : null}
      </section>

      <section className="page-panel coach-jar-section">
        <div className="panel-actions">
          <div>
            <p className="theme-pill">🏺 Dream Jar</p>
            <h3 className="setting-title">Your motivational economy</h3>
          </div>
          <div className="coach-coin-pill"><Coins size={16} /> {dreamCoins} Dream Coins</div>
        </div>
        <div className="coach-jar-grid">
          <div className="coach-jar-shell" style={{ ['--jar-progress' as string]: `${dreamJarProgress}%` }}>
            <div className="coach-jar-fill" />
            <div className="coach-jar-gloss" />
          </div>
          <div className="coach-jar-stats">
            <p><strong>Coins earned today:</strong> {coinsEarnedToday}</p>
            <p><strong>Current level:</strong> {dreamJarLevel}</p>
            <p><strong>Progress to next level:</strong> {dreamJarProgress.toFixed(0)}%</p>
            <p><strong>Current streak:</strong> 🔥 {currentStreak} days</p>
          </div>
        </div>
      </section>

      <section className="page-panel coach-motivation">
        <div className="panel-actions">
          <Sparkles size={18} />
          <h3 className="setting-title">AI Motivation</h3>
        </div>
        <p className="coach-motivation-copy">{analytics.motivation}</p>
      </section>

      <section className="page-panel">
        <div className="panel-actions">
          <div>
            <p className="theme-pill">Weekly Summary</p>
            <h3 className="setting-title">Your momentum this week</h3>
          </div>
        </div>
        <div className="coach-week-grid">
          <article className="setting-card"><p>Dreams Created</p><strong>{analytics.weekly.dreamsCreated}</strong></article>
          <article className="setting-card"><p>Money Saved This Week</p><strong>{formatCurrency(analytics.weekly.moneySaved)}</strong></article>
          <article className="setting-card"><p>Dream Coins Earned</p><strong>{analytics.weekly.dreamCoinsEarned}</strong></article>
          <article className="setting-card"><p>Current Streak</p><strong>🔥 {analytics.weekly.streak}</strong></article>
          <article className="setting-card"><p>Completed Missions</p><strong>{analytics.weekly.missions}</strong></article>
          <article className="setting-card"><p>Biggest Achievement</p><strong>{analytics.weekly.biggestAchievement}</strong></article>
        </div>
      </section>

      <section className="page-panel coach-footer-note">
        <p>
          🎉 Dream Achieved! 🎉<br />
          Nana ❤️<br />
          Another dream checked off.<br />
          This is exactly why I built DreamNest.<br />
          One dream closer...<br />
          to the life we'll build together.<br />
          ❤️<br />
          Love,<br />
          Siri Papa
        </p>
      </section>
    </div>
  );
};

export default AnalyticsPage;
