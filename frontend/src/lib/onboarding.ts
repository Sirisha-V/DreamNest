export const ONBOARDING_PENDING_KEY = 'dreamnest:onboarding:pending';
export const ONBOARDING_NAME_KEY = 'dreamnest:onboarding:name';

const ACTIVE_USER_HINT_KEY = 'dreamnest_active_user_hint';

const normalizeScope = (scope?: string | null) => scope?.trim().toLowerCase() || '';

const getActiveScope = (scope?: string | null) => normalizeScope(scope) || normalizeScope(localStorage.getItem(ACTIVE_USER_HINT_KEY));

const getScopedKey = (baseKey: string, scope?: string | null) => {
  const activeScope = getActiveScope(scope);
  return activeScope ? `${baseKey}:${activeScope}` : baseKey;
};

export const markOnboardingPending = (name: string, scope?: string) => {
  const pendingKey = getScopedKey(ONBOARDING_PENDING_KEY, scope);
  const nameKey = getScopedKey(ONBOARDING_NAME_KEY, scope);
  localStorage.setItem(pendingKey, '1');
  localStorage.setItem(nameKey, name.trim() || 'Nana');
};

export const clearOnboardingPending = (scope?: string) => {
  localStorage.removeItem(getScopedKey(ONBOARDING_PENDING_KEY, scope));
  localStorage.removeItem(ONBOARDING_PENDING_KEY);
};

export const getOnboardingPending = (scope?: string) => (
  localStorage.getItem(getScopedKey(ONBOARDING_PENDING_KEY, scope)) === '1'
  || localStorage.getItem(ONBOARDING_PENDING_KEY) === '1'
);

export const getOnboardingName = (scope?: string) => (
  localStorage.getItem(getScopedKey(ONBOARDING_NAME_KEY, scope))
  || localStorage.getItem(ONBOARDING_NAME_KEY)
  || 'Nana'
);
