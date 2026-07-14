import { motion } from 'framer-motion';

interface DreamTimelineProps {
  title: string;
  createdAt: string;
  deadline: string | null;
  progress: number;
  milestones: Array<{ label: string; completed: boolean }>;
  monthsSaved: number;
  targetAmount?: number;
  savedAmount?: number;
  monthlyContribution?: number;
}

const DreamTimeline = ({
  title,
  createdAt,
  deadline,
  progress,
  milestones,
  monthsSaved,
  targetAmount,
  savedAmount,
  monthlyContribution,
}: DreamTimelineProps) => {
  const remainingAmount = Math.max(0, (targetAmount ?? 0) - (savedAmount ?? 0));
  const estimatedMonths = monthlyContribution && monthlyContribution > 0
    ? Math.ceil(remainingAmount / monthlyContribution)
    : null;
  const projectedCompletion = estimatedMonths !== null
    ? new Date(new Date().setMonth(new Date().getMonth() + estimatedMonths)).toISOString().slice(0, 10)
    : deadline;
  return (
    <div className="page-panel timeline-panel">
      <div className="panel-actions">
        <div>
          <p className="theme-pill">Dream timeline</p>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="timeline-steps">
        <div className="timeline-step">
          <span className="timeline-dot" />
          <div>
            <p className="setting-title">Created</p>
            <p className="setting-detail">{createdAt}</p>
          </div>
        </div>
        <div className="timeline-step">
          <span className="timeline-dot" />
          <div>
            <p className="setting-title">Current progress</p>
            <p className="setting-detail">{progress}% complete</p>
          </div>
        </div>
        <div className="timeline-step">
          <span className="timeline-dot" />
          <div>
            <p className="setting-title">Estimated completion</p>
            <p className="setting-detail">{projectedCompletion ?? 'TBD'}</p>
          </div>
        </div>
        <div className="timeline-step">
          <span className="timeline-dot" />
          <div>
            <p className="setting-title">Milestones</p>
            <p className="setting-detail">{milestones.filter((item) => item.completed).length} of {milestones.length} completed</p>
          </div>
        </div>
        <div className="timeline-step">
          <span className="timeline-dot" />
          <div>
            <p className="setting-title">Remaining months</p>
            <p className="setting-detail">{estimatedMonths !== null ? `${estimatedMonths} months` : 'TBD'}</p>
          </div>
        </div>
        <div className="timeline-step">
          <span className="timeline-dot" />
          <div>
            <p className="setting-title">Months saved</p>
            <p className="setting-detail">{monthsSaved} months</p>
          </div>
        </div>
      </div>
      <div className="timeline-graph">
        <motion.div className="timeline-progress" animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
      </div>
    </div>
  );
};

export default DreamTimeline;
