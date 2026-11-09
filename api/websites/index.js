const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Website = require('../../server/models/Website');
const captureService = require('../../server/services/captureService');
const { isSafeUrl, sanitizeText, sanitizeTags } = require('../../server/utils/security');

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
                    const { isFavorite } = req.body;
                    const name = sanitizeText(req.body.name, { maxLength: 200 });
                    const url = sanitizeText(req.body.url, { maxLength: 2048 });
                    const description = sanitizeText(req.body.description, { maxLength: 5000 });
                    const category = sanitizeText(req.body.category, { maxLength: 40 });
                    const tags = sanitizeTags(req.body.tags);

                    if (!name || !url) {
                        res.status(400).json({
                            success: false,
                            message: 'Website name and URL are required'
                        });
                        return resolve();
                    }

                    // Only http(s) links may be stored (blocks javascript:/data: hrefs)
                    if (!isSafeUrl(url)) {
                        res.status(400).json({
                            success: false,
                            message: 'Invalid URL. Only http(s) links are allowed.'
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

                    // Enrich in the background (media type, content, GitHub meta, AI summary)
                    (async () => {
                        try {
                            const enrichment = await captureService.enrichWebsite({
                                name: website.name,
                                url: website.url,
                                description: website.description || '',
                                category: website.category
                            });
                            await Website.updateOne({ _id: website._id }, { $set: enrichment });
                        } catch (e) { /* best effort */ }
                    })();

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
