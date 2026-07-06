import { Search, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const transactions = [
  { title: 'Salary', type: 'Income', amount: '+₹45,000', date: '10 Jul', icon: ArrowUpRight },
  { title: 'Groceries', type: 'Expense', amount: '-₹3,200', date: '08 Jul', icon: ArrowDownRight },
  { title: 'Investments', type: 'Investment', amount: '-₹12,000', date: '06 Jul', icon: ArrowDownRight },
];

const TransactionsPage = () => {
  return (
    <div className="page-grid">
      <section className="page-panel page-hero">
        <div className="theme-pill">Transactions</div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2>A clean record of every movement.</h2>
          </div>
          <div className="search-pill"><Search size={16} /> Search</div>
        </div>
      </section>

      <section className="page-panel">
        <div className="panel-actions">
          <div>
            <p className="setting-title">Recent activity</p>
          </div>
          <button className="filter-pill"><Filter size={15} /> Filters</button>
        </div>
        <div className="space-y-3">
          {transactions.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="transaction-card">
                <div className="transaction-left">
                  <div className={`transaction-icon ${item.type === 'Income' ? 'income-icon' : 'expense-icon'}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="transaction-title">{item.title}</p>
                    <p className="transaction-meta">{item.type} • {item.date}</p>
                  </div>
                </div>
                <p className={`transaction-amount ${item.type === 'Income' ? 'text-emerald-600' : 'text-slate-800'}`}>{item.amount}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default TransactionsPage;
