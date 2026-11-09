const axios = require('axios');

/**
 * Transactional email via Resend (https://resend.com).
 *
 * Disabled until RESEND_API_KEY is configured — the app keeps working
 * without it (in-app reminders still function).
 *
 * Required env vars to enable:
 *   RESEND_API_KEY  - API key from https://resend.com/api-keys
 *   EMAIL_FROM      - sender address (e.g. 'ReMember <noreply@yourdomain.com>').
 *                     On Resend's free plan you can only send from the
 *                     onboarding address (onboarding@resend.dev).
 */
async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'ReMember <onboarding@resend.dev>';

  if (!apiKey) {
    console.log('[email] RESEND_API_KEY not set — skipping email');
    return { sent: false, reason: 'not-configured' };
  }

  try {
    await axios.post(
      'https://api.resend.com/emails',
      { from, to, subject, html, text },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    console.log(`[email] sent reminder to ${to}`);
    return { sent: true };
  } catch (error) {
    console.error('[email] send failed:', error.response?.data || error.message);
    return { sent: false, reason: 'error' };
  }
}

module.exports = { sendEmail };
