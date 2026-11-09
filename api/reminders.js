const connectToDatabase = require('./_utils/db');
const allowCors = require('./_utils/cors');
const handleError = require('./_utils/errorHandler');
const authMiddleware = require('./_middleware/auth');
const Task = require('../server/models/Task');
const Video = require('../server/models/Video');
const User = require('../server/models/User');

async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                // Push subscription management (mirrors Express POST /api/reminders)
                if (req.method === 'POST') {
                    const { action, endpoint, keys } = req.body || {};

                    if (action === 'subscribe') {
                        if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
                            res.status(400).json({ success: false, message: 'Subscription details are required' });
                            return resolve();
                        }
                        const user = await User.findById(req.userId);
                        if (!user) {
                            res.status(404).json({ success: false, message: 'User not found' });
                            return resolve();
                        }
                        const already = user.pushSubscriptions.some((s) => s.endpoint === endpoint);
                        if (!already) {
                            // Cap the array so a misbehaving client can't grow it unboundedly
                            user.pushSubscriptions.push({ endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } });
                            user.pushSubscriptions = user.pushSubscriptions.slice(-10);
                            await user.save();
                        }
                        res.json({
                            success: true,
                            message: already ? 'Push notifications already enabled' : 'Push notifications enabled'
                        });
                        return resolve();
                    }

                    if (action === 'unsubscribe') {
                        if (!endpoint) {
                            res.status(400).json({ success: false, message: 'Subscription endpoint is required' });
                            return resolve();
                        }
                        const user = await User.findById(req.userId);
                        if (!user) {
                            res.status(404).json({ success: false, message: 'User not found' });
                            return resolve();
                        }
                        user.pushSubscriptions = user.pushSubscriptions.filter((s) => s.endpoint !== endpoint);
                        await user.save();
                        res.json({ success: true, message: 'Push notifications disabled' });
                        return resolve();
                    }

                    res.status(400).json({ success: false, message: 'Unknown action. Use "subscribe" or "unsubscribe".' });
                    return resolve();
                }

                const now = new Date();
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

                const [overdueTasks, dueTodayTasks, inProgressVideos, notWatchedVideos] = await Promise.all([
                    Task.find({ userId: req.userId, status: 'pending', dueDate: { $lt: startOfDay } }).sort({ dueDate: 1 }).limit(10),
                    Task.find({ userId: req.userId, status: 'pending', dueDate: { $gte: startOfDay, $lt: endOfDay } }).sort({ dueDate: 1 }).limit(10),
                    Video.find({ userId: req.userId, watchStatus: 'in-progress' }).sort({ updatedAt: -1 }).limit(10),
                    Video.find({ userId: req.userId, watchStatus: 'not-watched' }).sort({ createdAt: -1 }).limit(10)
                ]);

                // Badge count: urgent items only
                const count = overdueTasks.length + dueTodayTasks.length + inProgressVideos.length;

                res.json({
                    success: true,
                    data: { count, overdueTasks, dueTodayTasks, inProgressVideos, notWatchedVideos }
                });
                resolve();
            } catch (error) {
                handleError(res, error, 'Error handling reminders');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
