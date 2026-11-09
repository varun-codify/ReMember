// Cron target for email reminders (Vercel Cron / external scheduler).
//
// Add a cron entry in vercel.json to call this on a schedule, e.g.:
//   "crons": [{ "path": "/api/cron/reminders", "schedule": "0 */6 * * *" }]
// (that cron schedule runs every 6 hours; Vercel Cron requires a supported plan).
//
// CRON_SECRET is REQUIRED — without it this endpoint refuses to run, so
// strangers can't trigger reminder scans (and emails) on your behalf.
// Callers must send `Authorization: Bearer <CRON_SECRET>`.

const connectToDatabase = require('../_utils/db');
const { scanAndSendReminders } = require('../../server/services/reminderService');

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ success: false, message: 'Cron not configured (CRON_SECRET missing)' });
  }
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    await connectToDatabase();
    const result = await scanAndSendReminders();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[cron/reminders] error:', error.message);
    res.status(500).json({ success: false, message: 'Reminder scan failed' });
  }
};
