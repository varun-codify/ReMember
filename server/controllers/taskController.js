const Task = require('../models/Task');

// @route   GET /api/tasks
// @desc    Get all tasks for user
// @access  Private
exports.getAllTasks = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks'
    });
  }
};

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task'
    });
  }
};

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, tags } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required'
      });
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
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task'
    });
  }
};

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
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
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task'
    });
  }
};

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task'
    });
  }
};

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private
exports.getTaskStats = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task statistics'
    });
  }
};
