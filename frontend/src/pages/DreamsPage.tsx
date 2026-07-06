import { useEffect, useState } from 'react';
import { Plus, Sparkles, Target, CalendarDays, X } from 'lucide-react';
import { createGoal, fetchGoals, type Goal } from '../lib/api';

const emptyForm = {
  title: '',
  target_amount: '',
  saved_amount: '',
  deadline: '',
  priority: 'High',
};

const DreamsPage = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const loadGoals = async () => {
      try {
        const goalsData = await fetchGoals();
        setGoals(goalsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load dreams');
      } finally {
        setLoading(false);
      }
    };

    loadGoals();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const newGoal = await createGoal({
        title: form.title,
        target_amount: Number(form.target_amount),
        saved_amount: Number(form.saved_amount || 0),
        deadline: form.deadline || null,
        priority: form.priority || null,
      });

      setGoals((current) => [newGoal, ...current]);
      setForm(emptyForm);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create dream');
    } finally {
      setSubmitting(false);
    }
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
        <form onSubmit={handleSubmit} className="card card-elevated">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-600">
              <span>Dream title</span>
              <input required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none" placeholder="Dream Home" />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Priority</span>
              <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Target amount</span>
              <input required type="number" min="1" value={form.target_amount} onChange={(event) => setForm((current) => ({ ...current, target_amount: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none" placeholder="500000" />
            </label>
            <label className="space-y-2 text-sm text-slate-600">
              <span>Saved so far</span>
              <input type="number" min="0" value={form.saved_amount} onChange={(event) => setForm((current) => ({ ...current, saved_amount: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none" placeholder="0" />
            </label>
            <label className="space-y-2 text-sm text-slate-600 md:col-span-2">
              <span>Deadline</span>
              <input type="date" value={form.deadline} onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none" />
            </label>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="form-actions">
            <button disabled={submitting} className="button button-primary" type="submit">{submitting ? 'Saving...' : 'Save Dream'}</button>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="animate-[fadeIn_0.25s_ease-out] rounded-[28px] border border-white/70 bg-white/70 p-6 text-slate-600 shadow-[0_18px_50px_rgba(15,23,42,0.05)] backdrop-blur">Loading your dreams…</div>
      ) : error ? (
        <div className="animate-[fadeIn_0.25s_ease-out] rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">{error}</div>
      ) : goals.length === 0 ? (
        <div className="empty-state card card-dashed">
          <p>No dreams yet. Create one to start your next chapter.</p>
        </div>
      ) : (
        <div className="goal-grid">
          {goals.map((dream) => (
            <div key={dream.id} className="goal-card">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DreamsPage;
