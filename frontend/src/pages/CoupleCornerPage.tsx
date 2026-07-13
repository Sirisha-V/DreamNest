import { useEffect, useMemo } from 'react';
import { HeartHandshake, Sparkles, BadgeDollarSign, Clock3 } from 'lucide-react';
import { useDreams } from '../context/DreamContext';

const CoupleCornerPage = () => {
  const { goals, loading, error, refresh } = useDreams();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const coupleGoals = useMemo(
    () => goals.filter((goal) => goal.is_couple_goal),
    [goals],
  );

  return (
    <div className="page-grid app-standard-page">
      <section className="page-panel couple-hero-panel">
        <div className="page-hero">
          <p className="eyebrow">Couple Corner</p>
          <h2>Shared dreams should show up here automatically.</h2>
          <p>Any dream marked as a couple goal is pulled from your saved dreams and listed below for both partners to track together.</p>
        </div>

        <div className="couple-stats">
          <div className="metric-card">
            <div>
              <p className="metric-label">Shared dreams</p>
              <p className="metric-value">{coupleGoals.length}</p>
              <p className="metric-detail">Goals marked as couple dreams.</p>
            </div>
            <div className="icon-box"><HeartHandshake /></div>
          </div>
          <div className="metric-card">
            <div>
              <p className="metric-label">Combined target</p>
              <p className="metric-value">₹{coupleGoals.reduce((total, goal) => total + goal.target_amount, 0).toLocaleString()}</p>
              <p className="metric-detail">Total target across all shared goals.</p>
            </div>
            <div className="icon-box"><Sparkles /></div>
          </div>
        </div>
      </section>

      {loading ? (
        <section className="page-panel">Loading shared dreams…</section>
      ) : error ? (
        <section className="page-panel">{error}</section>
      ) : coupleGoals.length === 0 ? (
        <section className="page-panel">
          <h3>No couple dreams yet</h3>
          <p>Create a new dream and tick the couple dream box to see it appear here.</p>
        </section>
      ) : (
        <section className="couple-goal-grid">
          {coupleGoals.map((goal) => (
            <article key={goal.id} className="page-panel couple-goal-card">
              <div className="goal-head">
                <div>
                  <p className="goal-tag">Shared goal</p>
                  <h3>{goal.title}</h3>
                  <p className="goal-meta">{goal.partner_name ? `With ${goal.partner_name}` : 'Partner not added yet'}</p>
                </div>
                <div className="icon-box"><HeartHandshake /></div>
              </div>

              <div className="goal-progress-bar">
                <div className="goal-progress-fill" style={{ width: `${goal.progress}%` }} />
              </div>

              <div className="couple-goal-details">
                <div className="couple-goal-detail">
                  <BadgeDollarSign size={16} />
                  <span>Target: ₹{goal.target_amount.toLocaleString()}</span>
                </div>
                <div className="couple-goal-detail">
                  <BadgeDollarSign size={16} />
                  <span>Saved: ₹{goal.saved_amount.toLocaleString()}</span>
                </div>
                <div className="couple-goal-detail">
                  <Clock3 size={16} />
                  <span>Months saved: {goal.months_saved || 0}</span>
                </div>
              </div>

              {goal.plan_summary ? <p className="couple-plan-summary">{goal.plan_summary}</p> : null}
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default CoupleCornerPage;
