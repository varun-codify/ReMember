const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          hasVaultPasskey: !!user.vaultPasskey
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password -vaultPasskey');

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          hasVaultPasskey: !!user.vaultPasskey,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
};

// @route   POST /api/auth/vault-passkey
// @desc    Set or update vault passkey
// @access  Private
exports.setVaultPasskey = async (req, res) => {
  try {
    const { passkey } = req.body;

    if (!passkey || passkey.length < 4) {
      return res.status(400).json({
        success: false,
        message: 'Passkey must be at least 4 characters'
      });
    }

    const user = await User.findById(req.userId);
    user.vaultPasskey = passkey;
    await user.save();

    res.json({
      success: true,
      message: 'Vault passkey set successfully'
    });
  } catch (error) {
    console.error('Set passkey error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting vault passkey'
    });
  }
};

// @route   POST /api/auth/verify-vault-passkey
// @desc    Verify vault passkey
// @access  Private
exports.verifyVaultPasskey = async (req, res) => {
  try {
    const { passkey } = req.body;

    if (!passkey) {
      return res.status(400).json({
        success: false,
        message: 'Passkey is required'
      });
    }

    const user = await User.findById(req.userId);

    if (!user.vaultPasskey) {
      return res.status(400).json({
        success: false,
        message: 'No vault passkey set'
      });
    }

    const isMatch = await user.compareVaultPasskey(passkey);

    if (!isMatch) {
      return res.status(403).json({
        success: false,
        message: 'Invalid passkey'
      });
    }

    res.json({
      success: true,
      message: 'Passkey verified successfully'
    });
  } catch (error) {
    console.error('Verify passkey error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying passkey'
    });
  }
};
