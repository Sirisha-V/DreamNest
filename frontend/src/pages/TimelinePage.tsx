import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock3, Target, Sparkles } from 'lucide-react';
import DreamTimeline from '../components/DreamTimeline';
import { useDreams } from '../context/DreamContext';

const TimelinePage = () => {
  const navigate = useNavigate();
  const { goalId } = useParams();
  const { goals, loading, error } = useDreams();

  const goal = useMemo(() => goals.find((item) => item.id === Number(goalId)), [goals, goalId]);

  const estimatedMonths = goal ? (goal.monthly_contribution > 0 ? Math.max(0, Math.ceil((goal.target_amount - goal.saved_amount) / goal.monthly_contribution)) : 0) : 0;
  const estimatedCompletion = goal?.deadline ?? (estimatedMonths > 0 ? `${estimatedMonths} months` : 'TBD');

  if (loading) {
    return <div className="page-panel">Loading timeline…</div>;
  }

  if (error) {
    return <div className="page-panel">{error}</div>;
  }

  if (!goal) {
    return (
      <div className="page-grid">
        <section className="page-panel page-hero">
          <div className="theme-pill">Dream Timeline</div>
          <h2>No dream selected</h2>
          <button type="button" className="button button-primary" onClick={() => navigate('/dreams')}>
            <ArrowLeft size={16} /> Back to Dreams
          </button>
        </section>
      </div>
    );
  }

  const milestones = [
    { label: 'Dream Created', completed: true },
    { label: 'First Savings', completed: goal.saved_amount > 0 },
    { label: '25% Progress', completed: goal.progress >= 25 },
    { label: 'Halfway Point', completed: goal.progress >= 50 },
    { label: 'Final Stretch', completed: goal.progress >= 75 },
    { label: 'Dream Completed', completed: goal.progress >= 100 },
  ];

  return (
    <div className="page-grid">
      <section className="page-panel page-hero">
        <div className="theme-pill">Dream Timeline</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2>{goal.title}</h2>
            <p>A visual path from today to completion, with milestones and remaining months.</p>
          </div>
          <button type="button" className="button button-secondary" onClick={() => navigate('/dreams')}>
            <ArrowLeft size={16} /> Back to Dreams
          </button>
        </div>
      </section>

      <section className="stat-grid">
        <div className="metric-card">
          <div>
            <p className="metric-label">Dream Created</p>
            <p className="metric-value">Tracked</p>
            <p className="metric-detail">Your timeline begins from this moment.</p>
          </div>
          <div className="icon-box"><Sparkles size={18} /></div>
        </div>
        <div className="metric-card">
          <div>
            <p className="metric-label">Current Position</p>
            <p className="metric-value">{goal.progress}%</p>
            <p className="metric-detail">You are {goal.progress}% through this goal.</p>
          </div>
          <div className="icon-box"><Target size={18} /></div>
        </div>
        <div className="metric-card">
          <div>
            <p className="metric-label">Expected Completion</p>
            <p className="metric-value">{estimatedCompletion}</p>
            <p className="metric-detail">Based on your current pace.</p>
          </div>
          <div className="icon-box"><CalendarDays size={18} /></div>
        </div>
        <div className="metric-card">
          <div>
            <p className="metric-label">Remaining Months</p>
            <p className="metric-value">{estimatedMonths}</p>
            <p className="metric-detail">Estimated from monthly contribution.</p>
          </div>
          <div className="icon-box"><Clock3 size={18} /></div>
        </div>
      </section>

      <section className="page-panel timeline-page-panel">
        <DreamTimeline
          title={goal.title}
          createdAt="Created in DreamNest"
          deadline={goal.deadline}
          progress={goal.progress}
          milestones={milestones}
          monthsSaved={goal.months_saved || 0}
        />
        <div className="timeline-detail-grid">
          {milestones.map((milestone, index) => (
            <div key={milestone.label} className={`timeline-detail-card ${milestone.completed ? 'timeline-detail-card-complete' : ''}`}>
              <p className="setting-title">{index + 1}. {milestone.label}</p>
              <p className="setting-detail">{milestone.completed ? 'Completed' : 'In progress'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default TimelinePage;
