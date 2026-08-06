import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api';

const Websites = () => {
  const [websites, setWebsites] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [websiteToDelete, setWebsiteToDelete] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', url: '', description: '', category: 'other' });

  useEffect(() => {
    fetchWebsites();
  }, []);

  const fetchWebsites = async () => {
    try {
      const response = await api.get('/websites');
      setWebsites(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/websites/${editingId}`, formData);
      } else {
        await api.post('/websites', formData);
      }
      setShowModal(false);
      resetForm();
      fetchWebsites();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving website');
    }
  };

  const handleEdit = (website) => {
    setFormData({
      name: website.name,
      url: website.url,
      description: website.description || '',
      category: website.category || 'other',
    });
    setEditingId(website._id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', url: '', description: '', category: 'other' });
    setEditingId(null);
  };

  const toggleFavorite = async (website) => {
    try {
      await api.put(`/websites/${website._id}`, { isFavorite: !website.isFavorite });
      fetchWebsites();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update favorite');
    }
  };

  const confirmDelete = (website) => {
    setWebsiteToDelete(website);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (websiteToDelete) {
      try {
        await api.delete(`/websites/${websiteToDelete._id}`);
        setShowDeleteModal(false);
        setWebsiteToDelete(null);
        fetchWebsites();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const categoryColors = {
    ai: 'neo-badge-purple',
    productivity: 'neo-badge-blue',
    learning: 'neo-badge-green',
    utilities: 'neo-badge-yellow',
    development: 'neo-badge-pink',
    design: 'neo-badge-purple',
    other: 'neo-badge-white'
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="neo-container py-16">
        <div className="flex justify-between items-center mb-12 neo-animate-in">
          <div>
            <h1 className="neo-title text-5xl mb-2">Websites & AI Memory</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Remember useful websites and tools</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="neo-btn neo-btn-primary"
          >
            <span className="mr-2">🔖</span>
            Add Website
          </button>
        </div>

        {websites.length === 0 ? (
          <div className="text-center py-24 neo-card">
            <div className="text-6xl mb-6">🌐</div>
            <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>No websites saved yet</p>
            <button onClick={() => setShowModal(true)} className="neo-btn neo-btn-blue">
              Add your first website
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((website, index) => (
              <div key={website._id} className={`neo-card-sm neo-animate-in stagger-${Math.min((index % 4) + 1, 4) * 100}`}>
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{website.name}</h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleFavorite(website)}
                      className="p-2 rounded-lg hover:bg-yellow-100 transition-all text-xl leading-none"
                      title={website.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      style={{ color: website.isFavorite ? '#e67700' : 'var(--text-muted)' }}
                    >
                      {website.isFavorite ? '★' : '☆'}
                    </button>
                    <button onClick={() => handleEdit(website)} className="p-2 rounded-lg hover:bg-yellow-100 transition-colors" title="Edit">
                      <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => confirmDelete(website)} className="p-2 rounded-lg hover:bg-red-100 transition-colors" title="Delete">
                      <svg className="w-5 h-5" style={{ color: '#c92a2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {website.description && (
                  <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{website.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className={`neo-badge ${categoryColors[website.category]}`}>
                    {website.category}
                  </span>
                  <a
                    href={website.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="neo-link text-sm flex items-center space-x-1"
                  >
                    <span>Visit</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 neo-animate-in" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="neo-card max-w-md w-full">
              <h2 className="neo-title text-3xl mb-8">{editingId ? 'Edit Website' : 'Add Website'}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="neo-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>URL *</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="neo-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="neo-textarea"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="neo-select"
                  >
                    <option value="other">Other</option>
                    <option value="ai">AI</option>
                    <option value="productivity">Productivity</option>
                    <option value="learning">Learning</option>
                    <option value="utilities">Utilities</option>
                    <option value="development">Development</option>
                    <option value="design">Design</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="neo-btn neo-btn-primary flex-1">{editingId ? 'Update' : 'Save'}</button>
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="neo-btn neo-btn-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && websiteToDelete && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 neo-animate-in" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="neo-card max-w-md w-full">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🗑️</div>
                <h2 className="neo-title text-3xl mb-3">Delete Website?</h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Are you sure you want to delete <strong>{websiteToDelete.name}</strong>? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setWebsiteToDelete(null);
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
      </div>
    </div>
  );
};

export default Websites;
