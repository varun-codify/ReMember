const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Note = require('../../server/models/Note');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function handler(req, res) {
    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                if (req.method === 'GET') {
                    const { q } = req.query;
                    const filter = { userId: req.userId };
                    if (q && q.trim()) {
                        const regex = new RegExp(escapeRegex(q.trim()), 'i');
                        filter.$or = [{ title: regex }, { content: regex }, { tags: regex }];
                    }
                    const notes = await Note.find(filter).sort({ pinned: -1, updatedAt: -1 });
                    res.json({ success: true, count: notes.length, data: notes });
                } else if (req.method === 'POST') {
                    const { title, content, tags, pinned } = req.body || {};
                    if (!title || !String(title).trim()) {
                        res.status(400).json({ success: false, message: 'Note title is required' });
                        return resolve();
                    }
                    const note = new Note({
                        userId: req.userId,
                        title: String(title).trim(),
                        content: content || '',
                        tags: Array.isArray(tags) ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [],
                        pinned: !!pinned
                    });
                    await note.save();
                    res.status(201).json({ success: true, message: 'Note saved successfully', data: note });
                } else {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error with notes');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
