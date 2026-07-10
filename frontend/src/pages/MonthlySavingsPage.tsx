import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, PiggyBank, PlusCircle, Landmark, History, TrendingUp } from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useDreams } from '../context/DreamContext';
import type { Transaction } from '../lib/api';

const formatCurrency = (value: number) => `₹${value.toLocaleString()}`;

const txLabel = (kind: Transaction['kind']) => {
  switch (kind) {
    case 'income':
      return 'Income';
    case 'expense':
      return 'Expense';
    case 'investment':
      return 'Investment';
    case 'transfer':
      return 'Transfer';
    default:
      return 'Savings';
  }
};

const MonthlySavingsPage = () => {
  const { goals, transactions, transactionSummary, loading, error, addIncome, addExpense, transferToSavings } = useDreams();
  const [toast, setToast] = useState('');
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Salary');
  const [note, setNote] = useState('');
  const [goalId, setGoalId] = useState<number | ''>('');
  const [saving, setSaving] = useState(false);

  const recentTransactions = useMemo(() => transactionSummary?.recent_transactions ?? transactions.slice(0, 8), [transactionSummary, transactions]);

  const grouped = useMemo(() => {
    const groups: Record<Transaction['kind'], Transaction[]> = {
      income: [],
      expense: [],
      savings: [],
      investment: [],
      transfer: [],
    };
    transactions.forEach((transaction) => {
      groups[transaction.kind].push(transaction);
    });
    return groups;
  }, [transactions]);

  useEffect(() => {
    if (!incomeOpen && !expenseOpen && !transferOpen) {
      setAmount('');
      setCategory('Salary');
      setNote('');
      setGoalId('');
    }
  }, [incomeOpen, expenseOpen, transferOpen]);

  const summary = transactionSummary ?? {
    income: 0,
    expenses: 0,
    savings: 0,
    investments: 0,
    transfers: 0,
    net: 0,
    recent_transactions: [],
    breakdown: [],
  };

  const handleSubmit = async (kind: 'income' | 'expense' | 'savings') => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setToast('Enter a valid amount.');
      return;
    }

    setSaving(true);
    try {
      if (kind === 'income') {
        await addIncome(value, category || 'Income', note || undefined);
        setToast('Income added successfully');
        setIncomeOpen(false);
      } else if (kind === 'expense') {
        await addExpense(value, category || 'Expense', note || undefined);
        setToast('Expense added successfully');
        setExpenseOpen(false);
      } else {
        await transferToSavings(value, goalId === '' ? null : Number(goalId), note || undefined);
        setToast('Savings transferred successfully');
        setTransferOpen(false);
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Unable to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSavings = () => {
    setGoalId('');
    setTransferOpen(true);
  };

  if (loading) {
    return <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 text-slate-600 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">Loading your savings hub…</div>;
  }

  if (error) {
    return <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">{error}</div>;
  }

  return (
    <div className="page-grid">
      <section className="page-panel page-hero">
        <div className="theme-pill">Savings Hub</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2>Your ledger, savings, and spending in one place.</h2>
            <p>Track income, expenses, savings, and investments. Every update syncs back to your dashboard immediately.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="button button-primary" onClick={() => setIncomeOpen(true)}><PlusCircle size={16} /> Add Income</button>
            <button type="button" className="button button-secondary" onClick={() => setExpenseOpen(true)}><ArrowDownRight size={16} /> Add Expense</button>
            <button type="button" className="button button-primary" onClick={handleAddSavings}><PiggyBank size={16} /> Add Savings</button>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <div className="metric-card">
          <div>
            <p className="metric-label">Income</p>
            <p className="metric-value">{formatCurrency(summary.income)}</p>
            <p className="metric-detail">Money in this cycle.</p>
          </div>
          <div className="icon-box"><ArrowUpRight size={18} /></div>
        </div>
        <div className="metric-card">
          <div>
            <p className="metric-label">Expenses</p>
            <p className="metric-value">{formatCurrency(summary.expenses)}</p>
            <p className="metric-detail">Money out this cycle.</p>
          </div>
          <div className="icon-box"><ArrowDownRight size={18} /></div>
        </div>
        <div className="metric-card">
          <div>
            <p className="metric-label">Savings</p>
            <p className="metric-value">{formatCurrency(summary.savings)}</p>
            <p className="metric-detail">Amount moved into savings.</p>
          </div>
          <div className="icon-box"><PiggyBank size={18} /></div>
        </div>
        <div className="metric-card">
          <div>
            <p className="metric-label">Net</p>
            <p className="metric-value">{formatCurrency(summary.net)}</p>
            <p className="metric-detail">Income minus outflow.</p>
          </div>
          <div className="icon-box"><TrendingUp size={18} /></div>
        </div>
      </section>

      <section className="page-grid savings-ledger-grid">
        <div className="page-panel">
          <div className="panel-actions">
            <div>
              <h3 className="setting-title">Income</h3>
              <p className="setting-detail">Salary, bonuses, side income.</p>
            </div>
            <button type="button" className="link-button" onClick={() => setIncomeOpen(true)}>Add Income</button>
          </div>
          <div className="space-y-3">
            {grouped.income.length === 0 ? <div className="empty-inline">No income recorded yet.</div> : grouped.income.map((transaction) => (
              <div key={transaction.id} className="transaction-card">
                <div className="transaction-left">
                  <div className="transaction-icon income-icon"><ArrowUpRight size={16} /></div>
                  <div>
                    <p className="transaction-title">{transaction.category}</p>
                    <p className="transaction-meta">{transaction.occurred_on} • {transaction.note ?? 'Income entry'}</p>
                  </div>
                </div>
                <p className="transaction-amount text-emerald-600">+₹{transaction.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="page-panel">
          <div className="panel-actions">
            <div>
              <h3 className="setting-title">Expenses</h3>
              <p className="setting-detail">Needs, food, bills, and lifestyle spend.</p>
            </div>
            <button type="button" className="link-button" onClick={() => setExpenseOpen(true)}>Add Expense</button>
          </div>
          <div className="space-y-3">
            {grouped.expense.length === 0 ? <div className="empty-inline">No expenses recorded yet.</div> : grouped.expense.map((transaction) => (
              <div key={transaction.id} className="transaction-card">
                <div className="transaction-left">
                  <div className="transaction-icon expense-icon"><ArrowDownRight size={16} /></div>
                  <div>
                    <p className="transaction-title">{transaction.category}</p>
                    <p className="transaction-meta">{transaction.occurred_on} • {transaction.note ?? 'Expense entry'}</p>
                  </div>
                </div>
                <p className="transaction-amount text-slate-800">-₹{transaction.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="page-panel">
          <div className="panel-actions">
            <div>
              <h3 className="setting-title">Savings</h3>
              <p className="setting-detail">Transfers into goals and emergency funds.</p>
            </div>
            <button type="button" className="link-button" onClick={() => setTransferOpen(true)}>Transfer to Savings</button>
          </div>
          <div className="space-y-3">
            {grouped.savings.length === 0 ? <div className="empty-inline">No savings transfers yet.</div> : grouped.savings.map((transaction) => (
              <div key={transaction.id} className="transaction-card">
                <div className="transaction-left">
                  <div className="transaction-icon"><PiggyBank size={16} /></div>
                  <div>
                    <p className="transaction-title">{transaction.category}</p>
                    <p className="transaction-meta">{transaction.occurred_on} • {transaction.note ?? 'Savings transfer'}</p>
                  </div>
                </div>
                <p className="transaction-amount text-emerald-600">₹{transaction.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="page-panel">
          <div className="panel-actions">
            <div>
              <h3 className="setting-title">Investments</h3>
              <p className="setting-detail">SIP, mutual funds, stocks, and more.</p>
            </div>
          </div>
          <div className="space-y-3">
            {grouped.investment.length === 0 ? <div className="empty-inline">No investments recorded yet.</div> : grouped.investment.map((transaction) => (
              <div key={transaction.id} className="transaction-card">
                <div className="transaction-left">
                  <div className="transaction-icon"><Landmark size={16} /></div>
                  <div>
                    <p className="transaction-title">{transaction.category}</p>
                    <p className="transaction-meta">{transaction.occurred_on} • {transaction.note ?? 'Investment entry'}</p>
                  </div>
                </div>
                <p className="transaction-amount text-slate-800">₹{transaction.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-panel">
        <div className="panel-actions">
          <div>
            <h3 className="setting-title">Recent Transactions</h3>
            <p className="setting-detail">Every ledger entry sorted by newest first.</p>
          </div>
          <button type="button" className="link-button" onClick={() => setHistoryOpen(true)}><History size={15} /> View History</button>
        </div>
        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="empty-inline">No transactions yet. Add your first income or expense.</div>
          ) : recentTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-card">
              <div className="transaction-left">
                <div className={`transaction-icon ${transaction.kind === 'income' ? 'income-icon' : 'expense-icon'}`}>
                  {transaction.kind === 'income' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                </div>
                <div>
                  <p className="transaction-title">{transaction.category}</p>
                  <p className="transaction-meta">{txLabel(transaction.kind)} • {transaction.occurred_on}</p>
                </div>
              </div>
              <p className={`transaction-amount ${transaction.kind === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>{transaction.kind === 'income' ? '+' : '-'}₹{transaction.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </section>

      <Modal open={incomeOpen} title="Add Income" onClose={() => setIncomeOpen(false)}>
        <div className="space-y-4">
          <label className="form-field"><span>Amount</span><input className="input-field" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="₹45,000" /></label>
          <label className="form-field"><span>Category</span><input className="input-field" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Salary" /></label>
          <label className="form-field"><span>Note</span><textarea className="input-field" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Bonus, side hustle, or salary" /></label>
          <button type="button" className="button button-primary w-full" disabled={saving} onClick={() => void handleSubmit('income')}>{saving ? 'Saving…' : 'Save Income'}</button>
        </div>
      </Modal>

      <Modal open={expenseOpen} title="Add Expense" onClose={() => setExpenseOpen(false)}>
        <div className="space-y-4">
          <label className="form-field"><span>Amount</span><input className="input-field" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="₹3,200" /></label>
          <label className="form-field"><span>Category</span><input className="input-field" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Groceries" /></label>
          <label className="form-field"><span>Note</span><textarea className="input-field" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Food budget, bills, travel" /></label>
          <button type="button" className="button button-primary w-full" disabled={saving} onClick={() => void handleSubmit('expense')}>{saving ? 'Saving…' : 'Save Expense'}</button>
        </div>
      </Modal>

      <Modal open={transferOpen} title="Transfer to Savings" onClose={() => setTransferOpen(false)}>
        <div className="space-y-4">
          <label className="form-field"><span>Amount</span><input className="input-field" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="₹10,000" /></label>
          <label className="form-field"><span>Goal</span><select className="input-field" value={goalId} onChange={(event) => setGoalId(event.target.value ? Number(event.target.value) : '')}><option value="">General savings</option>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>
          <label className="form-field"><span>Note</span><textarea className="input-field" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Monthly transfer or bonus allocation" /></label>
          <button type="button" className="button button-primary w-full" disabled={saving} onClick={() => void handleSubmit('savings')}>{saving ? 'Saving…' : 'Transfer'}</button>
        </div>
      </Modal>

      <Modal open={historyOpen} title="Transaction History" onClose={() => setHistoryOpen(false)}>
        <div className="space-y-3">
          {transactions.length === 0 ? <div className="empty-inline">No history yet.</div> : transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-card">
              <div>
                <p className="transaction-title">{transaction.category}</p>
                <p className="transaction-meta">{txLabel(transaction.kind)} • {transaction.occurred_on}</p>
              </div>
              <p className="transaction-amount">₹{transaction.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </Modal>

      <Toast message={toast} open={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
};

export default MonthlySavingsPage;
