const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Collection = require('../../server/models/Collection');
const { buildQueries } = require('../../server/controllers/collectionController');

const sanitizeRule = (rule = {}) => ({
    types: Array.isArray(rule.types) ? rule.types.filter((t) => ['video', 'website', 'note'].includes(t)) : [],
    categories: Array.isArray(rule.categories)
        ? rule.categories.filter((c) => ['ai', 'productivity', 'learning', 'utilities', 'development', 'design', 'other'].includes(c))
        : [],
    tags: Array.isArray(rule.tags) ? rule.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean) : [],
    favoritesOnly: !!rule.favoritesOnly
});

async function handler(req, res) {
    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                if (req.method === 'GET') {
                    const collections = await Collection.find({ userId: req.userId }).sort({ createdAt: -1 });
                    const withCounts = await Promise.all(
                        collections.map(async (collection) => {
                            const queries = buildQueries(req.userId, collection.rule);
                            const [videos, websites, notes] = await Promise.all([
                                queries.videos ? queries.videos.countDocuments() : 0,
                                queries.websites ? queries.websites.countDocuments() : 0,
                                queries.notes ? queries.notes.countDocuments() : 0
                            ]);
                            return { ...collection.toObject(), count: (videos || 0) + (websites || 0) + (notes || 0) };
                        })
                    );
                    res.json({ success: true, count: withCounts.length, data: withCounts });
                } else if (req.method === 'POST') {
                    const { name, icon, color, rule } = req.body || {};
                    if (!name || !String(name).trim()) {
                        res.status(400).json({ success: false, message: 'Collection name is required' });
                        return resolve();
                    }
                    const collection = new Collection({
                        userId: req.userId,
                        name: String(name).trim().slice(0, 80),
                        icon: icon || '🗂',
                        color: color || 'blue',
                        rule: sanitizeRule(rule)
                    });
                    await collection.save();
                    res.status(201).json({ success: true, message: 'Collection created successfully', data: collection });
                } else {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error with collections');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
