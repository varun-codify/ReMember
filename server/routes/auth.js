const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.post('/vault-passkey', authMiddleware, authController.setVaultPasskey);
router.post('/verify-vault-passkey', authMiddleware, authController.verifyVaultPasskey);

module.exports = router;
