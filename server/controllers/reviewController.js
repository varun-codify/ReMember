const Video = require('../models/Video');
const Website = require('../models/Website');
const Note = require('../models/Note');

const DAY_MS = 24 * 60 * 60 * 1000;

// @route   GET /api/review
// @desc    Items that haven't been touched recently, sorted by days since last
//          activity — the spaced-repetition style "you haven't reviewed this
//          in N days" view.
// @access  Private
exports.getReview = async (req, res) => {
  try {
    const now = Date.now();

    const [videos, websites, notes] = await Promise.all([
      Video.find({ userId: req.userId, watchStatus: { $ne: 'completed' } })
        .select('title videoUrl watchStatus lastWatchedAt createdAt')
        .lean(),
      Website.find({ userId: req.userId, readingProgress: { $lt: 100 } })
        .select('name url readingProgress lastVisited createdAt')
        .lean(),
      Note.find({ userId: req.userId })
        .select('title updatedAt')
        .lean()
    ]);

    const items = [];

    videos.forEach((v) => {
      const last = v.lastWatchedAt || v.createdAt;
      const daysSince = Math.max(0, Math.floor((now - new Date(last).getTime()) / DAY_MS));
      items.push({ type: 'video', id: v._id, title: v.title, daysSince, href: '/videos', url: v.videoUrl });
    });

    websites.forEach((w) => {
      const last = w.lastVisited || w.createdAt;
      const daysSince = Math.max(0, Math.floor((now - new Date(last).getTime()) / DAY_MS));
      items.push({
        type: 'website',
        id: w._id,
        title: w.name,
        daysSince,
        readingProgress: w.readingProgress || 0,
        href: '/websites',
        url: w.url
      });
    });

    notes.forEach((n) => {
      const daysSince = Math.max(0, Math.floor((now - new Date(n.updatedAt).getTime()) / DAY_MS));
      items.push({ type: 'note', id: n._id, title: n.title, daysSince, href: '/notes' });
    });

    items.sort((a, b) => b.daysSince - a.daysSince);

    res.json({ success: true, data: items.slice(0, 10) });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ success: false, message: 'Error fetching review items' });
  }
};
