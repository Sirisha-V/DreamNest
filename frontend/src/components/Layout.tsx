import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, Sparkles, BarChart3, Wallet2, UserCircle2, Settings, LogOut, Plus, HeartHandshake, PlusCircle } from 'lucide-react';
import { useDreams } from '../context/DreamContext';
import OnboardingExperience from './OnboardingExperience';
import { getOnboardingPending } from '../lib/onboarding';
import { clearStoredSession } from '../lib/auth';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home },
  { to: '/monthly-savings', label: 'Savings Hub', icon: Wallet2 },
  { to: '/dreams', label: 'Dreams', icon: Sparkles },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/transactions', label: 'Transactions', icon: Wallet2 },
  { to: '/couple-corner', label: 'Couple Corner', icon: HeartHandshake },
  { to: '/profile', label: 'Profile', icon: UserCircle2 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const mobileNavItems = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/monthly-savings', label: 'Savings', icon: Wallet2 },
  { to: '/dreams', label: 'Dreams', icon: Sparkles },
  { to: '/transactions', label: 'Money', icon: Wallet2 },
  { to: '/couple-corner', label: 'Couple', icon: HeartHandshake },
  { to: '/analytics', label: 'Stats', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const Layout = () => {
  const navigate = useNavigate();
  const { onboardingCompleted } = useDreams();
  const shouldShowOnboarding = getOnboardingPending() && !onboardingCompleted;

  const handleLogout = () => {
    clearStoredSession();
    navigate('/login');
  };

  const openDreamsPanel = (panel: string) => {
    navigate(`/dreams?panel=${panel}`);
  };

  return (
    <div className="app-shell">
      {shouldShowOnboarding ? <OnboardingExperience /> : null}
      <div className="app-layout">
        <aside className="sidebar">
          <div className="brand-block">
            <div className="brand-logo">D</div>
            <div>
              <p className="brand-title">DreamNest</p>
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
            <p className="promo-copy">Create a new milestone and keep your plan moving forward.</p>
            <button type="button" className="button button-secondary button-icon" onClick={() => openDreamsPanel('create')}>
              <Plus /> New Dream
            </button>
          </div>
        </aside>

        <div className="floating-actions">
          <button type="button" className="fab-button" onClick={() => openDreamsPanel('create')}><PlusCircle size={20} /></button>
          <div className="fab-menu">
            <button type="button" className="fab-item" onClick={() => openDreamsPanel('create')}>Create Dream</button>
            <button type="button" className="fab-item" onClick={() => openDreamsPanel('savings')}>Add Savings</button>
            <button type="button" className="fab-item" onClick={() => openDreamsPanel('simulator')}>Run Simulator</button>
          </div>
        </div>

        <main className="main-content">
          <header className="header-card">
            <div>
              <p className="eyebrow">DreamNest</p>
              <h1 className="page-title">Plan boldly. Save beautifully.</h1>
            </div>
            <div className="header-actions">
              <button type="button" className="button button-ghost" onClick={() => openDreamsPanel('create')}>+ New dream</button>
              <button className="icon-button" onClick={handleLogout}>
                <LogOut />
              </button>
            </div>
          </header>
          <Outlet />
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {mobileNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
