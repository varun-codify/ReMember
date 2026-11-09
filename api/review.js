const connectToDatabase = require('./_utils/db');
const allowCors = require('./_utils/cors');
const handleError = require('./_utils/errorHandler');
const authMiddleware = require('./_middleware/auth');
const Video = require('../server/models/Video');
const Website = require('../server/models/Website');
const Note = require('../server/models/Note');

const DAY_MS = 24 * 60 * 60 * 1000;

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                const now = Date.now();
                const [videos, websites, notes] = await Promise.all([
                    Video.find({ userId: req.userId, watchStatus: { $ne: 'completed' } }).select('title videoUrl watchStatus lastWatchedAt createdAt').lean(),
                    Website.find({ userId: req.userId, readingProgress: { $lt: 100 } }).select('name url readingProgress lastVisited createdAt').lean(),
                    Note.find({ userId: req.userId }).select('title updatedAt').lean()
                ]);

                const items = [];
                videos.forEach((v) => {
                    const last = v.lastWatchedAt || v.createdAt;
                    const daysSince = Math.max(0, Math.floor((now - new Date(last).getTime()) / DAY_MS));
                    items.push({ type: 'video', id: v._id, title: v.title, daysSince, href: '/videos', url: v.videoUrl });
                });
                websites.forEach((w) => {
                    const last = w.lastVisited || w.createdAt;
                    const daysSince = Math.max(0, Math.floor((now - new Date(last).getTime()) / DAY_MS));
                    items.push({ type: 'website', id: w._id, title: w.name, daysSince, readingProgress: w.readingProgress || 0, href: '/websites', url: w.url });
                });
                notes.forEach((n) => {
                    const daysSince = Math.max(0, Math.floor((now - new Date(n.updatedAt).getTime()) / DAY_MS));
                    items.push({ type: 'note', id: n._id, title: n.title, daysSince, href: '/notes' });
                });

                items.sort((a, b) => b.daysSince - a.daysSince);

                res.json({ success: true, data: items.slice(0, 10) });
                resolve();
            } catch (error) {
                handleError(res, error, 'Error fetching review items');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
