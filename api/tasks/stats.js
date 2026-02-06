const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Task = require('../../server/models/Task');

async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                const totalTasks = await Task.countDocuments({ userId: req.userId });
                const pendingTasks = await Task.countDocuments({ userId: req.userId, status: 'pending' });
                const completedTasks = await Task.countDocuments({ userId: req.userId, status: 'completed' });
                const highPriorityTasks = await Task.countDocuments({
                    userId: req.userId,
                    status: 'pending',
                    priority: 'high'
                });

                res.json({
                    success: true,
                    data: {
                        total: totalTasks,
                        pending: pendingTasks,
                        completed: completedTasks,
                        highPriority: highPriorityTasks
                    }
                });
                resolve();
            } catch (error) {
                handleError(res, error, 'Error fetching task statistics');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
