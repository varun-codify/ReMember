const Video = require('../models/Video');
const Website = require('../models/Website');
const Note = require('../models/Note');

// @route   GET /api/graph
// @desc    Knowledge graph of the user's library: nodes are saved items,
//          links connect items that share tags. Also returns top topics.
// @access  Private
exports.getGraph = async (req, res) => {
  try {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 40, 80));

    const [videos, websites, notes] = await Promise.all([
      Video.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(limit).select('title tags videoUrl watchStatus'),
      Website.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(limit).select('name tags url mediaType'),
      Note.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(limit).select('title tags')
    ]);

    const nodes = [];
    const tagMap = {}; // tag -> node indices

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

    // One link per item pair, labeled with the shared tag
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

    res.json({
      success: true,
      data: {
        nodes,
        links: links.slice(0, 200),
        topics
      }
    });
  } catch (error) {
    console.error('Get graph error:', error);
    res.status(500).json({ success: false, message: 'Error fetching knowledge graph' });
  }
};
