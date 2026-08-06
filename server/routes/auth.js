const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

// Brute-force protection for public auth endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many login attempts. Please try again later.'
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many sign-up attempts from this address. Please try again later.'
});

// Public routes
router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/vault-passkey', authMiddleware, authController.setVaultPasskey);
router.post('/verify-vault-passkey', authMiddleware, authController.verifyVaultPasskey);

module.exports = router;
