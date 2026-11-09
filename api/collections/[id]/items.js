const connectToDatabase = require('../../_utils/db');
const allowCors = require('../../_utils/cors');
const handleError = require('../../_utils/errorHandler');
const authMiddleware = require('../../_middleware/auth');
const Collection = require('../../../server/models/Collection');
const { buildQueries } = require('../../../server/controllers/collectionController');

async function handler(req, res) {
    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                if (req.method !== 'GET') {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                    return resolve();
                }

                const collection = await Collection.findOne({ _id: req.params.id, userId: req.userId });
                if (!collection) {
                    res.status(404).json({ success: false, message: 'Collection not found' });
                    return resolve();
                }

                const queries = buildQueries(req.userId, collection.rule);
                const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

                const [videos, websites, notes] = await Promise.all([
                    queries.videos ? queries.videos.sort({ createdAt: -1 }).limit(limit).exec() : [],
                    queries.websites ? queries.websites.sort({ createdAt: -1 }).limit(limit).exec() : [],
                    queries.notes ? queries.notes.sort({ createdAt: -1 }).limit(limit).exec() : []
                ]);

                res.json({ success: true, data: { videos, websites, notes, rule: collection.rule } });
                resolve();
            } catch (error) {
                handleError(res, error, 'Error fetching collection items');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
