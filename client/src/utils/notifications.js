import api from '../api';

// Web Push helpers. The server must expose VAPID keys (VAPID_PUBLIC_KEY /
// VAPID_PRIVATE_KEY) for push to be available.

export const notificationsSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export const getPermission = () =>
  typeof Notification !== 'undefined' ? Notification.permission : 'denied';

/**
 * Fetch server push capability + VAPID public key.
 */
export const getPushConfig = async () => {
  try {
    const res = await api.get('/reminders/config');
    return res.data.data || { pushEnabled: false, vapidPublicKey: null };
  } catch {
    return { pushEnabled: false, vapidPublicKey: null };
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// `navigator.serviceWorker.ready` never resolves when no service worker is
// registered (e.g. development mode) — resolve with null after a timeout so
// the UI can show a graceful state instead of hanging forever.
const waitForRegistration = (timeout = 8000) =>
  Promise.race([
    navigator.serviceWorker.ready,
    new Promise((resolve) => setTimeout(() => resolve(null), timeout))
  ]);

/**
 * Request permission and register this browser for push notifications.
 * Returns { ok, reason?, subscription? }.
 */
export async function enableNotifications() {
  if (!notificationsSupported()) return { ok: false, reason: 'unsupported' };

  const config = await getPushConfig();
  if (!config.pushEnabled || !config.vapidPublicKey) {
    return { ok: false, reason: 'unavailable' };
  }

  let permission = getPermission();
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  if (permission !== 'granted') return { ok: false, reason: permission };

  try {
    const registration = await waitForRegistration();
    if (!registration) return { ok: false, reason: 'unsupported' };
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.vapidPublicKey)
      });
    }

    await api.post('/reminders', {
      action: 'subscribe',
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys
    });

    return { ok: true, subscription };
  } catch (error) {
    return { ok: false, reason: 'error', error };
  }
}

export async function disableNotifications() {
  if (!notificationsSupported()) return { ok: true };

  try {
    const registration = await waitForRegistration();
    const subscription = registration ? await registration.pushManager.getSubscription() : null;
    if (subscription) {
      try {
        await api.post('/reminders', {
          action: 'unsubscribe',
          endpoint: subscription.endpoint
        });
      } catch {
        // server may be unreachable — still unsubscribe locally
      }
      await subscription.unsubscribe();
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
