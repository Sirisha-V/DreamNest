import { useMemo, useState } from 'react';
import { Moon, Globe, ShieldCheck, Download } from 'lucide-react';
import Toast from '../components/Toast';
import { useDreams } from '../context/DreamContext';
import { useThemePreference } from '../hooks/useThemePreference';

const SettingsPage = () => {
  const { dashboard, goals, transactions } = useDreams();
  const { isDarkMode, toggleTheme } = useThemePreference();
  const [language, setLanguage] = useState(() => window.localStorage.getItem('dreamnest-language') ?? 'English');
  const [toast, setToast] = useState('');

  const exportPayload = useMemo(() => ({
    exported_at: new Date().toISOString(),
    dashboard,
    goals,
    transactions,
  }), [dashboard, goals, transactions]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    window.localStorage.setItem('dreamnest-language', newLanguage);
    setToast(`Language set to ${newLanguage}`);
  };

  const handleExportData = () => {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `dreamnest-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setToast('Data exported successfully');
  };

  return (
    <div className="page-grid app-standard-page">
      <section className="page-panel page-hero">
        <div className="theme-pill">Settings</div>
        <div>
          <h2>A calm control center for your experience.</h2>
          <p>Preferences now save instantly and sync across pages.</p>
        </div>
      </section>

      <section className="settings-grid">
        <article className="setting-card">
          <div className="panel-actions setting-row">
            <div className="panel-actions">
              <div className="icon-box"><Moon size={18} /></div>
              <div>
                <p className="setting-title">Dark mode</p>
                <p className="setting-detail">Switch between light and dark aesthetics</p>
              </div>
            </div>
            <button type="button" className={`toggle-button ${isDarkMode ? 'toggle-button-on' : ''}`} onClick={toggleTheme} aria-label="Toggle dark mode" aria-pressed={isDarkMode}>
              <span className="toggle-knob" />
            </button>
          </div>
        </article>

        <article className="setting-card">
          <div className="panel-actions setting-row">
            <div className="panel-actions">
              <div className="icon-box"><Globe size={18} /></div>
              <div>
                <p className="setting-title">Language</p>
                <p className="setting-detail">Choose your preferred app language</p>
              </div>
            </div>
            <select className="settings-select" value={language} onChange={(event) => handleLanguageChange(event.target.value)}>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Telugu">Telugu</option>
            </select>
          </div>
        </article>

        <article className="setting-card">
          <div className="panel-actions setting-row">
            <div className="panel-actions">
              <div className="icon-box"><ShieldCheck size={18} /></div>
              <div>
                <p className="setting-title">Privacy</p>
                <p className="setting-detail">Your data stays protected on your account</p>
              </div>
            </div>
            <button type="button" className="button button-ghost" onClick={() => setToast('Privacy protections are active for your account')}>
              View status
            </button>
          </div>
        </article>

        <article className="setting-card">
          <div className="panel-actions setting-row">
            <div className="panel-actions">
              <div className="icon-box"><Download size={18} /></div>
              <div>
                <p className="setting-title">Export data</p>
                <p className="setting-detail">Download your dashboard, goals, and transactions</p>
              </div>
            </div>
            <button type="button" className="button button-ghost" onClick={handleExportData}>
              Export JSON
            </button>
          </div>
        </article>
      </section>

      <Toast message={toast} open={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
};

export default SettingsPage;
