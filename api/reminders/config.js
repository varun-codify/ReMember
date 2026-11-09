const allowCors = require('../_utils/cors');
const authMiddleware = require('../_middleware/auth');

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    return new Promise((resolve) => {
        authMiddleware(req, res, () => {
            res.json({
                success: true,
                data: {
                    pushEnabled: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
                    vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null
                }
            });
            resolve();
        });
    });
}

module.exports = allowCors(handler);
