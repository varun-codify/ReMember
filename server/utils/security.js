/**
 * Shared input sanitization & validation helpers.
 *
 * Used by BOTH the Express server (server/) and the Vercel serverless layer
 * (api/, which requires ../../server/...). Keep this file dependency-free so
 * it can load anywhere.
 */

/**
 * Deep-strip NoSQL injection operators from an object graph (req.body,
 * req.query, req.params).
 *
 * Mongoose/Express-style "query injection" works by smuggling MongoDB
 * operators (`$gt`, `$where`, ...) or dotted keys (`a.b`) into JSON/query
 * strings that later get interpolated into find() filters. This recursively
 * deletes any key starting with `$` or containing `.`. Mutates in place.
 */
function sanitizeInput(value) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) {
      value[i] = sanitizeInput(value[i]);
    }
    return value;
  }

  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete value[key];
      } else {
        value[key] = sanitizeInput(value[key]);
      }
    }
    return value;
  }

  return value;
}

// C0 control characters (keeps \t \n \r for formatting).
// CONTROL_CHARS has the /g flag for .replace() (String.replace resets
// lastIndex each call). URL_CONTROL_CHARS deliberately has NO /g flag —
// .test() on a global regex carries lastIndex across calls, which could miss
// chars in later strings.
//
// URL_CONTROL_CHARS is stricter than CONTROL_CHARS: URLs must contain no
// whitespace or control characters at all (the WHATWG URL parser silently
// strips \t and \n, so a value like "https://a\n.com" would otherwise parse
// as a valid URL and slip through).
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const URL_CONTROL_CHARS = /[\u0000-\u0020\u007F]/;

/**
 * Coerce to a safe string: strips control characters, trims, and caps length.
 * Content is still rendered as text by React, so HTML is NOT stripped here —
 * escaping happens at render time (and in email templates via escapeHtml).
 */
function sanitizeText(value, { maxLength = 5000 } = {}) {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL_CHARS, '').trim().slice(0, maxLength);
}

/**
 * Coerce to a safe, deduplicated tag array of short strings.
 */
function sanitizeTags(tags, { max = 20, maxLength = 40 } = {}) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  const out = [];
  for (const tag of tags) {
    const clean = sanitizeText(tag, { maxLength });
    if (!clean || seen.has(clean.toLowerCase())) continue;
    seen.add(clean.toLowerCase());
    out.push(clean);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Allow only http(s) URLs. Blocks javascript:, data:, vbscript:, file:, and
 * malformed/control-char URLs that could be smuggled into <a href> / <img src>.
 */
function isSafeUrl(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  if (URL_CONTROL_CHARS.test(trimmed)) return false;

  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Escape a value for safe interpolation into an HTML email template
 * (prevents HTML/attribute injection via user-controlled titles/names).
 */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { sanitizeInput, sanitizeText, sanitizeTags, isSafeUrl, escapeHtml };
