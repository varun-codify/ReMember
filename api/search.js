const connectToDatabase = require('./_utils/db');
const allowCors = require('./_utils/cors');
const handleError = require('./_utils/errorHandler');
const authMiddleware = require('./_middleware/auth');
const Task = require('../server/models/Task');
const Video = require('../server/models/Video');
const Website = require('../server/models/Website');
const Password = require('../server/models/Password');
const Note = require('../server/models/Note');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                const q = (req.query.q || '').trim();
                const empty = { tasks: [], videos: [], websites: [], passwords: [], notes: [] };
                if (!q) {
                    res.json({ success: true, data: empty });
                    return resolve();
                }

                const regex = new RegExp(escapeRegex(q), 'i');
                const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20);

                const [tasks, videos, websites, passwords, notes] = await Promise.all([
                    Task.find({ userId: req.userId, $or: [{ title: regex }, { description: regex }, { tags: regex }] }).sort({ createdAt: -1 }).limit(limit),
                    // Full-text: title, notes, channel, tags, AI summary, transcript
                    Video.find({ userId: req.userId, $or: [{ title: regex }, { personalNotes: regex }, { channel: regex }, { tags: regex }, { summary: regex }, { transcript: regex }] }).sort({ createdAt: -1 }).limit(limit),
                    // Full-text: name, url, description, tags, extracted page/PDF content, summary
                    Website.find({ userId: req.userId, $or: [{ name: regex }, { url: regex }, { description: regex }, { tags: regex }, { content: regex }, { summary: regex }] }).sort({ createdAt: -1 }).limit(limit),
                    // Search metadata only — the encrypted password is never returned here
                    Password.find({ userId: req.userId, $or: [{ websiteName: regex }, { websiteUrl: regex }, { username: regex }, { notes: regex }, { category: regex }] }).sort({ lastModified: -1 }).limit(limit),
                    // Notes: title, full body, tags
                    Note.find({ userId: req.userId, $or: [{ title: regex }, { content: regex }, { tags: regex }] }).sort({ updatedAt: -1 }).limit(limit)
                ]);

                res.json({ success: true, query: q, data: { tasks, videos, websites, passwords, notes } });
                resolve();
            } catch (error) {
                handleError(res, error, 'Error searching your data');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
