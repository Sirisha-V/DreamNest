import { useMemo, useState } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Landmark, PiggyBank, RefreshCw } from 'lucide-react';
import { useDreams } from '../context/DreamContext';

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const TransactionsPage = () => {
  const { transactionSummary, transactions } = useDreams();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'income' | 'expense' | 'savings' | 'investment' | 'transfer'>('all');

  const visibleTransactions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesFilter = activeFilter === 'all' || transaction.kind === activeFilter;
      const haystack = [transaction.category, transaction.note ?? '', transaction.kind, transaction.occurred_on].join(' ').toLowerCase();
      const matchesQuery = normalized.length === 0 || haystack.includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query, transactions]);

  const summaryCards = [
    { title: 'Income', value: formatCurrency(transactionSummary?.income ?? 0), icon: ArrowUpRight, tone: 'income-icon' },
    { title: 'Expenses', value: formatCurrency(transactionSummary?.expenses ?? 0), icon: ArrowDownRight, tone: 'expense-icon' },
    { title: 'Savings', value: formatCurrency(transactionSummary?.savings ?? 0), icon: PiggyBank, tone: 'income-icon' },
    { title: 'Transfers', value: formatCurrency(transactionSummary?.transfers ?? 0), icon: Landmark, tone: 'expense-icon' },
  ];

  return (
    <div className="page-grid app-standard-page">
      <section className="page-panel page-hero">
        <div className="theme-pill">Transactions</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2>A clean record of every movement.</h2>
            <p>Search, filter, and review the live ledger behind your savings hub.</p>
          </div>
          <label className="search-pill search-pill-transactions">
            <Search size={16} />
            <input
              className="search-input"
              type="search"
              placeholder="Search categories, notes, or dates"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="stat-grid">
        {summaryCards.map(({ title, value, icon: Icon, tone }) => (
          <div key={title} className="metric-card">
            <div>
              <p className="metric-label">{title}</p>
              <p className="metric-value">{value}</p>
              <p className="metric-detail">From the live ledger</p>
            </div>
            <div className={`transaction-icon ${tone}`}><Icon size={16} /></div>
          </div>
        ))}
      </section>

      <section className="page-panel">
        <div className="panel-actions">
          <div>
            <p className="setting-title">Recent activity</p>
            <p className="setting-detail">{transactionSummary ? `${transactionSummary.recent_transactions.length} recent entries in your ledger.` : 'Waiting for transaction data.'}</p>
          </div>
          <div className="panel-actions">
            <button className="filter-pill" type="button" onClick={() => setActiveFilter('all')}><RefreshCw size={15} /> Reset</button>
            <button className="filter-pill" type="button"><Filter size={15} /> Filters</button>
          </div>
        </div>

        <div className="panel-actions">
          {(['all', 'income', 'expense', 'savings', 'investment', 'transfer'] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              className={`filter-pill ${activeFilter === kind ? 'mission-card-complete' : ''}`}
              onClick={() => setActiveFilter(kind)}
            >
              {kind === 'all' ? 'All activity' : kind.charAt(0).toUpperCase() + kind.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {visibleTransactions.length === 0 ? (
            <div className="empty-inline">No transactions match this filter yet. Add an income, expense, or savings transfer from the savings hub.</div>
          ) : visibleTransactions.map((item) => {
            const isPositive = item.kind === 'income' || item.kind === 'savings';
            const Icon = isPositive ? ArrowUpRight : ArrowDownRight;
            return (
              <div key={item.id} className="transaction-card">
                <div className="transaction-left">
                  <div className={`transaction-icon ${isPositive ? 'income-icon' : 'expense-icon'}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="transaction-title">{item.category}</p>
                    <p className="transaction-meta">{item.kind.charAt(0).toUpperCase() + item.kind.slice(1)} • {item.occurred_on}</p>
                    {item.note ? <p className="transaction-meta">{item.note}</p> : null}
                  </div>
                </div>
                <p className={`transaction-amount ${isPositive ? 'text-emerald-600' : 'text-slate-800'}`}>{isPositive ? '+' : '-'}{formatCurrency(item.amount)}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default TransactionsPage;
