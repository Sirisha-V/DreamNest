import { useCallback, useEffect } from 'react';

const THEME_STORAGE_KEY = 'dreamnest-theme';

type ThemeMode = 'light';

const applyTheme = () => {
  document.documentElement.classList.remove('theme-dark');
};

export const useThemePreference = () => {
  useEffect(() => {
    applyTheme();
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
  }, []);

  const setTheme = useCallback((_nextTheme: ThemeMode) => {
    applyTheme();
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
  }, []);

  const toggleTheme = useCallback(() => {
    applyTheme();
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
  }, []);

  return {
    theme: 'light' as ThemeMode,
    isDarkMode: false,
    setTheme,
    toggleTheme,
  };
};
