import { Camera, ShieldCheck, Moon, Bell, Sparkles } from 'lucide-react';

const ProfilePage = () => {
  return (
    <div className="page-grid">
      <section className="page-panel page-hero">
        <div className="theme-pill">Profile</div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xl font-semibold text-white">S</div>
            <div>
              <p className="setting-label">Your account</p>
              <h2 className="setting-title">Sirisha R.</h2>
              <p className="setting-detail">sirisha@example.com</p>
            </div>
          </div>
          <button className="button button-ghost button-icon"><Camera size={16} /> Update photo</button>
        </div>
      </section>

      <section className="page-grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="page-panel profile-card">
          <div className="panel-actions">
            <div className="theme-pill"><ShieldCheck size={16} /> Security</div>
          </div>
          <div className="space-y-3">
            <div className="setting-card">
              <p className="setting-title">Two-factor authentication enabled</p>
            </div>
            <div className="setting-card">
              <p className="setting-title">Password last changed 2 weeks ago</p>
            </div>
          </div>
        </div>
        <div className="page-panel profile-card">
          <div className="panel-actions">
            <div className="theme-pill"><Bell size={16} /> Preferences</div>
          </div>
          <div className="space-y-3">
            <div className="setting-card">
              <div className="panel-actions">
                <span>Dark mode</span>
                <Moon size={16} />
              </div>
            </div>
            <div className="setting-card">
              <p className="setting-title">Notifications for milestones enabled</p>
            </div>
          </div>
        </div>
      </section>

      <section className="page-panel" style={{ background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', color: 'white' }}>
        <div className="panel-actions">
          <Sparkles size={18} /> DreamNest coaching
        </div>
        <p className="setting-detail">You are currently pacing well toward your top three goals. Consider adding a small automated transfer this month to stay ahead of schedule.</p>
      </section>
    </div>
  );
};

export default ProfilePage;
