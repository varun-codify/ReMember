const webpush = require('web-push');

/**
 * Web Push helper. Gated on VAPID env vars — a no-op until configured:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto: or https:)
 *
 * Generate keys with:  npx web-push generate-vapid-keys --json
 */
const isConfigured = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

let client = null;

function getClient() {
  if (client) return client;
  if (!isConfigured()) return null;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@remember.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  client = webpush;
  return client;
}

/**
 * Send a push notification to every subscription stored on a user document.
 * Expired subscriptions (410/404) are pruned automatically.
 */
async function sendToUser(user, { title, body, url }) {
  const wp = getClient();
  if (!wp || !user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
    return { sent: 0, removed: 0 };
  }

  const payload = JSON.stringify({ title, body, url });
  let sent = 0;
  let removed = 0;

  for (const sub of user.pushSubscriptions) {
    try {
      await wp.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
      sent += 1;
    } catch (error) {
      // 404/410: the subscription is gone (uninstalled app, expired key)
      if (error.statusCode === 404 || error.statusCode === 410) {
        user.pushSubscriptions = user.pushSubscriptions.filter((s) => s.endpoint !== sub.endpoint);
        removed += 1;
      } else {
        console.error('[push] send failed:', error.statusCode || error.message);
      }
    }
  }

  if (removed > 0) {
    await user.save().catch(() => {});
  }

  return { sent, removed };
}

module.exports = { isConfigured, sendToUser };
