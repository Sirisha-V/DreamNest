import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Sparkles, BarChart3, Wallet2, UserCircle2, Settings, LogOut, Plus } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/dreams', label: 'Dreams', icon: Sparkles },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/transactions', label: 'Transactions', icon: Wallet2 },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const Layout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('dreamnest_token');
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <div className="app-layout">
        <aside className="sidebar">
          <div className="brand-block">
            <div className="brand-logo">D</div>
            <div>
              <p className="brand-title">DreamNest</p>
              <p className="brand-subtitle">AI financial planning</p>
            </div>
          </div>
          <nav className="nav-list">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <span className="nav-icon"><Icon /></span>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="promo-card">
            <p className="promo-title">Ready for your next dream?</p>
            <p className="promo-copy">Create a new milestone and let Nesty guide the way.</p>
            <button className="button button-secondary button-icon">
              <Plus /> New Dream
            </button>
          </div>
        </aside>

        <main className="main-content">
          <header className="header-card">
            <div>
              <p className="eyebrow">DreamNest</p>
              <h1 className="page-title">Plan boldly. Save beautifully.</h1>
            </div>
            <div className="header-actions">
              <button className="button button-ghost">+ New dream</button>
              <button className="icon-button" onClick={handleLogout}>
                <LogOut />
              </button>
            </div>
          </header>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
