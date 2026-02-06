const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Password = require('../../server/models/Password');

async function handler(req, res) {
    // Apply auth middleware
    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                if (req.method === 'GET') {
                    // Get all passwords
                    const passwords = await Password.find({ userId: req.userId })
                        .sort({ lastModified: -1 });

                    res.json({
                        success: true,
                        count: passwords.length,
                        data: passwords
                    });
                } else if (req.method === 'POST') {
                    // Create new password
                    const { websiteName, websiteUrl, username, password, notes, category } = req.body;

                    if (!websiteName || !username || !password) {
                        res.status(400).json({
                            success: false,
                            message: 'Website name, username, and password are required'
                        });
                        return resolve();
                    }

                    const newPassword = new Password({
                        userId: req.userId,
                        websiteName,
                        websiteUrl,
                        username,
                        encryptedPassword: password,
                        notes,
                        category
                    });

                    await newPassword.save();

                    res.status(201).json({
                        success: true,
                        message: 'Password saved successfully',
                        data: newPassword
                    });
                } else {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error with passwords');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
