import { Moon, Globe, ShieldCheck, Download, ChevronRight } from 'lucide-react';

const settings = [
  { title: 'Dark mode', detail: 'Switch between light and dark aesthetics', icon: Moon },
  { title: 'Language', detail: 'English', icon: Globe },
  { title: 'Privacy', detail: 'Your data stays protected', icon: ShieldCheck },
  { title: 'Export data', detail: 'Download your history', icon: Download },
];

const SettingsPage = () => {
  return (
    <div className="page-grid">
      <section className="page-panel page-hero">
        <div className="theme-pill">Settings</div>
        <div>
          <h2>A calm control center for your experience.</h2>
        </div>
      </section>

      <section className="settings-grid">
        {settings.map(({ title, detail, icon: Icon }) => (
          <div key={title} className="setting-card">
            <div className="panel-actions">
              <div className="icon-box"><Icon size={18} /></div>
              <div>
                <p className="setting-title">{title}</p>
                <p className="setting-detail">{detail}</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </div>
        ))}
      </section>
    </div>
  );
};

export default SettingsPage;
