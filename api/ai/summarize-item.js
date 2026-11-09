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

                const { type, id } = req.body || {};
                if (!['video', 'website', 'note'].includes(type) || !id) {
                    res.status(400).json({ success: false, message: 'A valid type (video|website|note) and id are required' });
                    return resolve();
                }
                if (!aiService.isEnabled()) {
                    res.status(400).json({ success: false, message: 'AI is not configured. Set AI_API_KEY in the server environment.' });
                    return resolve();
                }

                let item;
                if (type === 'video') item = await Video.findOne({ _id: id, userId: req.userId });
                else if (type === 'website') item = await Website.findOne({ _id: id, userId: req.userId });
                else item = await Note.findOne({ _id: id, userId: req.userId });

                if (!item) {
                    res.status(404).json({ success: false, message: 'Item not found' });
                    return resolve();
                }

                const title = item.title || item.name || 'Untitled';
                const content =
                    type === 'video'
                        ? item.transcript || item.personalNotes || ''
                        : type === 'website'
                            ? item.content || item.description || ''
                            : item.content || '';

                const ai = await aiService.summarizeContent({ title, content });
                if (!ai) {
                    res.status(502).json({ success: false, message: 'AI could not summarize this item.' });
                    return resolve();
                }

                item.summary = ai.summary || '';
                item.keyPoints = ai.keyPoints || [];
                await item.save();

                res.json({ success: true, data: { summary: item.summary, keyPoints: item.keyPoints } });
                resolve();
            } catch (error) {
                handleError(res, error, 'AI summarization failed. Please try again.');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
