import { useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Camera } from 'lucide-react';
import Toast from '../components/Toast';
import { useDreams } from '../context/DreamContext';

const AVATAR_STORAGE_KEY = 'dreamnest-avatar-data';
const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;
const ACTIVE_USER_HINT_KEY = 'dreamnest_active_user_hint';

const toDisplayNameFromEmail = (email: string) => {
  const localPart = email.split('@')[0] ?? '';
  if (!localPart) {
    return '';
  }

  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((token) => token[0].toUpperCase() + token.slice(1))
    .join(' ');
};

const ProfilePage = () => {
  const { dashboard } = useDreams();
  const [avatarDataUrl, setAvatarDataUrl] = useState(() => window.localStorage.getItem(AVATAR_STORAGE_KEY) ?? '');
  const [toast, setToast] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sessionEmail = (window.localStorage.getItem(ACTIVE_USER_HINT_KEY) ?? '').trim().toLowerCase();

  const accountName = useMemo(() => {
    const dashboardName = (dashboard.user ?? '').trim();
    const normalizedDashboardName = dashboardName.toLowerCase();
    const genericDashboardNames = new Set(['dreamer', 'nana', 'user']);

    if (dashboardName && !genericDashboardNames.has(normalizedDashboardName)) {
      return dashboardName;
    }

    return toDisplayNameFromEmail(sessionEmail) || 'User';
  }, [dashboard.user, sessionEmail]);

  const accountEmail = sessionEmail || 'No email available';

  const initials = useMemo(() => {
    const tokens = accountName.trim().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      return 'U';
    }

    const first = tokens[0][0] ?? '';
    const second = tokens[1]?.[0] ?? '';
    return `${first}${second}`.toUpperCase();
  }, [accountName]);

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
        <p className="setting-detail">Showing your login info only.</p>
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

      <Toast message={toast} open={Boolean(toast)} onClose={() => setToast('')} />
    </div>
  );
};

export default ProfilePage;
