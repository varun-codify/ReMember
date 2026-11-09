const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const aiService = require('../../server/services/aiService');

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                const { text } = req.body || {};
                if (!text || !String(text).trim()) {
                    res.status(400).json({ success: false, message: 'Note text is required' });
                    return resolve();
                }
                if (!aiService.isEnabled()) {
                    res.status(400).json({ success: false, message: 'AI is not configured. Set AI_API_KEY in the server environment.' });
                    return resolve();
                }

                const data = await aiService.parseCapture(String(text).trim());
                if (!data) {
                    res.status(502).json({ success: false, message: 'AI could not understand that note. Try being more specific.' });
                    return resolve();
                }

                res.json({ success: true, data });
                resolve();
            } catch (error) {
                handleError(res, error, 'AI parse failed. Please try again.');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
