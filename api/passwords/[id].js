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

                const { id } = req.query;

                if (req.method === 'GET') {
                    // Get single password
                    const password = await Password.findOne({
                        _id: id,
                        userId: req.userId
                    });

                    if (!password) {
                        res.status(404).json({
                            success: false,
                            message: 'Password not found'
                        });
                        return resolve();
                    }

                    // Decrypt password
                    const decryptedPassword = password.decryptPassword();

                    res.json({
                        success: true,
                        data: {
                            ...password.toObject(),
                            decryptedPassword
                        }
                    });
                } else if (req.method === 'PUT') {
                    // Update password
                    const password = await Password.findOne({
                        _id: id,
                        userId: req.userId
                    });

                    if (!password) {
                        res.status(404).json({
                            success: false,
                            message: 'Password not found'
                        });
                        return resolve();
                    }

                    const { websiteName, websiteUrl, username, password: newPassword, notes, category } = req.body;

                    if (websiteName) password.websiteName = websiteName;
                    if (websiteUrl !== undefined) password.websiteUrl = websiteUrl;
                    if (username) password.username = username;
                    if (newPassword) password.encryptedPassword = newPassword;
                    if (notes !== undefined) password.notes = notes;
                    if (category) password.category = category;

                    password.lastModified = new Date();

                    await password.save();

                    res.json({
                        success: true,
                        message: 'Password updated successfully',
                        data: password
                    });
                } else if (req.method === 'DELETE') {
                    // Delete password
                    const password = await Password.findOneAndDelete({
                        _id: id,
                        userId: req.userId
                    });

                    if (!password) {
                        res.status(404).json({
                            success: false,
                            message: 'Password not found'
                        });
                        return resolve();
                    }

                    res.json({
                        success: true,
                        message: 'Password deleted successfully'
                    });
                } else {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error with password operation');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
