import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Filter,
  History,
  Landmark,
  PiggyBank,
  PlusCircle,
  Search,
  TrendingUp,
  Wallet,
  Edit3,
  Trash2,
} from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useDreams } from '../context/DreamContext';
import type { Transaction } from '../lib/api';

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

type SortMode = 'latest' | 'oldest' | 'amount-high' | 'amount-low';

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
      return 'Dream Savings';
  }
};

const txDateMs = (tx: Transaction) => {
  const source = tx.created_at || tx.occurred_on;
  const stamp = Date.parse(source);
  if (Number.isNaN(stamp)) {
    return Date.parse(`${tx.occurred_on}T00:00:00`) || 0;
  }
  return stamp;
};

const isSameMonthYear = (date: Date, month: number, year: number) => date.getMonth() === month && date.getFullYear() === year;

const MonthlySavingsPage = () => {
  const {
    goals,
    transactions,
    transactionSummary,
    loading,
    error,
    addIncome,
    addExpense,
    transferToSavings,
    editTransaction,
    removeTransaction,
  } = useDreams();

  const [toast, setToast] = useState('');
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Salary');
  const [note, setNote] = useState('');
  const [goalId, setGoalId] = useState<number | ''>('');

  const [editTransactionId, setEditTransactionId] = useState<number | null>(null);
  const [editKind, setEditKind] = useState<Transaction['kind']>('savings');
  const [editCategory, setEditCategory] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editGoalId, setEditGoalId] = useState<number | ''>('');
  const [editOccurredOn, setEditOccurredOn] = useState('');

  const [saving, setSaving] = useState(false);
  const [deletingTransactionId, setDeletingTransactionId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [filterKind, setFilterKind] = useState<'all' | Transaction['kind']>('all');
  const [sortMode, setSortMode] = useState<SortMode>('latest');
  const [expandedSections, setExpandedSections] = useState<Record<'income' | 'expense' | 'savings' | 'investment', boolean>>({
    income: true,
    expense: true,
    savings: true,
    investment: true,
  });

  useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      setExpandedSections({
        income: false,
        expense: false,
        savings: false,
        investment: false,
      });
    }
  }, []);

  useEffect(() => {
    if (!incomeOpen && !expenseOpen && !transferOpen && !editOpen) {
      setAmount('');
      setCategory('Salary');
      setNote('');
      setGoalId('');
    }
  }, [incomeOpen, expenseOpen, transferOpen, editOpen]);

  useEffect(() => {
    if (!editOpen) {
      setEditTransactionId(null);
      setEditKind('savings');
      setEditCategory('');
      setEditAmount('');
      setEditNote('');
      setEditGoalId('');
      setEditOccurredOn('');
    }
  }, [editOpen]);

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

    (Object.keys(groups) as Array<Transaction['kind']>).forEach((key) => {
      groups[key] = [...groups[key]].sort((a, b) => txDateMs(b) - txDateMs(a));
    });

    return groups;
  }, [transactions]);

  const availableBalance = summary.income - summary.expenses - summary.savings - summary.investments - summary.transfers;

  const chartItems = [
    { label: 'Income', value: summary.income, tone: 'var(--money-income)' },
    { label: 'Expenses', value: summary.expenses, tone: 'var(--money-expense)' },
    { label: 'Savings', value: summary.savings, tone: 'var(--money-savings)' },
  ];
  const chartPeak = Math.max(1, ...chartItems.map((item) => item.value));

  const biggestDream = useMemo(() => {
    if (goals.length === 0) return null;
    return [...goals].sort((a, b) => b.target_amount - a.target_amount)[0];
  }, [goals]);

  const insights = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevDate = new Date(currentYear, currentMonth - 1, 1);

    const byKindMonth = (kind: Transaction['kind'], month: number, year: number) => transactions
      .filter((tx) => tx.kind === kind)
      .filter((tx) => {
        const d = new Date(`${tx.occurred_on}T00:00:00`);
        return isSameMonthYear(d, month, year);
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const currentSavings = byKindMonth('savings', currentMonth, currentYear);
    const prevSavings = byKindMonth('savings', prevDate.getMonth(), prevDate.getFullYear());
    const savingsDelta = currentSavings - prevSavings;

    const foodCurrent = transactions
      .filter((tx) => tx.kind === 'expense' && ['food', 'grocery', 'groceries', 'dining', 'restaurant'].some((k) => tx.category.toLowerCase().includes(k)))
      .filter((tx) => {
        const d = new Date(`${tx.occurred_on}T00:00:00`);
        return isSameMonthYear(d, currentMonth, currentYear);
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const foodPrev = transactions
      .filter((tx) => tx.kind === 'expense' && ['food', 'grocery', 'groceries', 'dining', 'restaurant'].some((k) => tx.category.toLowerCase().includes(k)))
      .filter((tx) => {
        const d = new Date(`${tx.occurred_on}T00:00:00`);
        return isSameMonthYear(d, prevDate.getMonth(), prevDate.getFullYear());
      })
      .reduce((sum, tx) => sum + tx.amount, 0);

    const results: string[] = [];

    if (prevSavings > 0 && savingsDelta !== 0) {
      if (savingsDelta > 0) {
        results.push(`You saved ${formatCurrency(savingsDelta)} more than last month.`);
      } else {
        results.push(`Savings were ${formatCurrency(Math.abs(savingsDelta))} lower than last month.`);
      }
    }

    if (foodPrev > 0) {
      const foodPct = ((foodCurrent - foodPrev) / foodPrev) * 100;
      if (foodPct < 0) {
        results.push(`Food expenses decreased by ${Math.abs(foodPct).toFixed(0)}%.`);
      } else if (foodPct > 0) {
        results.push(`Food expenses increased by ${foodPct.toFixed(0)}%.`);
      }
    }

    if (biggestDream) {
      results.push(`You're ${biggestDream.progress.toFixed(0)}% closer to your biggest dream.`);
    }

    return results;
  }, [biggestDream, transactions]);

  const sortedFilteredTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const filtered = transactions.filter((transaction) => {
      const filterMatch = filterKind === 'all' || transaction.kind === filterKind;
      const searchHaystack = `${transaction.category} ${transaction.note ?? ''} ${transaction.occurred_on} ${txLabel(transaction.kind)}`.toLowerCase();
      const queryMatch = normalizedQuery.length === 0 || searchHaystack.includes(normalizedQuery);
      return filterMatch && queryMatch;
    });

    return [...filtered].sort((left, right) => {
      if (sortMode === 'latest') return txDateMs(right) - txDateMs(left);
      if (sortMode === 'oldest') return txDateMs(left) - txDateMs(right);
      if (sortMode === 'amount-high') return right.amount - left.amount;
      return left.amount - right.amount;
    });
  }, [filterKind, query, sortMode, transactions]);

  const recentTransactions = sortedFilteredTransactions.slice(0, 10);

  const toggleSection = (key: 'income' | 'expense' | 'savings' | 'investment') => {
    setExpandedSections((current) => ({
      ...current,
      [key]: !current[key],
    }));
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

  const handleTransferToDream = () => {
    const firstGoalId = goals[0]?.id;
    setGoalId(firstGoalId ?? '');
    setTransferOpen(true);
  };

  const openEdit = (transaction: Transaction) => {
    setEditTransactionId(transaction.id);
    setEditKind(transaction.kind);
    setEditCategory(transaction.category);
    setEditAmount(String(transaction.amount));
    setEditNote(transaction.note ?? '');
    setEditGoalId(transaction.goal_id ?? '');
    setEditOccurredOn(transaction.occurred_on);
    setEditOpen(true);
  };

  const handleUpdateTransaction = async () => {
    if (editTransactionId === null) return;
    const value = Number(editAmount);
    if (!value || value <= 0) {
      setToast('Enter a valid amount.');
      return;
    }

    setSaving(true);
    try {
      await editTransaction(editTransactionId, {
        kind: editKind,
        category: editCategory || txLabel(editKind),
        amount: value,
        goal_id: editKind === 'savings' ? (editGoalId === '' ? null : Number(editGoalId)) : null,
        note: editNote || null,
        occurred_on: editOccurredOn,
      });
      setToast('Transaction updated successfully');
      setEditOpen(false);
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Unable to update transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    if (deletingTransactionId !== null) {
      return;
    }

    if (!window.confirm(`Delete ${transaction.category}? This cannot be undone.`)) {
      return;
    }

    setDeletingTransactionId(transaction.id);
    try {
      await removeTransaction(transaction.id);
      setToast('Transaction deleted successfully');
      if (editTransactionId === transaction.id) {
        setEditOpen(false);
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Unable to delete transaction');
    } finally {
      setDeletingTransactionId(null);
    }
  };

  const transactionActions = (transaction: Transaction) => (
    <div className="transaction-actions">
      <button
        type="button"
        className="icon-action-button"
        onClick={() => openEdit(transaction)}
        aria-label={`Edit ${transaction.category}`}
        disabled={deletingTransactionId !== null}
      >
        <Edit3 size={14} />
      </button>
      <button
        type="button"
        className="icon-action-button icon-action-button-danger"
        onClick={() => void handleDeleteTransaction(transaction)}
        aria-label={deletingTransactionId === transaction.id ? `Deleting ${transaction.category}` : `Delete ${transaction.category}`}
        disabled={deletingTransactionId !== null}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );

  const renderLedgerSection = (
    key: 'income' | 'expense' | 'savings' | 'investment',
    title: string,
    detail: string,
    actionLabel: string | null,
    onAction: (() => void) | null,
    items: Transaction[],
    iconFor: (transaction: Transaction) => ReactNode,
    amountClassFor: (transaction: Transaction) => string,
    amountPrefixFor: (transaction: Transaction) => string,
  ) => (
    <div className="page-panel">
      <div className="panel-actions">
        <div>
          <h3 className="setting-title">{title}</h3>
          <p className="setting-detail">{detail}</p>
        </div>
        {actionLabel && onAction ? <button type="button" className="link-button" onClick={onAction}>{actionLabel}</button> : null}
      </div>

      <button type="button" className="savings-accordion-toggle" onClick={() => toggleSection(key)}>
        <span>{expandedSections[key] ? 'Collapse' : 'Expand'} {title}</span>
        {expandedSections[key] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expandedSections[key] ? (
        <div className="space-y-3 savings-accordion-content">
          {items.length === 0 ? <div className="empty-inline">No {title.toLowerCase()} recorded yet.</div> : items.map((transaction) => (
            <div key={transaction.id} className="transaction-card">
              <div className="transaction-left">
                {iconFor(transaction)}
                <div>
                  <p className="transaction-title">{transaction.category}</p>
                  <p className="transaction-meta">{transaction.occurred_on} • {transaction.note ?? `${title} entry`}</p>
                </div>
              </div>
              <div className="transaction-right">
                <p className={`transaction-amount ${amountClassFor(transaction)}`}>{amountPrefixFor(transaction)}₹{transaction.amount.toLocaleString()}</p>
                {transactionActions(transaction)}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );

  if (loading) {
    return <div className="rounded-[32px] border border-white/70 bg-white/70 p-6 text-slate-600 shadow-[0_20px_60px_rgba(15,23,42,0.06)] backdrop-blur">Loading your money hub…</div>;
  }

  if (error) {
    return <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">{error}</div>;
  }

  return (
    <div className="page-grid savings-hub-page money-hub-page">
      <section className="page-panel page-hero money-hub-hero">
        <div className="theme-pill">❤️ Money Hub</div>
        <div>
          <h2>Every rupee saved today builds tomorrow.</h2>
          <p>— Siri Papa</p>
        </div>
      </section>

      <section className="stat-grid money-summary-grid">
        <div className="metric-card money-summary-card">
          <div>
            <p className="metric-label">💰 Income</p>
            <p className="metric-value">{formatCurrency(summary.income)}</p>
          </div>
          <div className="icon-box"><ArrowUpRight size={18} /></div>
        </div>
        <div className="metric-card money-summary-card">
          <div>
            <p className="metric-label">💸 Expenses</p>
            <p className="metric-value">{formatCurrency(summary.expenses)}</p>
          </div>
          <div className="icon-box"><ArrowDownRight size={18} /></div>
        </div>
        <div className="metric-card money-summary-card">
          <div>
            <p className="metric-label">🏦 Total Savings</p>
            <p className="metric-value">{formatCurrency(summary.savings)}</p>
          </div>
          <div className="icon-box"><PiggyBank size={18} /></div>
        </div>
        <div className="metric-card money-summary-card">
          <div>
            <p className="metric-label">💳 Available Balance</p>
            <p className="metric-value">{formatCurrency(availableBalance)}</p>
          </div>
          <div className="icon-box"><Wallet size={18} /></div>
        </div>
      </section>

      <section className="page-panel money-chart-panel">
        <div className="panel-actions">
          <div>
            <h3 className="setting-title">Monthly Cashflow</h3>
            <p className="setting-detail">Income, expenses, and savings from real ledger data.</p>
          </div>
        </div>
        <div className="money-chart-scroll">
          <div className="money-chart-canvas" role="img" aria-label="Monthly cashflow chart">
            {chartItems.map((item) => (
              <div key={item.label} className="money-chart-column">
                <div className="money-chart-value">{formatCurrency(item.value)}</div>
                <div className="money-chart-track">
                  <div
                    className="money-chart-fill"
                    style={{
                      height: `${(item.value / chartPeak) * 100}%`,
                      background: item.tone,
                    }}
                  />
                </div>
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-panel">
        <div className="panel-actions">
          <div>
            <h3 className="setting-title">Recent Transactions</h3>
            <p className="setting-detail">Latest 10 entries with search, filter, and sort.</p>
          </div>
          <button type="button" className="link-button" onClick={() => setHistoryOpen(true)}><History size={15} /> View Full History</button>
        </div>

        <div className="money-tx-toolbar">
          <label className="search-pill search-pill-transactions">
            <Search size={16} />
            <input
              className="search-input"
              type="search"
              placeholder="Search category, note, or date"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="filter-pill money-tx-select-wrap">
            <Filter size={15} />
            <select value={filterKind} onChange={(event) => setFilterKind(event.target.value as 'all' | Transaction['kind'])}>
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="savings">Dream Savings</option>
              <option value="transfer">Transfer</option>
              <option value="investment">Investment</option>
            </select>
          </label>

          <label className="filter-pill money-tx-select-wrap">
            <TrendingUp size={15} />
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="latest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="amount-high">Amount High-Low</option>
              <option value="amount-low">Amount Low-High</option>
            </select>
          </label>
        </div>

        <div className="space-y-3">
          {recentTransactions.length === 0 ? (
            <div className="empty-inline money-empty-state">
              <p>No transactions yet.</p>
              <p>Start tracking your money today.</p>
              <button type="button" className="button button-primary" onClick={() => setIncomeOpen(true)}>Add First Transaction</button>
            </div>
          ) : recentTransactions.map((transaction) => {
            const positive = transaction.kind === 'income' || transaction.kind === 'savings';
            return (
              <details key={transaction.id} className="money-tx-card" open={false}>
                <summary>
                  <div className="transaction-left">
                    <div className={`transaction-icon ${positive ? 'income-icon' : 'expense-icon'}`}>
                      {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    </div>
                    <div>
                      <p className="transaction-title">{transaction.category}</p>
                      <p className="transaction-meta">{txLabel(transaction.kind)} • {transaction.occurred_on}</p>
                    </div>
                  </div>
                  <p className={`transaction-amount ${positive ? 'text-emerald-600' : 'text-slate-800'}`}>{positive ? '+' : '-'}{formatCurrency(transaction.amount)}</p>
                </summary>
                <div className="money-tx-body">
                  <p className="transaction-meta">{transaction.note ?? 'No note added'}</p>
                  {transactionActions(transaction)}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <section className="page-panel">
        <div className="panel-actions">
          <div>
            <h3 className="setting-title">Quick Actions</h3>
            <p className="setting-detail">All money actions, always reachable.</p>
          </div>
        </div>
        <div className="savings-quick-actions">
          <button type="button" className="button button-primary" onClick={() => setIncomeOpen(true)}><PlusCircle size={16} /> Add Income</button>
          <button type="button" className="button button-secondary" onClick={() => setExpenseOpen(true)}><ArrowDownRight size={16} /> Add Expense</button>
          <button type="button" className="button button-primary" onClick={handleAddSavings}><PiggyBank size={16} /> Add Savings</button>
          <button type="button" className="button button-secondary" onClick={handleTransferToDream}><TrendingUp size={16} /> Transfer to Dream</button>
        </div>
      </section>

      <section className="page-panel">
        <h3 className="setting-title">Insights</h3>
        <div className="space-y-3 mt-4">
          {insights.length > 0 ? insights.map((insight) => (
            <article key={insight} className="setting-card">
              <p className="setting-detail">{insight}</p>
            </article>
          )) : (
            <article className="setting-card">
              <p className="setting-detail">Add a few transactions to unlock personalized insights from your real data.</p>
            </article>
          )}
        </div>
      </section>

      <section className="page-grid savings-ledger-grid">
        {renderLedgerSection(
          'income',
          'Income Summary',
          'Salary, bonuses, side income.',
          'Add Income',
          () => setIncomeOpen(true),
          grouped.income,
          () => <div className="transaction-icon income-icon"><ArrowUpRight size={16} /></div>,
          () => 'text-emerald-600',
          () => '+',
        )}

        {renderLedgerSection(
          'expense',
          'Expense Summary',
          'Needs, food, bills, and lifestyle spend.',
          'Add Expense',
          () => setExpenseOpen(true),
          grouped.expense,
          () => <div className="transaction-icon expense-icon"><ArrowDownRight size={16} /></div>,
          () => 'text-slate-800',
          () => '-',
        )}

        {renderLedgerSection(
          'savings',
          'Savings Summary',
          'Transfers into goals and emergency funds.',
          'Transfer to Dream',
          handleTransferToDream,
          grouped.savings,
          () => <div className="transaction-icon"><PiggyBank size={16} /></div>,
          () => 'text-emerald-600',
          () => '',
        )}

        {renderLedgerSection(
          'investment',
          'Investments',
          'SIP, mutual funds, stocks, and more.',
          null,
          null,
          grouped.investment,
          () => <div className="transaction-icon"><Landmark size={16} /></div>,
          () => 'text-slate-800',
          () => '',
        )}
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

      <Modal open={transferOpen} title="Transfer to Dream" onClose={() => setTransferOpen(false)}>
        <div className="space-y-4">
          <label className="form-field"><span>Amount</span><input className="input-field" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="₹10,000" /></label>
          <label className="form-field"><span>Goal</span><select className="input-field" value={goalId} onChange={(event) => setGoalId(event.target.value ? Number(event.target.value) : '')}><option value="">General savings</option>{goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>
          <label className="form-field"><span>Note</span><textarea className="input-field" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Monthly transfer or bonus allocation" /></label>
          <button type="button" className="button button-primary w-full" disabled={saving} onClick={() => void handleSubmit('savings')}>{saving ? 'Saving…' : 'Transfer'}</button>
        </div>
      </Modal>

      <div className="savings-mobile-sticky" role="group" aria-label="Quick Money Actions">
        <button type="button" className="button button-primary" onClick={() => setIncomeOpen(true)}><PlusCircle size={14} /> Add Income</button>
        <button type="button" className="button button-secondary" onClick={() => setExpenseOpen(true)}><ArrowDownRight size={14} /> Add Expense</button>
        <button type="button" className="button button-primary" onClick={handleAddSavings}><PiggyBank size={14} /> Add Savings</button>
        <button type="button" className="button button-secondary" onClick={handleTransferToDream}><TrendingUp size={14} /> Transfer to Dream</button>
      </div>

      <Modal open={historyOpen} title="Transaction History" onClose={() => setHistoryOpen(false)}>
        <div className="space-y-3">
          {transactions.length === 0 ? <div className="empty-inline">No history yet.</div> : sortedFilteredTransactions.map((transaction) => (
            <div key={transaction.id} className="transaction-card">
              <div>
                <p className="transaction-title">{transaction.category}</p>
                <p className="transaction-meta">{txLabel(transaction.kind)} • {transaction.occurred_on}</p>
              </div>
              <div className="transaction-right">
                <p className="transaction-amount">₹{transaction.amount.toLocaleString()}</p>
                {transactionActions(transaction)}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={editOpen} title="Edit Transaction" onClose={() => setEditOpen(false)}>
        <div className="space-y-4">
          <label className="form-field">
            <span>Type</span>
            <select className="input-field" value={editKind} onChange={(event) => setEditKind(event.target.value as Transaction['kind'])}>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
              <option value="transfer">Transfer</option>
            </select>
          </label>
          <label className="form-field">
            <span>Amount</span>
            <input className="input-field" type="number" min="1" value={editAmount} onChange={(event) => setEditAmount(event.target.value)} />
          </label>
          <label className="form-field">
            <span>Category</span>
            <input className="input-field" value={editCategory} onChange={(event) => setEditCategory(event.target.value)} />
          </label>
          {editKind === 'savings' ? (
            <label className="form-field">
              <span>Goal</span>
              <select className="input-field" value={editGoalId} onChange={(event) => setEditGoalId(event.target.value ? Number(event.target.value) : '')}>
                <option value="">General savings</option>
                {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
              </select>
            </label>
          ) : null}
          <label className="form-field">
            <span>Date</span>
            <input className="input-field" type="date" value={editOccurredOn} onChange={(event) => setEditOccurredOn(event.target.value)} />
          </label>
          <label className="form-field">
            <span>Note</span>
            <textarea className="input-field" rows={3} value={editNote} onChange={(event) => setEditNote(event.target.value)} />
          </label>
          <button type="button" className="button button-primary w-full" disabled={saving} onClick={() => void handleUpdateTransaction()}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </Modal>

      <Toast message={toast} open={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
};

export default MonthlySavingsPage;
