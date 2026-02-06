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

                if (req.method === 'GET') {
                    const { category, isFavorite } = req.query;

                    const filter = { userId: req.userId };
                    if (category) filter.category = category;
                    if (isFavorite !== undefined) filter.isFavorite = isFavorite === 'true';

                    const websites = await Website.find(filter).sort({ createdAt: -1 });

                    res.json({
                        success: true,
                        count: websites.length,
                        data: websites
                    });
                } else if (req.method === 'POST') {
                    const { name, url, description, category, tags, isFavorite } = req.body;

                    if (!name || !url) {
                        res.status(400).json({
                            success: false,
                            message: 'Website name and URL are required'
                        });
                        return resolve();
                    }

                    const website = new Website({
                        userId: req.userId,
                        name,
                        url,
                        description,
                        category: category || 'other',
                        tags,
                        isFavorite: isFavorite || false
                    });

                    await website.save();

                    res.status(201).json({
                        success: true,
                        message: 'Website saved successfully',
                        data: website
                    });
                } else {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error with websites');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
