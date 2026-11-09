import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import api from '../api';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', dueDate: '', priority: 'medium', status: 'pending' });
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/tasks/${editingId}`, formData);
      } else {
        await api.post('/tasks', formData);
      }
      setShowModal(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const toggleStatus = async (task) => {
    try {
      await api.put(`/tasks/${task._id}`, {
        status: task.status === 'pending' ? 'completed' : 'pending'
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const confirmDelete = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (taskToDelete) {
      try {
        await api.delete(`/tasks/${taskToDelete._id}`);
        setShowDeleteModal(false);
        setTaskToDelete(null);
        fetchTasks();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', dueDate: '', priority: 'medium' });
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'pending') return task.status === 'pending';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  const priorityColors = {
    high: 'neo-badge-pink',
    medium: 'neo-badge-yellow',
    low: 'neo-badge-blue'
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      <main className="neo-container py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 neo-animate-in">
          <div>
            <h1 className="neo-title text-5xl mb-2">Tasks</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              {pendingCount > 0 ? `${pendingCount} pending` : 'All caught up! ✨'}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="neo-btn neo-btn-primary"
          >
            <span className="mr-2">➕</span>
            Add task
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-8">
          {[
            { key: 'all', label: 'All', count: tasks.length, color: 'white' },
            { key: 'pending', label: 'Pending', count: pendingCount, color: 'yellow' },
            { key: 'completed', label: 'Done', count: completedCount, color: 'green' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`neo-btn neo-btn-sm ${filter === tab.key ? `neo-btn-${tab.color}` : 'neo-btn-secondary'}`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon="📝"
            iconColor="neo-icon-pink"
            title={filter === 'completed' ? 'Nothing done yet' : 'No tasks here'}
            description={
              filter === 'completed'
                ? 'Tasks you complete will show up in this view.'
                : 'Add a task with a due date and priority — ReMember will remind you before it slips your mind.'
            }
            actions={[
              { label: '➕ Create a task', variant: 'primary', onClick: () => { resetForm(); setShowModal(true); } },
              { label: '⚡ Quick capture', variant: 'secondary', to: '/capture' },
            ]}
          />
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task, index) => (
              <div
                key={task._id}
                className={`neo-card-sm flex items-start gap-4 group neo-animate-in stagger-${Math.min((index % 4) + 1, 4) * 100}`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => toggleStatus(task)}
                  className="flex-shrink-0 mt-1"
                >
                  <div
                    className="w-6 h-6 rounded-lg border-3 flex items-center justify-center transition-all"
                    style={{
                      borderWidth: '3px',
                      borderColor: task.status === 'completed' ? 'var(--accent-green)' : 'var(--border-primary)',
                      background: task.status === 'completed' ? 'var(--accent-green)' : 'white',
                      boxShadow: task.status === 'completed' ? '2px 2px 0px 0px var(--border-primary)' : 'none'
                    }}
                  >
                    {task.status === 'completed' && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-lg mb-1 ${task.status === 'completed' ? 'line-through' : ''}`}
                    style={{ color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{task.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`neo-badge ${priorityColors[task.priority]}`}>
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                        📅 {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingId(task._id);
                      setFormData({
                        title: task.title,
                        description: task.description || '',
                        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
                        priority: task.priority
                      });
                      setShowModal(true);
                    }}
                    className="p-2 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => confirmDelete(task)}
                    className="p-2 rounded-lg hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-5 h-5" style={{ color: '#c92a2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 neo-animate-in" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="neo-card max-w-lg w-full">
              <h2 className="neo-title text-3xl mb-8">
                {editingId ? 'Edit task' : 'New task'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="neo-input"
                    placeholder="What needs to be done?"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="neo-textarea"
                    rows="3"
                    placeholder="Additional details..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Due date
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="neo-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="neo-select"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="neo-btn neo-btn-primary flex-1">
                    {editingId ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="neo-btn neo-btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && taskToDelete && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 neo-animate-in" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="neo-card max-w-md w-full">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🗑️</div>
                <h2 className="neo-title text-3xl mb-3">Delete Task?</h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Are you sure you want to delete <strong>{taskToDelete.title}</strong>? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setTaskToDelete(null);
                  }}
                  className="neo-btn neo-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="neo-btn flex-1"
                  style={{
                    background: '#c92a2a',
                    borderColor: '#5c0a0a',
                    color: 'white'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Tasks;
