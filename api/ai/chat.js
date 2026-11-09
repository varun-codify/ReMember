const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const aiService = require('../../server/services/aiService');
const Video = require('../../server/models/Video');
const Website = require('../../server/models/Website');
const Note = require('../../server/models/Note');

const ITEM_MODELS = { video: Video, website: Website, note: Note };

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                const { message, history, context, mode } = req.body || {};
                if (!message || !String(message).trim()) {
                    res.status(400).json({ success: false, message: 'Message is required' });
                    return resolve();
                }
                if (!aiService.isEnabled()) {
                    res.status(400).json({ success: false, message: 'AI is not configured. Set AI_API_KEY in the server environment.' });
                    return resolve();
                }

                let contextContent = null;
                if (context && context.type && context.id && ITEM_MODELS[context.type]) {
                    const item = await ITEM_MODELS[context.type].findOne({ _id: context.id, userId: req.userId });
                    if (item) {
                        const title = item.title || item.name || 'Untitled';
                        const body =
                            context.type === 'video'
                                ? item.transcript || item.personalNotes || ''
                                : context.type === 'website'
                                    ? item.content || item.description || ''
                                    : item.content || '';
                        contextContent = `Title: ${title}\nType: ${context.type}\n${String(body).replace(/\s+/g, ' ').slice(0, 6000)}`;
                    }
                }

                const [videos, websites, notes] = await Promise.all([
                    Video.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(40).select('title tags channel watchStatus'),
                    Website.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(40).select('name tags category mediaType'),
                    Note.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(40).select('title tags')
                ]);
                const library = [
                    ...videos.map((v) => `${v.title} — Video — ${(v.tags || []).join(', ') || v.channel || 'no tags'}`),
                    ...websites.map((w) => `${w.name} — ${w.mediaType || 'Website'} — ${(w.tags || []).join(', ') || w.category || 'no tags'}`),
                    ...notes.map((n) => `${n.title} — Note — ${(n.tags || []).join(', ') || 'no tags'}`)
                ];

                const result = await aiService.chatWithMemory({
                    message: String(message).trim().slice(0, 2000),
                    history: Array.isArray(history) ? history : [],
                    context: contextContent,
                    library,
                    mode: mode === 'quiz' ? 'quiz' : 'chat'
                });

                if (!result) {
                    res.status(502).json({ success: false, message: 'AI could not respond. Please try again.' });
                    return resolve();
                }
                res.json({ success: true, data: result });
                resolve();
            } catch (error) {
                handleError(res, error, 'AI chat failed. Please try again.');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
