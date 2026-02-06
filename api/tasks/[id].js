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

                const { id } = req.query;

                if (req.method === 'GET') {
                    const task = await Task.findOne({
                        _id: id,
                        userId: req.userId
                    });

                    if (!task) {
                        res.status(404).json({
                            success: false,
                            message: 'Task not found'
                        });
                        return resolve();
                    }

                    res.json({
                        success: true,
                        data: task
                    });
                } else if (req.method === 'PUT') {
                    const task = await Task.findOne({
                        _id: id,
                        userId: req.userId
                    });

                    if (!task) {
                        res.status(404).json({
                            success: false,
                            message: 'Task not found'
                        });
                        return resolve();
                    }

                    const { title, description, dueDate, priority, status, tags } = req.body;

                    if (title) task.title = title;
                    if (description !== undefined) task.description = description;
                    if (dueDate !== undefined) task.dueDate = dueDate;
                    if (priority) task.priority = priority;
                    if (status) task.status = status;
                    if (tags !== undefined) task.tags = tags;

                    await task.save();

                    res.json({
                        success: true,
                        message: 'Task updated successfully',
                        data: task
                    });
                } else if (req.method === 'DELETE') {
                    const task = await Task.findOneAndDelete({
                        _id: id,
                        userId: req.userId
                    });

                    if (!task) {
                        res.status(404).json({
                            success: false,
                            message: 'Task not found'
                        });
                        return resolve();
                    }

                    res.json({
                        success: true,
                        message: 'Task deleted successfully'
                    });
                } else {
                    res.status(405).json({ success: false, message: 'Method not allowed' });
                }
                resolve();
            } catch (error) {
                handleError(res, error, 'Error with task operation');
                resolve();
            }
        });
    });
}

module.exports = allowCors(handler);
