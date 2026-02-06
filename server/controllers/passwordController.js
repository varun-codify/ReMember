const Password = require('../models/Password');

// @route   GET /api/passwords
// @desc    Get all passwords for user
// @access  Private
exports.getAllPasswords = async (req, res) => {
  try {
    const passwords = await Password.find({ userId: req.userId })
      .sort({ lastModified: -1 });

    // Return encrypted passwords - decryption happens on frontend if needed
    res.json({
      success: true,
      count: passwords.length,
      data: passwords
    });
  } catch (error) {
    console.error('Get passwords error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching passwords'
    });
  }
};

// @route   GET /api/passwords/:id
// @desc    Get single password (with decryption)
// @access  Private
exports.getPassword = async (req, res) => {
  try {
    const password = await Password.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!password) {
      return res.status(404).json({
        success: false,
        message: 'Password not found'
      });
    }

    // Decrypt password
    const decryptedPassword = password.decryptPassword();

    res.json({
      success: true,
      data: {
        ...password.toObject(),
        decryptedPassword
      }
    });
  } catch (error) {
    console.error('Get password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching password'
    });
  }
};

// @route   POST /api/passwords
// @desc    Create new password entry
// @access  Private
exports.createPassword = async (req, res) => {
  try {
    const { websiteName, websiteUrl, username, password, notes, category } = req.body;

    if (!websiteName || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Website name, username, and password are required'
      });
    }

    const newPassword = new Password({
      userId: req.userId,
      websiteName,
      websiteUrl,
      username,
      encryptedPassword: password,
      notes,
      category
    });

    await newPassword.save();

    res.status(201).json({
      success: true,
      message: 'Password saved successfully',
      data: newPassword
    });
  } catch (error) {
    console.error('Create password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving password'
    });
  }
};

// @route   PUT /api/passwords/:id
// @desc    Update password entry
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const password = await Password.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!password) {
      return res.status(404).json({
        success: false,
        message: 'Password not found'
      });
    }

    const { websiteName, websiteUrl, username, password: newPassword, notes, category } = req.body;

    if (websiteName) password.websiteName = websiteName;
    if (websiteUrl !== undefined) password.websiteUrl = websiteUrl;
    if (username) password.username = username;
    if (newPassword) password.encryptedPassword = newPassword;
    if (notes !== undefined) password.notes = notes;
    if (category) password.category = category;
    
    password.lastModified = new Date();

    await password.save();

    res.json({
      success: true,
      message: 'Password updated successfully',
      data: password
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password'
    });
  }
};

// @route   DELETE /api/passwords/:id
// @desc    Delete password entry
// @access  Private
exports.deletePassword = async (req, res) => {
  try {
    const password = await Password.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!password) {
      return res.status(404).json({
        success: false,
        message: 'Password not found'
      });
    }

    res.json({
      success: true,
      message: 'Password deleted successfully'
    });
  } catch (error) {
    console.error('Delete password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting password'
    });
  }
};
