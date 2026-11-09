import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import api from '../api';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', tags: '', pinned: false });
  const [aiEnabled, setAiEnabled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
    api.get('/ai/status').then((res) => setAiEnabled(!!res.data?.data?.enabled)).catch(() => {});
  }, []);

  const askAI = (note) =>
    navigate(`/assistant?contextType=note&contextId=${note._id}&title=${encodeURIComponent(note.title)}&prompt=${encodeURIComponent('Summarize this note and expand on it')}`);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notes');
      setNotes(response.data.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      content: formData.content,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      pinned: formData.pinned,
    };
    try {
      if (editingId) {
        await api.put(`/notes/${editingId}`, payload);
      } else {
        await api.post('/notes', payload);
      }
      setShowModal(false);
      resetForm();
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const togglePin = async (note) => {
    try {
      await api.put(`/notes/${note._id}`, { pinned: !note.pinned });
      fetchNotes();
    } catch (error) {
      console.error('Error pinning note:', error);
    }
  };

  const handleEdit = (note) => {
    setFormData({
      title: note.title,
      content: note.content || '',
      tags: (note.tags || []).join(', '),
      pinned: note.pinned,
    });
    setEditingId(note._id);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ title: '', content: '', tags: '', pinned: false });
  };

  const handleDelete = async () => {
    if (noteToDelete) {
      try {
        await api.delete(`/notes/${noteToDelete._id}`);
        setShowDeleteModal(false);
        setNoteToDelete(null);
        fetchNotes();
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="neo-spinner" style={{ width: '48px', height: '48px', borderWidth: '4px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="neo-container py-16">
        <div className="flex justify-between items-center mb-12 neo-animate-in">
          <div>
            <h1 className="neo-title text-5xl mb-2">Notes</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Thoughts, snippets, and things worth remembering
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="neo-btn neo-btn-primary"
          >
            <span className="mr-2">✍️</span>
            New note
          </button>
        </div>

        {notes.length === 0 ? (
          <EmptyState
            icon="📝"
            iconColor="neo-icon-yellow"
            title="No notes yet"
            description="Capture ideas, snippets, and anything you'd rather not forget — they're instantly searchable across your whole memory."
            actions={[
              { label: '✍️ Write your first note', variant: 'primary', onClick: () => { resetForm(); setShowModal(true); } },
              { label: '⚡ Quick capture', variant: 'secondary', to: '/capture' },
            ]}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note, index) => (
              <div
                key={note._id}
                className={`neo-card-sm neo-animate-in stagger-${Math.min((index % 4) + 1, 4) * 100}`}
                style={note.pinned ? { borderColor: 'var(--accent-yellow)' } : undefined}
              >
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {note.pinned && <span className="mr-1">📌</span>}
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => togglePin(note)}
                      className="p-2 rounded-lg hover:bg-yellow-100 transition-all text-lg leading-none"
                      title={note.pinned ? 'Unpin' : 'Pin note'}
                      style={{ color: note.pinned ? '#e67700' : 'var(--text-muted)' }}
                    >
                      {note.pinned ? '★' : '☆'}
                    </button>
                    <button onClick={() => handleEdit(note)} className="p-2 rounded-lg hover:bg-yellow-100 transition-colors" title="Edit">
                      <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => { setNoteToDelete(note); setShowDeleteModal(true); }} className="p-2 rounded-lg hover:bg-red-100 transition-colors" title="Delete">
                      <svg className="w-5 h-5" style={{ color: '#c92a2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {note.content && (
                  <p className="text-sm mb-3 whitespace-pre-wrap line-clamp-4" style={{ color: 'var(--text-secondary)' }}>
                    {note.content}
                  </p>
                )}

                {note.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag) => (
                      <span key={tag} className="neo-badge neo-badge-white text-xs">#{tag}</span>
                    ))}
                  </div>
                )}

                {aiEnabled && (
                  <button onClick={() => askAI(note)} className="text-xs font-bold neo-link mt-3">
                    🤖 Ask AI about this note
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Note modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 neo-animate-in" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="neo-card max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2 className="neo-title text-3xl mb-8">{editingId ? 'Edit note' : 'New note'}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="neo-input"
                    placeholder="What should this note be about?"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="neo-textarea"
                    rows="7"
                    placeholder="Write it down — searchable from anywhere in ReMember…"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Tags</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="neo-input"
                    placeholder="comma, separated, tags"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.pinned}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="w-5 h-5 accent-current cursor-pointer"
                  />
                  <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>📌 Pin this note</span>
                </label>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="neo-btn neo-btn-primary flex-1">{editingId ? 'Update' : 'Save'}</button>
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="neo-btn neo-btn-secondary flex-1">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {showDeleteModal && noteToDelete && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 neo-animate-in" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="neo-card max-w-md w-full">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🗑️</div>
                <h2 className="neo-title text-3xl mb-3">Delete note?</h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Are you sure you want to delete <strong>{noteToDelete.title}</strong>? This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteModal(false); setNoteToDelete(null); }} className="neo-btn neo-btn-secondary flex-1">Cancel</button>
                <button onClick={handleDelete} className="neo-btn flex-1" style={{ background: '#c92a2a', borderColor: '#5c0a0a', color: 'white' }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;
