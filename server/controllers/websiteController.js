const Website = require('../models/Website');

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
    const { name, url, description, category, tags, isFavorite } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        message: 'Website name and URL are required'
      });
    }

    const website = new Website({
      userId: req.userId,
      name,
      url,
      description,
      category: category || 'other',
      tags,
      isFavorite: isFavorite || false
    });

    await website.save();

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

    const { name, url, description, category, tags, isFavorite, lastVisited } = req.body;

    if (name) website.name = name;
    if (url) website.url = url;
    if (description !== undefined) website.description = description;
    if (category) website.category = category;
    if (tags !== undefined) website.tags = tags;
    if (isFavorite !== undefined) website.isFavorite = isFavorite;
    if (lastVisited !== undefined) website.lastVisited = lastVisited;

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
