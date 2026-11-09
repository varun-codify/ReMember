const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/status', aiController.getStatus);
router.post('/parse', aiController.parse);
router.post('/enrich', aiController.enrich);
router.post('/summarize-item', aiController.summarizeItem);
router.post('/chat', aiController.chat);
router.post('/recommendations', aiController.recommendations);

module.exports = router;
