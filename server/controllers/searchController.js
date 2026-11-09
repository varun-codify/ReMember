const Task = require('../models/Task');
const Video = require('../models/Video');
const Website = require('../models/Website');
const Password = require('../models/Password');
const Note = require('../models/Note');

// Escape regex special characters so user input is treated literally
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @route   GET /api/search?q=term
// @desc    Full-text search across all modules for the current user
// @access  Private
exports.search = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();

    const empty = { tasks: [], videos: [], websites: [], passwords: [], notes: [] };
    if (!q) {
      return res.json({ success: true, data: empty });
    }

    const regex = new RegExp(escapeRegex(q), 'i');
    const limit = Math.min(parseInt(req.query.limit, 10) || 8, 20);

    const [tasks, videos, websites, passwords, notes] = await Promise.all([
      Task.find({
        userId: req.userId,
        $or: [{ title: regex }, { description: regex }, { tags: regex }]
      }).sort({ createdAt: -1 }).limit(limit),

      // Full-text: title, notes, channel, tags, and the AI-generated summary
      Video.find({
        userId: req.userId,
        $or: [
          { title: regex },
          { personalNotes: regex },
          { channel: regex },
          { tags: regex },
          { summary: regex },
          { transcript: regex }
        ]
      }).sort({ createdAt: -1 }).limit(limit),

      // Full-text: name, url, description, tags, extracted page/PDF content, summary
      Website.find({
        userId: req.userId,
        $or: [
          { name: regex },
          { url: regex },
          { description: regex },
          { tags: regex },
          { content: regex },
          { summary: regex }
        ]
      }).sort({ createdAt: -1 }).limit(limit),

      // Search metadata only — the encrypted password is never returned here
      Password.find({
        userId: req.userId,
        $or: [{ websiteName: regex }, { websiteUrl: regex }, { username: regex }, { notes: regex }, { category: regex }]
      }).sort({ lastModified: -1 }).limit(limit),

      // Notes: title, full body, tags
      Note.find({
        userId: req.userId,
        $or: [{ title: regex }, { content: regex }, { tags: regex }]
      }).sort({ updatedAt: -1 }).limit(limit)
    ]);

    res.json({
      success: true,
      query: q,
      data: { tasks, videos, websites, passwords, notes }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching your data'
    });
  }
};
