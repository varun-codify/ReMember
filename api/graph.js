const connectToDatabase = require('./_utils/db');
const allowCors = require('./_utils/cors');
const handleError = require('./_utils/errorHandler');
const authMiddleware = require('./_middleware/auth');
const Video = require('../server/models/Video');
const Website = require('../server/models/Website');
const Note = require('../server/models/Note');

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 40, 80));
                const [videos, websites, notes] = await Promise.all([
                    Video.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(limit).select('title tags videoUrl watchStatus'),
                    Website.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(limit).select('name tags url mediaType'),
                    Note.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(limit).select('title tags')
                ]);

                const nodes = [];
                const tagMap = {};
                const addNode = (item, type, label, tags = []) => {
                    const index = nodes.length;
                    nodes.push({ id: `${type}:${item._id}`, type, label, tags, itemId: item._id });
                    tags.forEach((t) => {
                        const key = String(t).toLowerCase();
                        if (!tagMap[key]) tagMap[key] = [];
                        tagMap[key].push(index);
                    });
                };
                videos.forEach((v) => addNode(v, 'video', v.title, v.tags));
                websites.forEach((w) => addNode(w, 'website', w.name, w.tags));
                notes.forEach((n) => addNode(n, 'note', n.title, n.tags));

                const links = [];
                const seen = new Set();
                for (const tag of Object.keys(tagMap)) {
                    const indices = tagMap[tag];
                    for (let i = 0; i < indices.length; i++) {
                        for (let j = i + 1; j < indices.length; j++) {
                            const key = `${Math.min(indices[i], indices[j])}:${Math.max(indices[i], indices[j])}`;
                            if (seen.has(key)) continue;
                            seen.add(key);
                            links.push({ source: indices[i], target: indices[j], tag });
                        }
                    }
                }

                const topics = Object.entries(tagMap)
                    .map(([tag, indices]) => ({ tag, count: indices.length }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 12);

                res.json({ success: true, data: { nodes, links: links.slice(0, 200), topics } });
                resolve();
            } catch (error) {
                handleError(res, error, 'Error fetching knowledge graph');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
