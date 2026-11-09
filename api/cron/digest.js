// Cron target for the weekly memory digest (Vercel Cron / external scheduler).
//
// Add a cron entry in vercel.json to call this weekly, e.g.:
//   "crons": [{ "path": "/api/cron/digest", "schedule": "0 8 * * 1" }]
// (Mondays 08:00 UTC; Vercel Cron requires a supported plan.)
//
// CRON_SECRET is REQUIRED — callers must send `Authorization: Bearer <CRON_SECRET>`.

const connectToDatabase = require('../_utils/db');
const { sendWeeklyDigests } = require('../../server/services/digestService');

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
    const result = await sendWeeklyDigests();
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[cron/digest] error:', error.message);
    res.status(500).json({ success: false, message: 'Digest run failed' });
  }
};
