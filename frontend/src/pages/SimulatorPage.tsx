import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Sparkles, TrendingUp, Clock3, Landmark } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDreams } from '../context/DreamContext';

const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;

const monthsToCompletion = (target: number, saved: number, monthly: number) => {
  const remaining = Math.max(0, target - saved);
  return monthly > 0 ? Math.ceil(remaining / monthly) : 0;
};

const futureValue = (monthlySavings: number, sipAmount: number, months: number, oneTime: number) => {
  const annualRate = 0.1;
  const monthlyRate = annualRate / 12;
  const sipFuture = sipAmount > 0 && months > 0
    ? sipAmount * (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate))
    : 0;
  const savingsFuture = monthlySavings * months;
  return Math.round(oneTime + savingsFuture + sipFuture);
};

const SimulatorPage = () => {
  const navigate = useNavigate();
  const { goalId } = useParams();
  const { goals, loading, error } = useDreams();
  const [monthlySavings, setMonthlySavings] = useState(5000);
  const [oneTimeInvestment, setOneTimeInvestment] = useState(10000);
  const [sipAmount, setSipAmount] = useState(2000);

  const goal = useMemo(() => goals.find((item) => item.id === Number(goalId)), [goals, goalId]);

  const baseMonths = goal ? monthsToCompletion(goal.target_amount, goal.saved_amount, goal.monthly_contribution || 0) : 0;
  const newMonthlyContribution = monthlySavings + sipAmount;
  const newMonths = goal ? monthsToCompletion(goal.target_amount, goal.saved_amount + oneTimeInvestment, newMonthlyContribution) : 0;
  const monthsSaved = Math.max(0, baseMonths - newMonths);
  const completionDate = newMonths > 0 ? new Date(Date.now() + newMonths * 30 * 24 * 60 * 60 * 1000) : null;
  const fv = futureValue(monthlySavings, sipAmount, Math.max(newMonths, 1), oneTimeInvestment);
  const savingsDifference = Math.max(0, (goal?.target_amount ?? 0) - fv);

  if (loading) {
    return <div className="page-panel">Loading simulator…</div>;
  }

  if (error) {
    return <div className="page-panel">{error}</div>;
  }

  if (!goal) {
    return (
      <div className="page-grid">
        <section className="page-panel page-hero">
          <div className="theme-pill">Dream Simulator</div>
          <h2>No dream selected</h2>
          <button type="button" className="button button-primary" onClick={() => navigate('/dreams')}>
            <ArrowLeft size={16} /> Back to Dreams
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="page-grid">
      <section className="page-panel page-hero">
        <div className="theme-pill">Dream Simulator</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2>{goal.title}</h2>
            <p>Adjust your savings inputs and watch the completion date update instantly.</p>
          </div>
          <button type="button" className="button button-secondary" onClick={() => navigate(`/timeline/${goal.id}`)}>
            <Sparkles size={16} /> View Timeline
          </button>
        </div>
      </section>

      <section className="page-panel simulator-panel">
        <div className="simulator-input-grid">
          <label className="form-field">
            <span>Monthly Savings</span>
            <input className="input-field" type="range" min="1000" max="50000" step="500" value={monthlySavings} onChange={(event) => setMonthlySavings(Number(event.target.value))} />
            <strong>{formatCurrency(monthlySavings)}</strong>
          </label>
          <label className="form-field">
            <span>One-time Investment</span>
            <input className="input-field" type="range" min="0" max="200000" step="1000" value={oneTimeInvestment} onChange={(event) => setOneTimeInvestment(Number(event.target.value))} />
            <strong>{formatCurrency(oneTimeInvestment)}</strong>
          </label>
          <label className="form-field">
            <span>SIP Amount</span>
            <input className="input-field" type="range" min="0" max="20000" step="500" value={sipAmount} onChange={(event) => setSipAmount(Number(event.target.value))} />
            <strong>{formatCurrency(sipAmount)}</strong>
          </label>
        </div>

        <div className="simulator-compare-grid">
          <motion.div className="metric-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <p className="metric-label">New Completion Date</p>
              <p className="metric-value">{completionDate ? completionDate.toLocaleDateString() : 'TBD'}</p>
              <p className="metric-detail">Calculated from your updated plan.</p>
            </div>
            <div className="icon-box"><CalendarIcon /></div>
          </motion.div>
          <motion.div className="metric-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <p className="metric-label">Months Saved</p>
              <p className="metric-value">{monthsSaved}</p>
              <p className="metric-detail">Compared to your current plan.</p>
            </div>
            <div className="icon-box"><Clock3 size={18} /></div>
          </motion.div>
          <motion.div className="metric-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <p className="metric-label">Future Value</p>
              <p className="metric-value">{formatCurrency(fv)}</p>
              <p className="metric-detail">Savings plus SIP and investment growth estimate.</p>
            </div>
            <div className="icon-box"><Landmark size={18} /></div>
          </motion.div>
          <motion.div className="metric-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div>
              <p className="metric-label">Savings Difference</p>
              <p className="metric-value">{formatCurrency(savingsDifference)}</p>
              <p className="metric-detail">Gap left to the target after simulation.</p>
            </div>
            <div className="icon-box"><TrendingUp size={18} /></div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

const CalendarIcon = () => <Sparkles size={18} />;

export default SimulatorPage;
