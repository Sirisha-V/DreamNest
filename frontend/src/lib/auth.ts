const SESSION_TOKEN_KEY = 'dreamnest_token';
const ACTIVE_USER_HINT_KEY = 'dreamnest_active_user_hint';
const LOCAL_ACCOUNT_KEY = 'dreamnest_local_accounts_v1';

const normalizeValue = (value: string | null | undefined) => value?.trim().toLowerCase() || '';

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  return atob(`${normalized}${padding}`);
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const payloadRaw = base64UrlDecode(parts[1]);
    return JSON.parse(payloadRaw) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const isLegacyDreamNestToken = (token: string) => {
  try {
    const decoded = base64UrlDecode(token);
    if (!decoded.startsWith('dreamnest:')) {
      return false;
    }

    return normalizeValue(decoded.replace('dreamnest:', '')).includes('@');
  } catch {
    return false;
  }
};

export const getStoredToken = () => localStorage.getItem(SESSION_TOKEN_KEY);

export const storeSession = (token: string, email?: string) => {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
  if (email) {
    localStorage.setItem(ACTIVE_USER_HINT_KEY, email.trim().toLowerCase());
  }
};

export const clearStoredSession = () => {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(ACTIVE_USER_HINT_KEY);
};

const readLocalAccounts = (): Record<string, string> => {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNT_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const writeLocalAccounts = (accounts: Record<string, string>) => {
  localStorage.setItem(LOCAL_ACCOUNT_KEY, JSON.stringify(accounts));
};

export const storeLocalCredential = (email: string, password: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return;
  }

  const accounts = readLocalAccounts();
  accounts[normalizedEmail] = password;
  writeLocalAccounts(accounts);
};

export const getLocalCredential = (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    return '';
  }

  const accounts = readLocalAccounts();
  return accounts[normalizedEmail] || '';
};

export const isStoredSessionValid = () => {
  const token = getStoredToken();
  if (!token) {
    return false;
  }

  if (isLegacyDreamNestToken(token)) {
    return true;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return false;
  }

  if (typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()) {
    return false;
  }

  const identity = [payload.email, payload.preferred_username, payload.upn, payload.sub, payload.user_id, payload.uid, payload.id]
    .find((candidate) => typeof candidate === 'string' || typeof candidate === 'number');

  return identity !== undefined && identity !== null && String(identity).trim().length > 0;
};

export const validatePassword = (password: string) => {
  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return '';
};