const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', reviewController.getReview);

module.exports = router;
