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

                const { title, notes } = req.body || {};
                if (!title || !String(title).trim()) {
                    res.status(400).json({ success: false, message: 'Title is required' });
                    return resolve();
                }
                if (!aiService.isEnabled()) {
                    res.status(400).json({ success: false, message: 'AI is not configured. Set AI_API_KEY in the server environment.' });
                    return resolve();
                }

                const data = await aiService.enrich({ title: String(title).trim(), notes });
                if (!data) {
                    res.status(502).json({ success: false, message: 'AI enrichment failed.' });
                    return resolve();
                }

                res.json({ success: true, data });
                resolve();
            } catch (error) {
                handleError(res, error, 'AI enrichment failed. Please try again.');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
