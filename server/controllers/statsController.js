const Video = require('../models/Video');
const Website = require('../models/Website');
const Note = require('../models/Note');

// @route   GET /api/stats/learning
// @desc    Dashboard learning analytics
// @access  Private
exports.getLearningStats = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const [
      totalVideos,
      totalWebsites,
      totalNotes,
      completedVideos,
      inProgressVideos,
      readingWebsites,
      weeklyVideos,
      weeklyWebsites,
      weeklyNotes,
      categoryAgg,
      recentVideos,
      recentWebsites
    ] = await Promise.all([
      Video.countDocuments({ userId: req.userId }),
      Website.countDocuments({ userId: req.userId }),
      Note.countDocuments({ userId: req.userId }),
      Video.countDocuments({ userId: req.userId, watchStatus: 'completed' }),
      Video.countDocuments({ userId: req.userId, watchStatus: 'in-progress' }),
      Website.countDocuments({ userId: req.userId, readingProgress: { $gt: 0 } }),
      Video.find({ userId: req.userId, createdAt: { $gte: start } }).select('createdAt').lean(),
      Website.find({ userId: req.userId, createdAt: { $gte: start } }).select('createdAt').lean(),
      Note.find({ userId: req.userId, createdAt: { $gte: start } }).select('createdAt').lean(),
      Website.aggregate([
        { $match: { userId: req.userId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Video.find({ userId: req.userId, watchStatus: 'in-progress' })
        .sort({ lastWatchedAt: -1 })
        .limit(4),
      Website.find({ userId: req.userId, lastVisited: { $ne: null } })
        .sort({ lastVisited: -1 })
        .limit(4)
    ]);

    // Bucket the last 7 days using LOCAL day keys (server-local midnight
    // boundaries) so early-morning saves land on the right day in any timezone.
    const localDayKey = (d) => {
      const dt = new Date(d);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const buckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return { date: localDayKey(d), label: d.toLocaleDateString('en-US', { weekday: 'short' }), count: 0 };
    });
    const inc = (items) => {
      for (const item of items) {
        const key = localDayKey(item.createdAt);
        const bucket = buckets.find((b) => b.date === key);
        if (bucket) bucket.count += 1;
      }
    };
    inc(weeklyVideos);
    inc(weeklyWebsites);
    inc(weeklyNotes);

    res.json({
      success: true,
      data: {
        totals: {
          videos: totalVideos,
          websites: totalWebsites,
          notes: totalNotes,
          completedVideos,
          inProgressVideos,
          readingWebsites
        },
        weekly: buckets,
        categories: categoryAgg.map((c) => ({ name: c._id || 'other', count: c.count })),
        recentlyViewed: { videos: recentVideos, websites: recentWebsites }
      }
    });
  } catch (error) {
    console.error('Get learning stats error:', error);
    res.status(500).json({ success: false, message: 'Error fetching learning stats' });
  }
};
