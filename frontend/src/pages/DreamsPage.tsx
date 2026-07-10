import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Sparkles, Target, CalendarDays, X, HeartHandshake, BadgeDollarSign, Clock3, Edit3, Trash2, Activity, BarChart3 } from 'lucide-react';
import { type Goal } from '../lib/api';
import { useDreams } from '../context/DreamContext';
import AddSavingsModal from '../components/AddSavingsModal';
import DreamTimeline from '../components/DreamTimeline';
import DreamSimulator from '../components/DreamSimulator';
import Toast from '../components/Toast';

const emptyForm = {
  title: '',
  target_amount: '',
  saved_amount: '',
  monthly_contribution: '',
  months_saved: '',
  monthly_income: '',
  mandatory_expenses: '',
  is_couple_goal: false,
  partner_name: '',
  notes: '',
  deadline: '',
  priority: 'High',
};

const DreamsPage = () => {
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState('');
  const [savingsOpen, setSavingsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [activeDream, setActiveDream] = useState<Goal | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { goals: contextGoals, loading: contextLoading, error: contextError, saveToDream, removeDream, updateDream, addDream } = useDreams();

  useEffect(() => {
    if (!contextLoading) {
      setFormError('');
    }
  }, [contextLoading]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const panel = params.get('panel');
    if (!panel) {
      return;
    }

    if (panel === 'create') {
      setShowForm(true);
      return;
    }

    if (contextGoals.length === 0) {
      setToast('Create a dream first to use this action.');
      return;
    }

    const defaultDream = contextGoals[0];
    setActiveDream(defaultDream);

    if (panel === 'savings') {
      setSavingsOpen(true);
      return;
    }

    if (panel === 'simulator') {
      setSimulatorOpen(true);
      return;
    }

    if (panel === 'timeline') {
      setTimelineOpen(true);
    }
  }, [location.search, contextGoals]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      await addDream({
        title: form.title,
        target_amount: Number(form.target_amount),
        saved_amount: Number(form.saved_amount || 0),
        monthly_contribution: Number(form.monthly_contribution || 0),
        months_saved: Number(form.months_saved || 0),
        monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
        mandatory_expenses: form.mandatory_expenses ? Number(form.mandatory_expenses) : null,
        is_couple_goal: form.is_couple_goal,
        partner_name: form.partner_name || null,
        notes: form.notes || null,
        deadline: form.deadline || null,
        priority: form.priority || null,
      });

      setForm(emptyForm);
      setShowForm(false);
      setToast('Dream created successfully');
      if (form.is_couple_goal) {
        navigate('/couple-corner');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create dream');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSavings = async (amount: number, notes: string) => {
    if (!activeDream) return;
    await saveToDream(activeDream.id, amount, notes);
    setToast(`Added ₹${amount} to ${activeDream.title}`);
    setSavingsOpen(false);
  };

  const openTimeline = (dream: Goal) => {
    setActiveDream(dream);
    setTimelineOpen(true);
  };

  const openSimulator = (dream: Goal) => {
    setActiveDream(dream);
    setSimulatorOpen(true);
  };

  const handleDelete = async (dream: Goal) => {
    if (!window.confirm(`Delete ${dream.title}? This cannot be undone.`)) return;
    await removeDream(dream.id);
    setToast(`Deleted ${dream.title}`);
  };

  const handleEdit = async (dream: Goal) => {
    const nextTarget = window.prompt('Update target amount', String(dream.target_amount));
    if (!nextTarget) return;
    await updateDream(dream.id, { target_amount: Number(nextTarget) });
    setToast(`Updated ${dream.title}`);
  };

  return (
    <div className="dreams-page">
      <div className="section-header">
        <div>
          <p className="eyebrow">Dream Library</p>
          <h2>Your ambitions, beautifully organized.</h2>
        </div>
        <button onClick={() => setShowForm((current) => !current)} className="button button-primary button-icon">
          {showForm ? <X size={16} /> : <Plus size={16} />} {showForm ? 'Close' : 'Create Dream'}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit} className="card card-elevated dream-form">
          <div className="dream-form-grid">
            <label className="dream-field">
              <span className="dream-label">Dream title</span>
              <input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="dream-input" placeholder="Dream Home" />
            </label>
            <label className="dream-field">
              <span className="dream-label">Priority</span>
              <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className="dream-input dream-select">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
            <label className="dream-field">
              <span className="dream-label">Target amount</span>
              <input required type="number" min="1" value={form.target_amount} onChange={(event) => setForm((current) => ({ ...current, target_amount: event.target.value }))} className="dream-input" placeholder="500000" />
            </label>
            <label className="dream-field">
              <span className="dream-label">Saved so far</span>
              <input type="number" min="0" value={form.saved_amount} onChange={(event) => setForm((current) => ({ ...current, saved_amount: event.target.value }))} className="dream-input" placeholder="0" />
            </label>
            <label className="dream-field">
              <span className="dream-label">Monthly contribution</span>
              <input type="number" min="0" value={form.monthly_contribution} onChange={(event) => setForm((current) => ({ ...current, monthly_contribution: event.target.value }))} className="dream-input" placeholder="5000" />
            </label>
            <label className="dream-field">
              <span className="dream-label">Months already saved</span>
              <input type="number" min="0" value={form.months_saved} onChange={(event) => setForm((current) => ({ ...current, months_saved: event.target.value }))} className="dream-input" placeholder="3" />
            </label>
            <label className="dream-field">
              <span className="dream-label">Monthly income</span>
              <input type="number" min="0" value={form.monthly_income} onChange={(event) => setForm((current) => ({ ...current, monthly_income: event.target.value }))} className="dream-input" placeholder="80000" />
            </label>
            <label className="dream-field">
              <span className="dream-label">Mandatory expenses</span>
              <input type="number" min="0" value={form.mandatory_expenses} onChange={(event) => setForm((current) => ({ ...current, mandatory_expenses: event.target.value }))} className="dream-input" placeholder="35000" />
            </label>
            <div className="dream-highlight" style={{ gridColumn: '1 / -1' }}>
              <div className="dream-highlight-header">
                <span className="dream-label"><HeartHandshake size={16} /> Couple corner</span>
              </div>
              <div className="dream-highlight-body">
                <label className="dream-checkbox-row">
                  <input type="checkbox" checked={form.is_couple_goal} onChange={(event) => setForm((current) => ({ ...current, is_couple_goal: event.target.checked }))} />
                  This is a shared goal with my partner
                </label>
                {form.is_couple_goal ? (
                  <input value={form.partner_name} onChange={(event) => setForm((current) => ({ ...current, partner_name: event.target.value }))} className="dream-input" placeholder="Partner name" />
                ) : null}
              </div>
            </div>
            <label className="dream-field dream-field-wide">
              <span className="dream-label">How you plan to save</span>
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="dream-textarea" rows={3} placeholder="Example: save ₹5000 monthly, cut dining, and add bonus money." />
            </label>
            <label className="dream-field dream-field-wide">
              <span className="dream-label">Deadline</span>
              <input type="date" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} className="dream-input" />
            </label>
          </div>
          {formError ? <p className="form-error">{formError}</p> : null}
          <div className="form-actions">
            <button disabled={submitting} className="button button-primary" type="submit">{submitting ? 'Saving...' : 'Save Dream'}</button>
          </div>
        </form>
      ) : null}

      {contextLoading ? (
        <div className="animate-[fadeIn_0.25s_ease-out] rounded-[28px] border border-white/70 bg-white/70 p-6 text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur">Loading your dreams…</div>
      ) : contextError ? (
        <div className="animate-[fadeIn_0.25s_ease-out] rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">{contextError}</div>
      ) : contextGoals.length === 0 ? (
        <div className="empty-state card card-dashed">
          <p>No dreams yet. Create one to start your next chapter.</p>
          <button className="button button-primary" onClick={() => setShowForm(true)}>Create Dream</button>
        </div>
      ) : (
        <div className="goal-grid">
          {contextGoals.map((dream) => (
            <div key={dream.id} className="goal-card interactive-card">
              <div className="goal-head">
                <div>
                  <p className="goal-tag">{dream.priority ?? 'Priority goal'}</p>
                  <h4>{dream.title}</h4>
                </div>
                <span className="goal-chip"><Sparkles /></span>
              </div>
              <div className="goal-progress-bar">
                <div className="goal-progress-fill" style={{ width: `${dream.progress}%` }} />
              </div>
              <div className="goal-meta-row">
                <div>
                  <p className="meta-label">Saved</p>
                  <p className="meta-value">₹{dream.saved_amount}</p>
                </div>
                <div>
                  <p className="meta-label">Target</p>
                  <p className="meta-value">₹{dream.target_amount}</p>
                </div>
              </div>
              <div className="goal-footer">
                <span className="goal-detail"><Target size={15} /> ₹{dream.remaining_amount} remaining</span>
                <span className="goal-detail"><CalendarDays size={15} /> {dream.deadline ?? 'No deadline'}</span>
              </div>
              <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                <div className="flex items-center gap-2"><BadgeDollarSign size={15} /> Monthly contribution: ₹{dream.monthly_contribution || 0}</div>
                <div className="flex items-center gap-2"><Clock3 size={15} /> Months saved: {dream.months_saved || 0}</div>
                {dream.is_couple_goal ? <div className="flex items-center gap-2"><HeartHandshake size={15} /> Shared with {dream.partner_name || 'partner'}</div> : null}
                {dream.plan_summary ? <div className="rounded-xl bg-white p-2 text-slate-600">{dream.plan_summary}</div> : null}
              </div>
              <div className="panel-actions flex-wrap gap-3">
                <button type="button" className="button button-ghost button-icon" onClick={() => { setActiveDream(dream); setSavingsOpen(true); }}><Activity size={14} /> Add Savings</button>
                <button type="button" className="button button-ghost button-icon" onClick={() => handleEdit(dream)}><Edit3 size={14} /> Edit Dream</button>
                <button type="button" className="button button-ghost button-icon" onClick={() => handleDelete(dream)}><Trash2 size={14} /> Delete Dream</button>
                <button type="button" className="button button-ghost button-icon" onClick={() => openTimeline(dream)}><BarChart3 size={14} /> View Timeline</button>
                <button type="button" className="button button-ghost button-icon" onClick={() => openSimulator(dream)}><Sparkles size={14} /> Simulate</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <AddSavingsModal open={savingsOpen} onClose={() => setSavingsOpen(false)} onSave={handleAddSavings} />
      {activeDream ? (
        <>
          {timelineOpen ? (
            <DreamTimeline
              title={activeDream.title}
              createdAt={activeDream.deadline || 'TBD'}
              deadline={activeDream.deadline}
              progress={activeDream.progress}
              milestones={[
                { label: 'Goal launched', completed: true },
                { label: 'First savings', completed: activeDream.saved_amount > 0 },
                { label: 'Halfway there', completed: activeDream.progress >= 50 },
                { label: 'Final stretch', completed: activeDream.progress >= 75 },
              ]}
              monthsSaved={activeDream.months_saved || 0}
            />
          ) : null}
          {simulatorOpen ? (
            <DreamSimulator
              currentMonthly={activeDream.monthly_contribution || 0}
              targetAmount={activeDream.target_amount}
              savedAmount={activeDream.saved_amount}
              onChange={(value) => {
                const updated = { ...activeDream, monthly_contribution: value };
                setActiveDream(updated);
              }}
            />
          ) : null}
        </>
      ) : null}
      <Toast message={toast} open={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
};

export default DreamsPage;
