const Website = require('../models/Website');
const captureService = require('../services/captureService');
const { isSafeUrl, sanitizeText, sanitizeTags } = require('../utils/security');

// Sanitize the fields a website accepts. Only fields actually present in the
// body are included, so this works for both create and partial update.
const sanitizeWebsite = (body) => {
  const out = {};
  if (body.name !== undefined) out.name = sanitizeText(body.name, { maxLength: 200 });
  if (body.url !== undefined) out.url = sanitizeText(body.url, { maxLength: 2048 });
  if (body.description !== undefined) out.description = sanitizeText(body.description, { maxLength: 5000 });
  if (body.category !== undefined) out.category = sanitizeText(body.category, { maxLength: 40 });
  if (body.tags !== undefined) out.tags = sanitizeTags(body.tags);
  return out;
};

// @route   GET /api/websites
// @desc    Get all websites for user
// @access  Private
exports.getAllWebsites = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get websites error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching websites'
    });
  }
};

// @route   GET /api/websites/:id
// @desc    Get single website
// @access  Private
exports.getWebsite = async (req, res) => {
  try {
    const website = await Website.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    res.json({
      success: true,
      data: website
    });
  } catch (error) {
    console.error('Get website error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching website'
    });
  }
};

// @route   POST /api/websites
// @desc    Add new website
// @access  Private
exports.createWebsite = async (req, res) => {
  try {
    const { isFavorite } = req.body;
    const cleaned = sanitizeWebsite(req.body);
    const name = cleaned.name;
    const url = cleaned.url;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: 'Website name and URL are required'
      });
    }

    // Only http(s) links may be stored — blocks javascript:/data: URLs that
    // would execute when rendered into <a href> by the client.
    if (!isSafeUrl(url)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid URL. Only http(s) links are allowed.'
      });
    }

    const website = new Website({
      userId: req.userId,
      name,
      url,
      description: cleaned.description,
      category: cleaned.category || 'other',
      tags: cleaned.tags,
      isFavorite: isFavorite || false
    });

    await website.save();

    // Enrich in the background: classify the link (webpage/pdf/image/github),
    // extract content for full-text search, pull GitHub metadata, and — when
    // AI is enabled — summarize + suggest a category. Never blocks saving.
    (async () => {
      try {
        const enrichment = await captureService.enrichWebsite({
          name: website.name,
          url: website.url,
          description: website.description || '',
          category: website.category
        });
        await Website.updateOne({ _id: website._id }, { $set: enrichment });
      } catch (e) {
        /* best effort */
      }
    })();

    res.status(201).json({
      success: true,
      message: 'Website saved successfully',
      data: website
    });
  } catch (error) {
    console.error('Create website error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving website'
    });
  }
};

// @route   PUT /api/websites/:id
// @desc    Update website
// @access  Private
exports.updateWebsite = async (req, res) => {
  try {
    const website = await Website.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    const { isFavorite, lastVisited, readingProgress } = req.body;
    const cleaned = sanitizeWebsite(req.body);

    if (cleaned.name) website.name = cleaned.name;
    if (cleaned.url) {
      if (!isSafeUrl(cleaned.url)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid URL. Only http(s) links are allowed.'
        });
      }
      website.url = cleaned.url;
    }
    if (cleaned.description !== undefined) website.description = cleaned.description;
    if (cleaned.category) website.category = cleaned.category;
    if (cleaned.tags !== undefined) website.tags = cleaned.tags;
    if (isFavorite !== undefined) website.isFavorite = isFavorite;
    if (lastVisited !== undefined) website.lastVisited = lastVisited;
    if (readingProgress !== undefined) {
      website.readingProgress = Math.min(100, Math.max(0, Number(readingProgress) || 0));
    }

    await website.save();

    res.json({
      success: true,
      message: 'Website updated successfully',
      data: website
    });
  } catch (error) {
    console.error('Update website error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating website'
    });
  }
};

// @route   DELETE /api/websites/:id
// @desc    Delete website
// @access  Private
exports.deleteWebsite = async (req, res) => {
  try {
    const website = await Website.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: 'Website not found'
      });
    }

    res.json({
      success: true,
      message: 'Website deleted successfully'
    });
  } catch (error) {
    console.error('Delete website error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting website'
    });
  }
};
