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

                if (!passkey) {
                    res.status(400).json({
                        success: false,
                        message: 'Passkey is required'
                    });
                    return resolve();
                }

                const user = await User.findById(req.userId);

                if (!user.vaultPasskey) {
                    res.status(400).json({
                        success: false,
                        message: 'No vault passkey set'
                    });
                    return resolve();
                }

                const isMatch = await user.compareVaultPasskey(passkey);

                if (!isMatch) {
                    res.status(403).json({
                        success: false,
                        message: 'Invalid passkey'
                    });
                    return resolve();
                }

                res.json({
                    success: true,
                    message: 'Passkey verified successfully'
                });
                resolve();
            } catch (error) {
                handleError(res, error, 'Error verifying passkey');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
