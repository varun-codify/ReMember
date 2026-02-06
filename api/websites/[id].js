const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Website = require('../../server/models/Website');

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

                    const { name, url, description, category, tags, isFavorite, lastVisited } = req.body;

                    if (name) website.name = name;
                    if (url) website.url = url;
                    if (description !== undefined) website.description = description;
                    if (category) website.category = category;
                    if (tags !== undefined) website.tags = tags;
                    if (isFavorite !== undefined) website.isFavorite = isFavorite;
                    if (lastVisited !== undefined) website.lastVisited = lastVisited;

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
