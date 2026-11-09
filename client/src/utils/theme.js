// Light/dark theme helpers. The actual attribute is set before first paint by
// an inline script in public/index.html; these helpers are for runtime toggles.

const THEME_KEY = 'remember-theme';

export const getTheme = () => document.documentElement.getAttribute('data-theme') || 'light';

export const isDark = () => getTheme() === 'dark';

export const applyTheme = (theme) => {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  document.documentElement.style.colorScheme = next;
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) {
    /* storage unavailable */
  }
};

export const toggleTheme = () => {
  const next = isDark() ? 'light' : 'dark';
  applyTheme(next);
  return next;
};
