// Apply the saved theme before first paint to avoid a flash of the wrong theme.
// Kept as an external file so index.html has no inline scripts, which lets the
// Content-Security-Policy use `script-src 'self'` (no 'unsafe-inline').
(function () {
  try {
    var saved = localStorage.getItem('remember-theme');
    var prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
