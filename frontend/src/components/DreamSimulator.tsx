import { useMemo, useState } from 'react';

interface DreamSimulatorProps {
  currentMonthly: number;
  targetAmount: number;
  savedAmount: number;
  onChange: (monthly: number) => void;
}

const DreamSimulator = ({ currentMonthly, targetAmount, savedAmount, onChange }: DreamSimulatorProps) => {
  const [monthly, setMonthly] = useState(currentMonthly);

  const estimate = useMemo(() => {
    const remaining = Math.max(0, targetAmount - savedAmount);
    const months = monthly > 0 ? Math.ceil(remaining / monthly) : 0;
    const yearly = monthly * 12;
    return { months, yearly };
  }, [currentMonthly, targetAmount, savedAmount, monthly]);

  return (
    <div className="page-panel simulator-panel">
      <div className="panel-actions">
        <div>
          <p className="theme-pill">Dream Simulator</p>
          <h2>See how your savings speed changes your timeline.</h2>
        </div>
      </div>
      <div className="space-y-5">
        <div className="setting-card">
          <p className="setting-title">Monthly savings</p>
          <p className="setting-detail">₹{monthly.toLocaleString()} per month</p>
        </div>
        <input type="range" min="1000" max="50000" step="500" value={monthly} onChange={(event) => { const next = Number(event.target.value); setMonthly(next); onChange(next); }} className="w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="metric-card">
            <p className="metric-label">Estimated completion</p>
            <p className="metric-value">{estimate.months ? `${estimate.months} months` : 'Set a plan'}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Months saved</p>
            <p className="metric-value">{Math.min(estimate.months, 12)}</p>
          </div>
          <div className="metric-card">
            <p className="metric-label">Yearly savings</p>
            <p className="metric-value">₹{estimate.yearly.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DreamSimulator;
