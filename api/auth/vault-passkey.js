const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const User = require('../../server/models/User');

async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Apply auth middleware
    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                const { passkey } = req.body;

                if (!passkey || passkey.length < 4) {
                    res.status(400).json({
                        success: false,
                        message: 'Passkey must be at least 4 characters'
                    });
                    return resolve();
                }

                const user = await User.findById(req.userId);
                user.vaultPasskey = passkey;
                await user.save();

                res.json({
                    success: true,
                    message: 'Vault passkey set successfully'
                });
                resolve();
            } catch (error) {
                handleError(res, error, 'Error setting vault passkey');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
