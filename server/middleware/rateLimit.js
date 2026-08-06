/**
 * Simple in-memory fixed-window rate limiter.
 *
 * Suitable for single-process deployments. For multi-instance production
 * deployments, replace with a shared store (e.g. Redis) or a managed
 * rate-limiting service.
 */
const rateLimit = ({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests, please try again later.',
} = {}) => {
  const hits = new Map();

  const cleanup = () => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now - entry.resetAt >= windowMs) hits.delete(key);
    }
  };

  return (req, res, next) => {
    const key = `${req.ip || req.socket.remoteAddress}:${req.originalUrl || req.url}`;
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ success: false, message });
    }

    if (hits.size > 1000) cleanup();
    next();
  };
};

module.exports = rateLimit;
