/**
 * Returns the given URL only if it is a safe http(s) URL, otherwise null.
 *
 * Guards against stored-XSS via saved links: a value like
 * `javascript:alert(document.cookie)` rendered into an <a href> would execute
 * in the app's origin when clicked. Always pass saved URLs through this before
 * rendering them as links or image sources.
 */
const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const DOMAIN_LIKE = /^[a-z0-9-]+(\.[a-z0-9-]+)+([/?:].*)?$/i;

export function safeExternalUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  let candidate = value.trim();

  // Legacy data may have been saved without a scheme ("example.com/path").
  // Normalize it rather than rendering it as a dead link. Strings that look
  // like a scheme (e.g. "javascript:") are left untouched and rejected below.
  if (!HAS_SCHEME.test(candidate) && DOMAIN_LIKE.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const url = new URL(candidate);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
  } catch (e) {
    /* not a parseable URL */
  }
  return null;
}
