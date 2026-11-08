const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

// All AI routes require authentication
router.use(authMiddleware);

router.post('/search', aiController.search);

module.exports = router;
