const Password = require('../models/Password');
const User = require('../models/User');
const { isSafeUrl, sanitizeText } = require('../utils/security');

// Sanitize metadata fields. The credential itself (encryptedPassword) is
// never touched — it is the user's secret.
const sanitizePasswordMeta = (body) => {
  const out = {};
  if (body.websiteName !== undefined) out.websiteName = sanitizeText(body.websiteName, { maxLength: 200 });
  if (body.websiteUrl !== undefined) out.websiteUrl = sanitizeText(body.websiteUrl, { maxLength: 2048 });
  if (body.username !== undefined) out.username = sanitizeText(body.username, { maxLength: 200 });
  if (body.notes !== undefined) out.notes = sanitizeText(body.notes, { maxLength: 5000 });
  if (body.category !== undefined) out.category = sanitizeText(body.category, { maxLength: 40 });
  return out;
};

// @route   GET /api/passwords
// @desc    Get all passwords for user
// @access  Private
exports.getAllPasswords = async (req, res) => {
  try {
    const passwords = await Password.find({ userId: req.userId })
      .sort({ lastModified: -1 });

    // Return encrypted passwords. Plaintext is never included here -
    // decryption only happens on-demand in GET /passwords/:id after the
    // vault passkey has been verified.
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
// @desc    Get single password (with decryption, vault passkey required)
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

    // Enforce the vault passkey before returning plaintext
    const user = await User.findById(req.userId).select('vaultPasskey');
    if (user && user.vaultPasskey) {
      const provided = req.header('x-vault-passkey');
      if (!provided) {
        return res.status(403).json({
          success: false,
          message: 'Vault passkey required'
        });
      }
      const isMatch = await user.compareVaultPasskey(provided);
      if (!isMatch) {
        return res.status(403).json({
          success: false,
          message: 'Invalid vault passkey'
        });
      }
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
    const { password } = req.body;
    const meta = sanitizePasswordMeta(req.body);
    const { websiteName, websiteUrl, username, notes, category } = meta;

    if (!websiteName || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Website name, username, and password are required'
      });
    }

    // The site URL renders into an <a href> in the vault — only http(s) allowed.
    if (websiteUrl && !isSafeUrl(websiteUrl)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid website URL. Only http(s) links are allowed.'
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

    const { password: newPassword } = req.body;
    const meta = sanitizePasswordMeta(req.body);

    if (meta.websiteName) password.websiteName = meta.websiteName;
    if (meta.websiteUrl !== undefined) {
      if (meta.websiteUrl && !isSafeUrl(meta.websiteUrl)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid website URL. Only http(s) links are allowed.'
        });
      }
      password.websiteUrl = meta.websiteUrl;
    }
    if (meta.username) password.username = meta.username;
    if (newPassword) password.encryptedPassword = newPassword;
    if (meta.notes !== undefined) password.notes = meta.notes;
    if (meta.category) password.category = meta.category;
    
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
