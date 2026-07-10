import { useState } from 'react';
import Modal from './Modal';

interface AddSavingsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (amount: number, date: string, notes: string) => Promise<void>;
}

const AddSavingsModal = ({ open, onClose, onSave }: AddSavingsModalProps) => {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const value = Number(amount);
    if (!value || value <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      await onSave(value, date || new Date().toISOString().slice(0, 10), notes);
      setAmount('');
      setDate('');
      setNotes('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} title="Add Savings" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="space-y-2 text-sm text-slate-600">
          <span>Amount</span>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" className="input-field" placeholder="₹10,000" />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span>Date</span>
          <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className="input-field" />
        </label>
        <label className="space-y-2 text-sm text-slate-600">
          <span>Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" rows={3} placeholder="Add context" />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" className="button button-primary w-full" disabled={saving}>{saving ? 'Adding…' : 'Add Savings'}</button>
      </form>
    </Modal>
  );
};

export default AddSavingsModal;
