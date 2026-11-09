const express = require('express');
const router = express.Router();
const graphController = require('../controllers/graphController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', graphController.getGraph);

module.exports = router;
