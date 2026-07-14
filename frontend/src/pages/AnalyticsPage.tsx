import { useMemo, useState } from 'react';
import { Coins } from 'lucide-react';
import { useDreams } from '../context/DreamContext';

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const toMonthLabel = (monthsAhead: number) => {
  const target = new Date();
  target.setMonth(target.getMonth() + Math.max(0, monthsAhead));
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(target);
};

const inferMonthlyContribution = (savedAmount: number, monthsSaved: number, explicitMonthlyContribution: number) => {
  const explicit = Number(explicitMonthlyContribution) || 0;
  if (explicit > 0) {
    return explicit;
  }

  const saved = Number(savedAmount) || 0;
  const months = Number(monthsSaved) || 0;
  if (saved > 0 && months > 0) {
    return Math.max(1, saved / months);
  }

  return 0;
};

const toYearMonth = (dateText: string) => {
  const parsed = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
};

const monthlyConsistency = (amounts: number[]) => {
  if (amounts.length === 0) {
    return { avg: 0, stdDev: 0, samples: 0 };
  }

  const avg = amounts.reduce((sum, value) => sum + value, 0) / amounts.length;
  const variance = amounts.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / amounts.length;
  return {
    avg,
    stdDev: Math.sqrt(variance),
    samples: amounts.length,
  };
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

    const savingsByDream = new Map<number, number[]>();
    goals.forEach((goal) => {
      const monthBuckets = new Map<string, number>();
      savingsHistory
        .filter((entry) => entry.dreamId === goal.id)
        .forEach((entry) => {
          const bucket = toYearMonth(entry.date);
          if (!bucket) {
            return;
          }
          monthBuckets.set(bucket, (monthBuckets.get(bucket) ?? 0) + entry.amount);
        });

      savingsByDream.set(goal.id, [...monthBuckets.values()]);
    });

    const dreamCards = goals.map((goal, index) => {
      const currentMonthly = inferMonthlyContribution(goal.saved_amount, goal.months_saved, goal.monthly_contribution);
      const suggestedMonthly = Math.max(
        currentMonthly > 0 ? Math.ceil((currentMonthly * 1.2) / 100) * 100 : 0,
        Math.ceil((goal.remaining_amount / 12) / 100) * 100,
      );
      const suggestedWeekly = Math.max(200, Math.ceil((suggestedMonthly / 4.33) / 100) * 100);

      const baselineMonths = currentMonthly > 0 ? Math.ceil(goal.remaining_amount / currentMonthly) : null;
      const acceleratedMonths = suggestedMonthly > 0 ? Math.ceil(goal.remaining_amount / suggestedMonthly) : null;
      const earlierByMonths = baselineMonths !== null && acceleratedMonths !== null
        ? Math.max(0, baselineMonths - acceleratedMonths)
        : 0;

      return {
        id: goal.id,
        emoji: ['🇯🇵', '✈️', '🏡', '🚗', '💍', '🌍'][index % 6],
        name: goal.title,
        progress: goal.progress,
        saved: goal.saved_amount,
        target: goal.target_amount,
        remaining: goal.remaining_amount,
        completionDate: goal.deadline ?? (baselineMonths !== null ? toMonthLabel(baselineMonths) : 'Add monthly contribution'),
        suggestedWeekly,
        earlierByMonths,
      };
    });

    const totalRemaining = goals.reduce((sum, goal) => sum + goal.remaining_amount, 0);
    const totalCurrentMonthlyContribution = goals.reduce((sum, goal) => (
      sum + inferMonthlyContribution(goal.saved_amount, goal.months_saved, goal.monthly_contribution)
    ), 0);
    const boostedMonthlyContribution = totalCurrentMonthlyContribution > 0
      ? Math.ceil((totalCurrentMonthlyContribution * 1.35) / 100) * 100
      : 0;
    const forecastCurrentMonths = totalCurrentMonthlyContribution > 0
      ? Math.ceil(totalRemaining / totalCurrentMonthlyContribution)
      : null;
    const forecastBoostedMonths = boostedMonthlyContribution > 0
      ? Math.ceil(totalRemaining / boostedMonthlyContribution)
      : null;

    const dreamForecasts = goals.map((goal) => {
      const monthlySeries = savingsByDream.get(goal.id) ?? [];
      const consistency = monthlyConsistency(monthlySeries);
      const plannedMonthly = inferMonthlyContribution(goal.saved_amount, goal.months_saved, goal.monthly_contribution);
      const baseMonthly = plannedMonthly > 0 ? plannedMonthly : consistency.avg;

      if (goal.remaining_amount <= 0) {
        return {
          id: goal.id,
          name: goal.title,
          likelyCompletion: 'Completed',
          earliestCompletion: 'Completed',
          latestCompletion: 'Completed',
          confidence: 'High',
        };
      }

      if (baseMonthly <= 0) {
        return {
          id: goal.id,
          name: goal.title,
          likelyCompletion: 'Add monthly contribution in this dream',
          earliestCompletion: 'N/A',
          latestCompletion: 'N/A',
          confidence: 'Low',
        };
      }

      const lowMonthly = Math.max(1, baseMonthly - consistency.stdDev);
      const highMonthly = Math.max(lowMonthly, baseMonthly + consistency.stdDev);
      const likelyMonths = Math.ceil(goal.remaining_amount / baseMonthly);
      const earliestMonths = Math.ceil(goal.remaining_amount / highMonthly);
      const latestMonths = Math.ceil(goal.remaining_amount / lowMonthly);

      const cv = consistency.avg > 0 ? (consistency.stdDev / consistency.avg) : 1;
      const confidence = consistency.samples >= 4 && cv <= 0.25
        ? 'High'
        : consistency.samples >= 3 && cv <= 0.6
          ? 'Medium'
          : 'Low';

      return {
        id: goal.id,
        name: goal.title,
        likelyCompletion: toMonthLabel(likelyMonths),
        earliestCompletion: toMonthLabel(earliestMonths),
        latestCompletion: toMonthLabel(latestMonths),
        confidence,
      };
    });

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
      forecastCurrent: forecastCurrentMonths !== null ? toMonthLabel(forecastCurrentMonths) : null,
      forecastBoosted: forecastBoostedMonths !== null ? toMonthLabel(forecastBoostedMonths) : null,
      currentContributionPerMonth: totalCurrentMonthlyContribution,
      boostedContributionPerMonth: boostedMonthlyContribution,
      finishEarlier: forecastCurrentMonths !== null && forecastBoostedMonths !== null
        ? Math.max(0, forecastCurrentMonths - forecastBoostedMonths)
        : 0,
      dreamForecasts,
      badges,
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
          {analytics.dreamForecasts.length === 0 ? (
            <article className="setting-card">
              <p className="setting-detail">Create your first dream to generate a forecast.</p>
            </article>
          ) : analytics.dreamForecasts.map((forecast) => (
            <article key={forecast.id} className="setting-card">
              <p className="setting-title">{forecast.name}</p>
              <p className="metric-value">Likely completion: {forecast.likelyCompletion}</p>
              <p className="setting-detail">Range: {forecast.earliestCompletion} to {forecast.latestCompletion}</p>
              <p className="setting-detail">Confidence: {forecast.confidence}</p>
            </article>
          ))}
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
