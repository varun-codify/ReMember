const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const aiService = require('../../server/services/aiService');

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();
                res.json({ success: true, data: { enabled: aiService.isEnabled() } });
                resolve();
            } catch (error) {
                handleError(res, error, 'Error checking AI status');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
