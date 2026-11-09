const { sanitizeInput } = require('../../server/utils/security');

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

// ---------------------------------------------------------------------------
// Per-instance in-memory rate limiting.
// NOTE: on serverless each warm instance carries its own counter, so this is
// best-effort per instance. It still stops single-instance bursts; for hard
// guarantees at scale enable Vercel's native rate limiting (see DEPLOYMENT.md).
// ---------------------------------------------------------------------------
const hits = new Map();
const MAX_ENTRIES = 10000;

function checkRateLimit(req, { windowMs, max }) {
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
        || (req.socket && req.socket.remoteAddress) || 'unknown';
    // Key by path without the query string so ?x=1&x=2 rotation can't dodge
    // the limit.
    const path = (req.url || '').split('?')[0];
    const key = `${ip}:${req.method}:${path}`;
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || now >= entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(key, entry);
    }
    entry.count += 1;

    if (hits.size > MAX_ENTRIES) {
        for (const [k, e] of hits) {
            if (now - e.resetAt >= windowMs) hits.delete(k);
        }
    }

    if (entry.count > max) {
        return { limited: true, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
    }
    return { limited: false };
}

function rateRuleFor(req) {
    const path = req.url || '';
    if (path.includes('/api/auth/login')) return { windowMs: 15 * 60 * 1000, max: 20 };
    if (path.includes('/api/auth/register')) return { windowMs: 60 * 60 * 1000, max: 10 };
    if (path.includes('/api/ai/')) return { windowMs: 15 * 60 * 1000, max: 60 };
    return { windowMs: 15 * 60 * 1000, max: 600 };
}

const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
};

const allowCors = fn => async (req, res) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin.toLowerCase())) {
        // Explicitly trusted origin -> reflect it (allowed with credentials)
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
        // No credentials are sent by this API (Bearer tokens, not cookies),
        // so a wildcard origin is safe here and must NOT be combined with
        // Access-Control-Allow-Credentials (browsers reject that combo).
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Vault-Passkey'
    );

    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => res.setHeader(key, value));

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // CSRF defense-in-depth: reject state-changing requests from origins that
    // are neither the configured client(s) nor same-origin. Requests without an
    // Origin header (curl, mobile apps, server-to-server) are allowed.
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        const reqOrigin = (req.headers.origin || '').toLowerCase();
        if (reqOrigin) {
            const sameOrigin =
                reqOrigin === `http://${req.headers.host}` ||
                reqOrigin === `https://${req.headers.host}`;
            if (!sameOrigin && !allowedOrigins.includes(reqOrigin)) {
                res.status(403).json({ success: false, message: 'Cross-origin request blocked.' });
                return;
            }
        }
    }

    // Rate limiting (per warm instance — see note above)
    const limited = checkRateLimit(req, rateRuleFor(req));
    if (limited.limited) {
        res.setHeader('Retry-After', String(limited.retryAfter));
        res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
        return;
    }

    // NoSQL injection: strip $ and . keys from body and query before handlers
    // build Mongoose filters from them.
    if (req.body && typeof req.body === 'object') sanitizeInput(req.body);
    if (req.query && typeof req.query === 'object') sanitizeInput(req.query);

    return await fn(req, res);
};

module.exports = allowCors;
