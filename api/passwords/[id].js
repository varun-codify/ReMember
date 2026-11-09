const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Password = require('../../server/models/Password');
const User = require('../../server/models/User');
const { isSafeUrl, sanitizeText } = require('../../server/utils/security');

const sanitizePasswordMeta = (body) => {
    const out = {};
    if (body.websiteName !== undefined) out.websiteName = sanitizeText(body.websiteName, { maxLength: 200 });
    if (body.websiteUrl !== undefined) out.websiteUrl = sanitizeText(body.websiteUrl, { maxLength: 2048 });
    if (body.username !== undefined) out.username = sanitizeText(body.username, { maxLength: 200 });
    if (body.notes !== undefined) out.notes = sanitizeText(body.notes, { maxLength: 5000 });
    if (body.category !== undefined) out.category = sanitizeText(body.category, { maxLength: 40 });
    return out;
};

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

                    // Enforce the vault passkey before returning plaintext
                    const user = await User.findById(req.userId).select('vaultPasskey');
                    if (user && user.vaultPasskey) {
                        const provided = req.headers['x-vault-passkey'];
                        if (!provided) {
                            res.status(403).json({
                                success: false,
                                message: 'Vault passkey required'
                            });
                            return resolve();
                        }
                        const isMatch = await user.compareVaultPasskey(provided);
                        if (!isMatch) {
                            res.status(403).json({
                                success: false,
                                message: 'Invalid vault passkey'
                            });
                            return resolve();
                        }
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

                    const { password: newPassword } = req.body;
                    const meta = sanitizePasswordMeta(req.body);

                    if (meta.websiteName) password.websiteName = meta.websiteName;
                    if (meta.websiteUrl !== undefined) {
                        if (meta.websiteUrl && !isSafeUrl(meta.websiteUrl)) {
                            res.status(400).json({
                                success: false,
                                message: 'Invalid website URL. Only http(s) links are allowed.'
                            });
                            return resolve();
                        }
                        password.websiteUrl = meta.websiteUrl;
                    }
                    if (meta.username) password.username = meta.username;
                    if (newPassword) password.encryptedPassword = newPassword;
                    if (meta.notes !== undefined) password.notes = meta.notes;
                    if (meta.category) password.category = meta.category;

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
