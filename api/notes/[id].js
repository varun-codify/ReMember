const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Note = require('../../server/models/Note');

async function handler(req, res) {
    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();
                const note = await Note.findOne({ _id: req.params.id, userId: req.userId });

                if (!note) {
                    res.status(404).json({ success: false, message: 'Note not found' });
                    return resolve();
                }

                if (req.method === 'GET') {
                    res.json({ success: true, data: note });
                } else if (req.method === 'PUT') {
                    const { title, content, tags, pinned } = req.body || {};
                    if (title !== undefined) note.title = String(title).trim();
                    if (content !== undefined) note.content = content;
                    if (tags !== undefined) note.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [];
                    if (pinned !== undefined) note.pinned = !!pinned;
                    await note.save();
                    res.json({ success: true, message: 'Note updated successfully', data: note });
                } else if (req.method === 'DELETE') {
                    await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
                    res.json({ success: true, message: 'Note deleted successfully' });
                } else {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error with note');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
