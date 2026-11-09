const Task = require('../models/Task');
const Video = require('../models/Video');
const User = require('../models/User');

// @route   GET /api/reminders
// @desc    Get reminders for the current user (overdue/due tasks, stale videos)
// @access  Private
exports.getReminders = async (req, res) => {
  try {
    // "Due today" boundaries use server-local time. Acceptable for a personal
    // app; per-user timezones would require storing the user's offset.
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [overdueTasks, dueTodayTasks, inProgressVideos, notWatchedVideos] = await Promise.all([
      Task.find({
        userId: req.userId,
        status: 'pending',
        dueDate: { $lt: startOfDay }
      }).sort({ dueDate: 1 }).limit(10),

      Task.find({
        userId: req.userId,
        status: 'pending',
        dueDate: { $gte: startOfDay, $lt: endOfDay }
      }).sort({ dueDate: 1 }).limit(10),

      Video.find({
        userId: req.userId,
        watchStatus: 'in-progress'
      }).sort({ updatedAt: -1 }).limit(10),

      Video.find({
        userId: req.userId,
        watchStatus: 'not-watched'
      }).sort({ createdAt: -1 }).limit(10)
    ]);

    // Badge count: urgent items only, so the bell doesn't stay permanently red
    const count = overdueTasks.length + dueTodayTasks.length + inProgressVideos.length;

    res.json({
      success: true,
      data: {
        count,
        overdueTasks,
        dueTodayTasks,
        inProgressVideos,
        notWatchedVideos
      }
    });
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reminders'
    });
  }
};

// @route   GET /api/reminders/config
// @desc    Push notification capability + VAPID public key for the client
// @access  Private
exports.getReminderConfig = (req, res) => {
  const enabled = !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  res.json({
    success: true,
    data: {
      pushEnabled: enabled,
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || null
    }
  });
};

// @route   POST /api/reminders
// @desc    Enable/disable browser push notifications for the current user.
//          One endpoint so both the Express server and Vercel serverless
//          (api/reminders.js) can share the exact same client calls.
// @access  Private
exports.handlePushAction = async (req, res) => {
  try {
    const { action, endpoint, keys } = req.body;

    if (action === 'subscribe') {
      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        return res.status(400).json({
          success: false,
          message: 'Subscription details are required'
        });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const already = user.pushSubscriptions.some((s) => s.endpoint === endpoint);
      if (!already) {
        // Cap the array so a misbehaving client can't grow it unboundedly
        user.pushSubscriptions.push({
          endpoint,
          keys: { p256dh: keys.p256dh, auth: keys.auth }
        });
        user.pushSubscriptions = user.pushSubscriptions.slice(-10);
        await user.save();
      }

      return res.json({
        success: true,
        message: already ? 'Push notifications already enabled' : 'Push notifications enabled'
      });
    }

    if (action === 'unsubscribe') {
      if (!endpoint) {
        return res.status(400).json({
          success: false,
          message: 'Subscription endpoint is required'
        });
      }

      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.pushSubscriptions = user.pushSubscriptions.filter((s) => s.endpoint !== endpoint);
      await user.save();

      return res.json({ success: true, message: 'Push notifications disabled' });
    }

    return res.status(400).json({
      success: false,
      message: 'Unknown action. Use "subscribe" or "unsubscribe".'
    });
  } catch (error) {
    console.error('Push action error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating push subscription'
    });
  }
};
