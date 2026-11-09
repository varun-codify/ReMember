const Task = require('../models/Task');
const User = require('../models/User');
const { sendEmail } = require('./emailService');
const { escapeHtml } = require('../utils/security');
const { isConfigured: isPushConfigured, sendToUser } = require('./pushService');
const { sendWeeklyDigests } = require('./digestService');

const SCHEDULE_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const buildDigestHtml = (tasks) => {
  const rows = tasks
    .map((t) => {
      const due = t.dueDate ? `<br/><small style="color:#6b4d3c">Due: ${fmtDate(t.dueDate)}</small>` : '';
      // escapeHtml prevents HTML/attribute injection via task titles
      return `<li style="margin-bottom:12px"><strong>${escapeHtml(t.title)}</strong>${due}</li>`;
    })
    .join('');
  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#292827;max-width:480px">
      <h2 style="margin-bottom:4px">ReMember reminders</h2>
      <p style="color:#6b4d3c">You have ${tasks.length} task${tasks.length > 1 ? 's' : ''} due now or soon:</p>
      <ul style="list-style:none;padding:0">${rows}</ul>
      <p style="margin-top:24px;font-size:13px;color:#9a8a7a">Log in to mark them done: <a href="${process.env.APP_URL || 'http://localhost:3000'}">${process.env.APP_URL || 'http://localhost:3000'}</a></p>
    </div>`;
};

/**
 * Find pending tasks due by end of today (including overdue) and remind each
 * affected user — by email (Resend) and/or browser push (Web Push).
 * Both channels are config-gated, so this is a no-op until the relevant env
 * vars are set. Skips users inactive for 14+ days.
 */
async function scanAndSendReminders() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  // Dedupe: only remind about tasks that were never reminded, or were last
  // reminded on a previous day — at most one reminder per task per day.
  const dueTasks = await Task.find({
    status: 'pending',
    dueDate: { $lte: endOfDay },
    $or: [{ reminderSentAt: null }, { reminderSentAt: { $lt: startOfDay } }]
  }).sort({ dueDate: 1 });

  if (dueTasks.length === 0) {
    return { sent: 0, pushSent: 0, skipped: false };
  }

  const emailsEnabled = !!process.env.RESEND_API_KEY;
  const pushesEnabled = isPushConfigured();

  // Nothing to do (and nothing to stamp) when no reminder channel is enabled
  if (!emailsEnabled && !pushesEnabled) {
    return { sent: 0, pushSent: 0, skipped: true };
  }

  // Group by user
  const byUser = {};
  for (const task of dueTasks) {
    const key = String(task.userId);
    if (!byUser[key]) byUser[key] = [];
    byUser[key].push(task);
  }

  // Only remind active users (logged in within 14 days, or never logged in yet)
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const users = await User.find({
    _id: { $in: Object.keys(byUser) },
    $or: [{ lastLogin: { $gte: cutoff } }, { lastLogin: null }]
  });

  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  let sent = 0;
  let pushSent = 0;

  for (const user of users) {
    const tasks = byUser[String(user._id)];
    if (!tasks || tasks.length === 0) continue;

    if (emailsEnabled) {
      const result = await sendEmail({
        to: user.email,
        subject: `ReMember: ${tasks.length} task${tasks.length > 1 ? 's' : ''} due`,
        html: buildDigestHtml(tasks)
      });
      if (result.sent) sent += 1;
    }

    if (pushesEnabled && user.pushSubscriptions && user.pushSubscriptions.length > 0) {
      const result = await sendToUser(user, {
        title: '⏰ ReMember reminders',
        body: `${tasks.length} task${tasks.length > 1 ? 's' : ''} due now or soon`,
        url: `${appUrl}/tasks`
      });
      pushSent += result.sent;
    }
  }

  // Mark reminded so the same tasks aren't reminded again today (only when
  // something was actually delivered)
  if (sent + pushSent > 0) {
    await Task.updateMany(
      { _id: { $in: dueTasks.map((t) => t._id) } },
      { $set: { reminderSentAt: new Date() } }
    );
  }

  return { sent, pushSent, skipped: false };
}

/**
 * Start the periodic reminder scheduler (Express server only).
 * The Vercel serverless deployment uses api/cron/reminders.js instead.
 */
function startReminderScheduler() {
  if (!process.env.RESEND_API_KEY) {
    console.log('[reminders] email reminders disabled — set RESEND_API_KEY to enable');
  }
  if (!isPushConfigured()) {
    console.log('[reminders] push notifications disabled — set VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY to enable');
  }
  const run = () => {
    scanAndSendReminders().catch((err) => console.error('[reminders] scan error:', err.message));
  };
  // First run shortly after startup, then on an interval
  setTimeout(run, 30 * 1000);
  setInterval(run, SCHEDULE_INTERVAL_MS);
  console.log('[reminders] scheduler started (every 6h)');

  // Weekly memory digest (Resend + optional AI next-topic suggestion)
  const WEEKLY_MS = 7 * 24 * 60 * 60 * 1000;
  const runDigest = () => {
    sendWeeklyDigests().catch((err) => console.error('[digest] error:', err.message));
  };
  setTimeout(runDigest, 30 * 60 * 1000); // first digest ~30 min after start
  setInterval(runDigest, WEEKLY_MS);
  if (!process.env.RESEND_API_KEY) {
    console.log('[reminders] weekly digest disabled — set RESEND_API_KEY to enable');
  } else {
    console.log('[reminders] weekly digest scheduled (every 7d)');
  }
}

module.exports = { scanAndSendReminders, startReminderScheduler };
