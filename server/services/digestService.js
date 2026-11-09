const Video = require('../models/Video');
const Website = require('../models/Website');
const Note = require('../models/Note');
const User = require('../models/User');
const { sendEmail } = require('./emailService');
const aiService = require('./aiService');
const { escapeHtml } = require('../utils/security');

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/**
 * Build a weekly digest for one user:
 *  - stats for the last 7 days (videos completed, notes created, items saved)
 *  - topics learned (top tags this week)
 *  - forgotten resources (stale items not reviewed recently, top 5)
 *  - a suggested next topic (AI-suggested when enabled, else top tag)
 */
async function buildDigest(userId) {
  const weekStart = new Date(Date.now() - WEEK_MS);

  const [weekVideos, weekWebsites, weekNotes, staleVideos, staleWebsites, staleNotes] = await Promise.all([
    Video.find({ userId, createdAt: { $gte: weekStart } }).select('tags watchStatus').lean(),
    Website.find({ userId, createdAt: { $gte: weekStart } }).select('tags').lean(),
    Note.find({ userId, createdAt: { $gte: weekStart } }).select('tags').lean(),
    Video.find({ userId, watchStatus: { $ne: 'completed' } }).select('title lastWatchedAt createdAt').lean(),
    Website.find({ userId, readingProgress: { $lt: 100 } }).select('name lastVisited createdAt').lean(),
    Note.find({ userId }).select('title updatedAt').lean()
  ]);

  const videosSaved = weekVideos.length;
  const videosCompleted = weekVideos.filter((v) => v.watchStatus === 'completed').length;
  const websitesSaved = weekWebsites.length;
  const notesCreated = weekNotes.length;

  // Topics learned this week (top tags)
  const tagCounts = {};
  [...weekVideos, ...weekWebsites, ...weekNotes].forEach((item) =>
    (item.tags || []).forEach((t) => {
      const key = String(t).toLowerCase();
      tagCounts[key] = (tagCounts[key] || 0) + 1;
    })
  );
  const topTopics = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);

  // Forgotten resources: stale, sorted by days since last activity
  const now = Date.now();
  const stale = [];
  staleVideos.forEach((v) => {
    const last = v.lastWatchedAt || v.createdAt;
    stale.push({ title: v.title, days: Math.max(0, Math.floor((now - new Date(last).getTime()) / DAY_MS)) });
  });
  staleWebsites.forEach((w) => {
    const last = w.lastVisited || w.createdAt;
    stale.push({ title: w.name, days: Math.max(0, Math.floor((now - new Date(last).getTime()) / DAY_MS)) });
  });
  staleNotes.forEach((n) => {
    stale.push({ title: n.title, days: Math.max(0, Math.floor((now - new Date(n.updatedAt).getTime()) / DAY_MS)) });
  });
  stale.sort((a, b) => b.days - a.days);
  const forgotten = stale.slice(0, 5).filter((s) => s.days >= 1);

  // Suggested next topic
  let suggestedTopic = topTopics[0] || null;
  if (suggestedTopic && aiService.isEnabled()) {
    try {
      const suggestions = await aiService.suggestTopics({ topic: suggestedTopic });
      if (suggestions && suggestions.length) suggestedTopic = suggestions[0].topic;
    } catch (e) {
      /* keep the tag-based topic */
    }
  }

  return { videosSaved, videosCompleted, websitesSaved, notesCreated, topTopics, forgotten, suggestedTopic };
}

const fmtDays = (days) => (days === 1 ? '1 day' : `${days} days`);

const buildDigestHtml = (d) => {
  const stat = (label, value, bg) =>
    `<td style="padding:12px 16px;border:3px solid #2c1810;border-radius:12px;background:${bg};box-shadow:3px 3px 0 #2c1810;text-align:center">
      <div style="font-size:26px;font-weight:800;color:#292827">${value}</div>
      <div style="font-size:11px;font-weight:700;color:#6b4d3c;text-transform:uppercase">${label}</div>
    </td>`;

  const topics = d.topTopics.length
    ? `<p style="color:#6b4d3c">You were exploring <strong>${d.topTopics.map(escapeHtml).join(', ')}</strong>.</p>`
    : '';

  const forgotten = d.forgotten.length
    ? `<ul style="list-style:none;padding:0">${d.forgotten
        .map((f) => `<li style="margin-bottom:8px">📌 ${escapeHtml(f.title)} <span style="color:#9a8a7a">— not reviewed in ${fmtDays(f.days)}</span></li>`)
        .join('')}</ul>`
    : '<p style="color:#9a8a7a">Nothing is gathering dust. ✨</p>';

  const suggested = d.suggestedTopic
    ? `<div style="margin-top:20px;padding:14px 18px;border:3px solid #2c1810;border-radius:12px;background:#feca57;box-shadow:3px 3px 0 #2c1810">
        <div style="font-weight:800;color:#292827">🎯 Suggested next topic</div>
        <div style="color:#292827">${escapeHtml(d.suggestedTopic)}</div>
      </div>`
    : '';

  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#292827;max-width:520px">
      <h2 style="margin-bottom:4px">ReMember — Your week in review</h2>
      <p style="color:#6b4d3c">Here's what your memory collected this week:</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:8px;margin:16px 0">
        <tr>
          ${stat('Videos done', d.videosCompleted, '#43e97b')}
          ${stat('Notes written', d.notesCreated, '#feca57')}
          ${stat('Items saved', d.videosSaved + d.websitesSaved + d.notesCreated, '#4facfe')}
        </tr>
      </table>
      ${topics}
      <h3 style="margin-top:24px;margin-bottom:8px">🕰 You forgot these</h3>
      ${forgotten}
      ${suggested}
      <p style="margin-top:24px;font-size:13px;color:#9a8a7a">
        Open ReMember to review, quiz yourself, or ask the AI assistant: <a href="${process.env.APP_URL || 'http://localhost:3000'}">${process.env.APP_URL || 'http://localhost:3000'}</a>
      </p>
    </div>`;
};

/**
 * Send the weekly digest to every user with saved items, once per week.
 * No-op unless RESEND_API_KEY is configured.
 */
async function sendWeeklyDigests() {
  if (!process.env.RESEND_API_KEY) {
    return { sent: 0, skipped: true };
  }

  const users = await User.find({});
  const now = Date.now();
  let sent = 0;

  for (const user of users) {
    const last = user.weeklyDigestSentAt ? new Date(user.weeklyDigestSentAt).getTime() : 0;
    // Gate on a full 7 days (the scan runs every 6 hours) so users get at most
    // one "weekly" digest per calendar-ish week — a shorter gate could send two
    // within 7 days (day 0 + day 6).
    if (now - last < 7 * DAY_MS) continue;

    const [hasVideos, hasWebsites, hasNotes] = await Promise.all([
      Video.countDocuments({ userId: user._id }),
      Website.countDocuments({ userId: user._id }),
      Note.countDocuments({ userId: user._id })
    ]);
    if (hasVideos + hasWebsites + hasNotes === 0) continue;

    try {
      const digest = await buildDigest(user._id);
      const result = await sendEmail({
        to: user.email,
        subject: 'ReMember: Your week in review',
        html: buildDigestHtml(digest)
      });
      if (result.sent) {
        user.weeklyDigestSentAt = new Date();
        await user.save();
        sent += 1;
      }
    } catch (error) {
      console.error('[digest] failed for', user.email, error.message);
    }
  }

  return { sent, skipped: false };
}

module.exports = { buildDigest, sendWeeklyDigests };
