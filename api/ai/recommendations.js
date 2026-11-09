const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const aiService = require('../../server/services/aiService');
const Video = require('../../server/models/Video');
const Website = require('../../server/models/Website');
const Note = require('../../server/models/Note');

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                const { topic } = req.body || {};
                if (!aiService.isEnabled()) {
                    res.status(400).json({ success: false, message: 'AI is not configured. Set AI_API_KEY in the server environment.' });
                    return resolve();
                }

                let target = String(topic || '').trim().slice(0, 80);
                if (!target) {
                    const [vids, sites, notes] = await Promise.all([
                        Video.find({ userId: req.userId }).select('tags').lean().limit(200),
                        Website.find({ userId: req.userId }).select('tags').lean().limit(200),
                        Note.find({ userId: req.userId }).select('tags').lean().limit(200)
                    ]);
                    const counts = {};
                    [...vids, ...sites, ...notes].forEach((item) =>
                        (item.tags || []).forEach((t) => {
                            const key = String(t).toLowerCase();
                            counts[key] = (counts[key] || 0) + 1;
                        })
                    );
                    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                    target = top ? top[0] : 'productivity';
                }

                const suggestions = await aiService.suggestTopics({ topic: target });
                if (!suggestions) {
                    res.status(502).json({ success: false, message: 'AI could not generate suggestions. Please try again.' });
                    return resolve();
                }
                res.json({ success: true, data: { topic: target, suggestions } });
                resolve();
            } catch (error) {
                handleError(res, error, 'AI recommendations failed. Please try again.');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
