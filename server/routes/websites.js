const express = require('express');
const router = express.Router();
const websiteController = require('../controllers/websiteController');
const authMiddleware = require('../middleware/auth');

// All routes are protected
router.use(authMiddleware);

router.get('/', websiteController.getAllWebsites);
router.get('/:id', websiteController.getWebsite);
router.post('/', websiteController.createWebsite);
router.put('/:id', websiteController.updateWebsite);
router.delete('/:id', websiteController.deleteWebsite);

module.exports = router;
