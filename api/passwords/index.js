const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Password = require('../../server/models/Password');
const { isSafeUrl, sanitizeText } = require('../../server/utils/security');

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
                    const { password } = req.body;
                    const websiteName = sanitizeText(req.body.websiteName, { maxLength: 200 });
                    const websiteUrl = sanitizeText(req.body.websiteUrl, { maxLength: 2048 });
                    const username = sanitizeText(req.body.username, { maxLength: 200 });
                    const notes = sanitizeText(req.body.notes, { maxLength: 5000 });
                    const category = sanitizeText(req.body.category, { maxLength: 40 });

                    if (!websiteName || !username || !password) {
                        res.status(400).json({
                            success: false,
                            message: 'Website name, username, and password are required'
                        });
                        return resolve();
                    }

                    if (websiteUrl && !isSafeUrl(websiteUrl)) {
                        res.status(400).json({
                            success: false,
                            message: 'Invalid website URL. Only http(s) links are allowed.'
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
