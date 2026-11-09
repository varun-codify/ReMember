const Collection = require('../models/Collection');
const Video = require('../models/Video');
const Website = require('../models/Website');
const Note = require('../models/Note');

const TYPES = ['video', 'website', 'note'];
const CATEGORIES = ['ai', 'productivity', 'learning', 'utilities', 'development', 'design', 'other'];

/**
 * Turn a collection rule into per-model queries. Non-matching models return
 * null so the caller can skip them. Conditions that reference fields a model
 * doesn't have simply never match (safe inside an $or).
 */
function buildQueries(userId, rule = {}) {
  const types = rule.types && rule.types.length ? rule.types.filter((t) => TYPES.includes(t)) : [...TYPES];

  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const conditions = [];
  if (rule.categories && rule.categories.length) {
    conditions.push({ category: { $in: rule.categories } });
  }
  if (rule.tags && rule.tags.length) {
    // Case-insensitive match — stored tags aren't normalized on all models
    const pattern = `^(${rule.tags.map((t) => escapeRegex(String(t))).join('|')})$`;
    conditions.push({ tags: { $elemMatch: { $regex: pattern, $options: 'i' } } });
  }
  if (rule.favoritesOnly) {
    conditions.push({ isFavorite: true });
  }
  const match = conditions.length ? { $or: conditions } : {};

  const queries = {};
  if (types.includes('video')) {
    queries.videos = Video.find({ userId, ...match });
  }
  if (types.includes('website')) {
    queries.websites = Website.find({ userId, ...match });
  }
  if (types.includes('note')) {
    queries.notes = Note.find({ userId, ...match });
  }
  return queries;
}

const sanitizeRule = (rule = {}) => ({
  types: Array.isArray(rule.types)
    ? rule.types.filter((t) => TYPES.includes(t))
    : [],
  categories: Array.isArray(rule.categories)
    ? rule.categories.filter((c) => CATEGORIES.includes(c))
    : [],
  tags: Array.isArray(rule.tags)
    ? rule.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
    : [],
  favoritesOnly: !!rule.favoritesOnly
});

// @route   GET /api/collections
// @desc    List collections with live match counts
// @access  Private
exports.getAllCollections = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get collections error:', error);
    res.status(500).json({ success: false, message: 'Error fetching collections' });
  }
};

// @route   GET /api/collections/:id
// @access  Private
exports.getCollection = async (req, res) => {
  try {
    const collection = await Collection.findOne({ _id: req.params.id, userId: req.userId });
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }
    res.json({ success: true, data: collection });
  } catch (error) {
    console.error('Get collection error:', error);
    res.status(500).json({ success: false, message: 'Error fetching collection' });
  }
};

// @route   GET /api/collections/:id/items
// @desc    Items that currently match the collection rule, grouped by type
// @access  Private
exports.getCollectionItems = async (req, res) => {
  try {
    const collection = await Collection.findOne({ _id: req.params.id, userId: req.userId });
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    const queries = buildQueries(req.userId, collection.rule);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const [videos, websites, notes] = await Promise.all([
      queries.videos ? queries.videos.sort({ createdAt: -1 }).limit(limit).exec() : [],
      queries.websites ? queries.websites.sort({ createdAt: -1 }).limit(limit).exec() : [],
      queries.notes ? queries.notes.sort({ createdAt: -1 }).limit(limit).exec() : []
    ]);

    res.json({
      success: true,
      data: { videos, websites, notes, rule: collection.rule }
    });
  } catch (error) {
    console.error('Get collection items error:', error);
    res.status(500).json({ success: false, message: 'Error fetching collection items' });
  }
};

// @route   POST /api/collections
// @access  Private
exports.createCollection = async (req, res) => {
  try {
    const { name, icon, color, rule } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Collection name is required' });
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
  } catch (error) {
    console.error('Create collection error:', error);
    res.status(500).json({ success: false, message: 'Error creating collection' });
  }
};

// @route   PUT /api/collections/:id
// @access  Private
exports.updateCollection = async (req, res) => {
  try {
    const collection = await Collection.findOne({ _id: req.params.id, userId: req.userId });
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    const { name, icon, color, rule } = req.body;
    if (name !== undefined) collection.name = String(name).trim().slice(0, 80);
    if (icon !== undefined) collection.icon = icon;
    if (color !== undefined) collection.color = color;
    if (rule !== undefined) collection.rule = sanitizeRule(rule);

    await collection.save();

    res.json({ success: true, message: 'Collection updated successfully', data: collection });
  } catch (error) {
    console.error('Update collection error:', error);
    res.status(500).json({ success: false, message: 'Error updating collection' });
  }
};

// @route   DELETE /api/collections/:id
// @access  Private
// Shared with the Vercel serverless layer (api/collections/*)
exports.buildQueries = buildQueries;

exports.deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }
    res.json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    console.error('Delete collection error:', error);
    res.status(500).json({ success: false, message: 'Error deleting collection' });
  }
};
