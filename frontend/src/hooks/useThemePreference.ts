import { useCallback, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'dreamnest-theme';

type ThemeMode = 'light' | 'dark';

const getInitialTheme = (): ThemeMode => {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: ThemeMode) => {
  document.documentElement.classList.toggle('theme-dark', theme === 'dark');
};

export const useThemePreference = () => {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }, []);

  return {
    theme,
    isDarkMode: theme === 'dark',
    setTheme,
    toggleTheme,
  };
};
