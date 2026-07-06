import { TrendingUp, PieChart, Wallet2, Sparkles } from 'lucide-react';

const cards = [
  { title: 'Savings Trend', value: '+12%', icon: TrendingUp },
  { title: 'Spending', value: '₹18.2K', icon: Wallet2 },
  { title: 'Category Split', value: 'Well balanced', icon: PieChart },
  { title: 'Dream Score', value: '84', icon: Sparkles },
];

const metrics = [
  { label: 'Emergency fund', value: '78%' },
  { label: 'Goal completion pace', value: 'On track' },
  { label: 'Budget discipline', value: 'Strong' },
];

const AnalyticsPage = () => {
  return (
    <div className="page-grid">
      <section className="page-panel page-hero">
        <div className="theme-pill">Analytics</div>
        <div>
          <h2>See what your money is teaching you.</h2>
        </div>
      </section>

      <section className="stat-grid">
        {cards.map(({ title, value, icon: Icon }) => (
          <div key={title} className="metric-card">
            <div>
              <p className="metric-label">{title}</p>
              <p className="metric-value">{value}</p>
            </div>
            <div className="icon-box"><Icon size={18} /></div>
          </div>
        ))}
      </section>

      <section className="page-grid">
        <div className="page-panel feature-card">
          <h3 className="setting-title">Financial health overview</h3>
          <div className="mt-6 flex h-56 items-end gap-3 rounded-[24px] border border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
            {[40, 68, 54, 82, 74, 90].map((height) => (
              <div key={height} className="flex-1 rounded-t-[16px] bg-gradient-to-t from-emerald-500 to-teal-400" style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
        <div className="page-panel">
          <h3 className="setting-title">Signals to watch</h3>
          <div className="mt-4 space-y-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="setting-card">
                <p className="setting-title">{metric.label}</p>
                <p className="setting-detail">{metric.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsPage;
