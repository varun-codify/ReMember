const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Collection = require('../../server/models/Collection');

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
                const collection = await Collection.findOne({ _id: req.params.id, userId: req.userId });

                if (!collection) {
                    res.status(404).json({ success: false, message: 'Collection not found' });
                    return resolve();
                }

                if (req.method === 'GET') {
                    res.json({ success: true, data: collection });
                } else if (req.method === 'PUT') {
                    const { name, icon, color, rule } = req.body || {};
                    if (name !== undefined) collection.name = String(name).trim().slice(0, 80);
                    if (icon !== undefined) collection.icon = icon;
                    if (color !== undefined) collection.color = color;
                    if (rule !== undefined) collection.rule = sanitizeRule(rule);
                    await collection.save();
                    res.json({ success: true, message: 'Collection updated successfully', data: collection });
                } else if (req.method === 'DELETE') {
                    await Collection.findOneAndDelete({ _id: req.params.id, userId: req.userId });
                    res.json({ success: true, message: 'Collection deleted successfully' });
                } else {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error with collection');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
