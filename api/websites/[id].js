const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Website = require('../../server/models/Website');
const { isSafeUrl, sanitizeText, sanitizeTags } = require('../../server/utils/security');

const sanitizeWebsite = (body) => {
    const out = {};
    if (body.name !== undefined) out.name = sanitizeText(body.name, { maxLength: 200 });
    if (body.url !== undefined) out.url = sanitizeText(body.url, { maxLength: 2048 });
    if (body.description !== undefined) out.description = sanitizeText(body.description, { maxLength: 5000 });
    if (body.category !== undefined) out.category = sanitizeText(body.category, { maxLength: 40 });
    if (body.tags !== undefined) out.tags = sanitizeTags(body.tags);
    return out;
};

async function handler(req, res) {
    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                const { id } = req.query;

                if (req.method === 'GET') {
                    const website = await Website.findOne({
                        _id: id,
                        userId: req.userId
                    });

                    if (!website) {
                        res.status(404).json({
                            success: false,
                            message: 'Website not found'
                        });
                        return resolve();
                    }

                    res.json({
                        success: true,
                        data: website
                    });
                } else if (req.method === 'PUT') {
                    const website = await Website.findOne({
                        _id: id,
                        userId: req.userId
                    });

                    if (!website) {
                        res.status(404).json({
                            success: false,
                            message: 'Website not found'
                        });
                        return resolve();
                    }

                    const { isFavorite, lastVisited, readingProgress } = req.body;
                    const cleaned = sanitizeWebsite(req.body);

                    if (cleaned.name) website.name = cleaned.name;
                    if (cleaned.url) {
                        if (!isSafeUrl(cleaned.url)) {
                            res.status(400).json({
                                success: false,
                                message: 'Invalid URL. Only http(s) links are allowed.'
                            });
                            return resolve();
                        }
                        website.url = cleaned.url;
                    }
                    if (cleaned.description !== undefined) website.description = cleaned.description;
                    if (cleaned.category) website.category = cleaned.category;
                    if (cleaned.tags !== undefined) website.tags = cleaned.tags;
                    if (isFavorite !== undefined) website.isFavorite = isFavorite;
                    if (lastVisited !== undefined) website.lastVisited = lastVisited;
                    if (readingProgress !== undefined) {
                        website.readingProgress = Math.min(100, Math.max(0, Number(readingProgress) || 0));
                    }

                    await website.save();

                    res.json({
                        success: true,
                        message: 'Website updated successfully',
                        data: website
                    });
                } else if (req.method === 'DELETE') {
                    const website = await Website.findOneAndDelete({
                        _id: id,
                        userId: req.userId
                    });

                    if (!website) {
                        res.status(404).json({
                            success: false,
                            message: 'Website not found'
                        });
                        return resolve();
                    }

                    res.json({
                        success: true,
                        message: 'Website deleted successfully'
                    });
                } else {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error with website operation');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
