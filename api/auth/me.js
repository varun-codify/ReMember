const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const User = require('../../server/models/User');

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // Apply auth middleware
    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                const user = await User.findById(req.userId).select('-password -vaultPasskey');

                res.json({
                    success: true,
                    data: {
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            hasVaultPasskey: !!user.vaultPasskey,
                            createdAt: user.createdAt
                        }
                    }
                });
                resolve();
            } catch (error) {
                handleError(res, error, 'Error fetching user data');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
