/**
 * Express security middleware:
 *  - sanitizeRequest : deep-strip NoSQL injection operators from body/query/params
 *  - validateOrigin  : CSRF defense-in-depth — reject state-changing requests
 *                      from origins that are not the client (or same-origin)
 *  - globalLimiter   : per-IP cap across the whole API (abuse/DoS mitigation)
 *  - aiLimiter       : tighter per-IP cap on AI endpoints (external API cost)
 */
const rateLimit = require('./rateLimit');
const { sanitizeInput } = require('../utils/security');

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

function clientOrigins() {
  // Default matches the cors() fallback in server.js so the dev flow
  // (client :3000 → API :5000) works even without CLIENT_URL set.
  return (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Strip MongoDB operators (`$gt`, `$where`, dotted keys) from all inputs. */
function sanitizeRequest(req, res, next) {
  if (req.body && typeof req.body === 'object') sanitizeInput(req.body);
  if (req.query && typeof req.query === 'object') sanitizeInput(req.query);
  if (req.params && typeof req.params === 'object') sanitizeInput(req.params);
  next();
}

/**
 * CSRF defense-in-depth. This API authenticates with Bearer tokens (not
 * cookies), so classic CSRF doesn't apply — but this still blocks cross-origin
 * state-changing requests (e.g. a malicious page <form>-POSTing to the API,
 * or any future cookie-based session). Requests without an Origin header
 * (curl, mobile, server-to-server) are allowed.
 */
function validateOrigin(req, res, next) {
  if (SAFE_METHODS.includes(req.method)) return next();

  const origin = req.headers.origin;
  if (!origin) return next();

  const normalized = origin.toLowerCase();
  const sameOrigin =
    normalized === `http://${req.headers.host}` ||
    normalized === `https://${req.headers.host}`;

  if (sameOrigin || clientOrigins().includes(normalized)) return next();

  return res.status(403).json({
    success: false,
    message: 'Cross-origin request blocked.'
  });
}

const byIp = (req) => req.ip || req.socket.remoteAddress || 'unknown';

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  keyGenerator: byIp,
  message: 'Too many requests, please try again later.'
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyGenerator: byIp,
  message: 'AI request limit reached. Please try again later.'
});

module.exports = { sanitizeRequest, validateOrigin, globalLimiter, aiLimiter, clientOrigins };
