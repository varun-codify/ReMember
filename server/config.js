/**
 * Centralized environment access (Express server layer).
 * The Vercel serverless layer has a mirror at api/_utils/env.js — keep them
 * in sync.
 *
 * In production, secrets MUST come from the environment — a hard error is
 * thrown rather than silently falling back to a development default.
 */

const getRequired = (key, devDefault) => {
  const value = process.env[key];
  if (value) return value;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return devDefault;
};

const jwtSecret = () => getRequired('JWT_SECRET', 'dev_jwt_secret_change_me');
const encryptionKey = () => getRequired('ENCRYPTION_KEY', 'dev_encryption_key_change_me');

module.exports = { getRequired, jwtSecret, encryptionKey };
