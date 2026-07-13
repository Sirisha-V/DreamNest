import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Camera, ShieldCheck, Bell, Sparkles } from 'lucide-react';
import Toast from '../components/Toast';
import { useThemePreference } from '../hooks/useThemePreference';

const AVATAR_STORAGE_KEY = 'dreamnest-avatar-data';
const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

const ProfilePage = () => {
  const { isDarkMode, toggleTheme } = useThemePreference();
  const [milestoneAlerts, setMilestoneAlerts] = useState(() => window.localStorage.getItem('dreamnest-milestones') !== 'off');
  const [avatarDataUrl, setAvatarDataUrl] = useState(() => window.localStorage.getItem(AVATAR_STORAGE_KEY) ?? '');
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const accountName = 'Sirisha R.';
  const accountEmail = 'sirisha@example.com';

  const initials = useMemo(() => {
    const tokens = accountName.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      return 'U';
    }

    const first = tokens[0][0] ?? '';
    const second = tokens[1]?.[0] ?? '';
    return `${first}${second}`.toUpperCase();
  }, [accountName]);

  const handleMilestoneToggle = () => {
    const nextValue = !milestoneAlerts;
    setMilestoneAlerts(nextValue);
    window.localStorage.setItem('dreamnest-milestones', nextValue ? 'on' : 'off');
    setToast(nextValue ? 'Milestone notifications enabled' : 'Milestone notifications disabled');
  };

  const handleThemeToggle = () => {
    toggleTheme();
    setToast(isDarkMode ? 'Light mode enabled' : 'Dark mode enabled');
  };

  const openPhotoPicker = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setToast('Please select an image file');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setToast('Photo size must be 2 MB or less');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        setToast('Unable to read this image. Please try another file.');
        return;
      }

      setAvatarDataUrl(result);
      window.localStorage.setItem(AVATAR_STORAGE_KEY, result);
      setToast('Profile photo updated');
    };

    reader.onerror = () => {
      setToast('Unable to upload photo right now');
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <div className="page-grid app-standard-page">
      <section className="page-panel page-hero">
        <div className="theme-pill">Profile</div>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-xl font-semibold text-white">
              {avatarDataUrl ? (
                <img src={avatarDataUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div>
              <p className="setting-label">Your account</p>
              <h2 className="setting-title">{accountName}</h2>
              <p className="setting-detail">{accountEmail}</p>
            </div>
          </div>
          <button type="button" className="button button-ghost button-icon" onClick={openPhotoPicker}><Camera size={16} /> Update photo</button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelected} className="hidden" />
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
                <button type="button" className={`toggle-button ${isDarkMode ? 'toggle-button-on' : ''}`} onClick={handleThemeToggle} aria-label="Toggle dark mode" aria-pressed={isDarkMode}>
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>
            <div className="setting-card">
              <div className="panel-actions">
                <p className="setting-title">Milestone notifications</p>
                <button type="button" className={`toggle-button ${milestoneAlerts ? 'toggle-button-on' : ''}`} onClick={handleMilestoneToggle} aria-label="Toggle milestone notifications" aria-pressed={milestoneAlerts}>
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-panel profile-coach-card">
        <div className="panel-actions">
          <Sparkles size={18} /> DreamNest coaching
        </div>
        <p className="setting-detail">You are currently pacing well toward your top three goals. Consider adding a small automated transfer this month to stay ahead of schedule.</p>
      </section>

      <Toast message={toast} open={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
};

export default ProfilePage;
