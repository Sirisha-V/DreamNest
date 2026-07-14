import { useState } from 'react';
import { Globe, ShieldCheck } from 'lucide-react';
import Toast from '../components/Toast';

const SettingsPage = () => {
  const [language, setLanguage] = useState(() => window.localStorage.getItem('dreamnest-language') ?? 'English');
  const [toast, setToast] = useState('');

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    window.localStorage.setItem('dreamnest-language', newLanguage);
    setToast(`Language set to ${newLanguage}`);
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

      </section>

      <Toast message={toast} open={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
};

export default SettingsPage;
