const connectToDatabase = require('../_utils/db');
const allowCors = require('../_utils/cors');
const handleError = require('../_utils/errorHandler');
const authMiddleware = require('../_middleware/auth');
const Task = require('../../server/models/Task');

async function handler(req, res) {
    return new Promise((resolve) => {
        authMiddleware(req, res, async () => {
            try {
                await connectToDatabase();

                if (req.method === 'GET') {
                    const { status, priority } = req.query;

                    const filter = { userId: req.userId };
                    if (status) filter.status = status;
                    if (priority) filter.priority = priority;

                    const tasks = await Task.find(filter).sort({ createdAt: -1 });

                    res.json({
                        success: true,
                        count: tasks.length,
                        data: tasks
                    });
                } else if (req.method === 'POST') {
                    const { title, description, dueDate, priority, tags } = req.body;

                    if (!title) {
                        res.status(400).json({
                            success: false,
                            message: 'Task title is required'
                        });
                        return resolve();
                    }

                    const task = new Task({
                        userId: req.userId,
                        title,
                        description,
                        dueDate,
                        priority: priority || 'medium',
                        tags
                    });

                    await task.save();

                    res.status(201).json({
                        success: true,
                        message: 'Task created successfully',
                        data: task
                    });
                } else {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error with tasks');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
