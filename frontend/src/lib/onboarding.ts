export const ONBOARDING_PENDING_KEY = 'dreamnest:onboarding:pending';
export const ONBOARDING_NAME_KEY = 'dreamnest:onboarding:name';

export const markOnboardingPending = (name: string) => {
  localStorage.setItem(ONBOARDING_PENDING_KEY, '1');
  localStorage.setItem(ONBOARDING_NAME_KEY, name.trim() || 'Nana');
};

export const clearOnboardingPending = () => {
  localStorage.removeItem(ONBOARDING_PENDING_KEY);
};

export const getOnboardingPending = () => localStorage.getItem(ONBOARDING_PENDING_KEY) === '1';

export const getOnboardingName = () => localStorage.getItem(ONBOARDING_NAME_KEY) || 'Nana';
