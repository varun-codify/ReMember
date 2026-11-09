const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', reminderController.getReminders);
router.get('/config', reminderController.getReminderConfig);
router.post('/', reminderController.handlePushAction);

module.exports = router;
