import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import api from '../api';
import SafeExternalLink from '../components/SafeExternalLink';

const ICONS = ['🗂', '⭐', '🎯', '📚', '💡', '🚀', '🔬', '🎨', '💼', '🧠', '🔥', '📌'];
const COLORS = ['blue', 'pink', 'green', 'yellow', 'coral', 'purple'];
const TYPES = ['video', 'website', 'note'];
const CATEGORIES = ['ai', 'productivity', 'learning', 'utilities', 'development', 'design', 'other'];

const TYPE_META = { video: { icon: '▶', label: 'Videos', href: '/videos' }, website: { icon: '🔗', label: 'Websites', href: '/websites' }, note: { icon: '📝', label: 'Notes', href: '/notes' } };

const Collections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '🗂',
    color: 'blue',
    rule: { types: [], categories: [], tags: '', favoritesOnly: false },
  });
  // Detail view
  const [active, setActive] = useState(null);
  const [items, setItems] = useState(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/collections');
      setCollections(res.data.data);
    } catch (error) {
      console.error('Error fetching collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCollection = async (collection) => {
    setActive(collection);
    setItems(null);
    try {
      const res = await api.get(`/collections/${collection._id}/items`);
      setItems(res.data.data);
    } catch (error) {
      console.error('Error fetching collection items:', error);
      setItems({ videos: [], websites: [], notes: [] });
    }
  };

  const closeDetail = () => {
    setActive(null);
    setItems(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      icon: formData.icon,
      color: formData.color,
      rule: {
        types: formData.rule.types,
        categories: formData.rule.categories,
        tags: formData.rule.tags.split(',').map((t) => t.trim()).filter(Boolean),
        favoritesOnly: formData.rule.favoritesOnly,
      },
    };
    try {
      if (editingId) {
        await api.put(`/collections/${editingId}`, payload);
      } else {
        await api.post('/collections', payload);
      }
      setShowModal(false);
      resetForm();
      fetchCollections();
    } catch (error) {
      console.error('Error saving collection:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', icon: '🗂', color: 'blue', rule: { types: [], categories: [], tags: '', favoritesOnly: false } });
  };

  const handleDelete = async () => {
    if (collectionToDelete) {
      try {
        await api.delete(`/collections/${collectionToDelete._id}`);
        setShowDeleteModal(false);
        setCollectionToDelete(null);
        fetchCollections();
      } catch (error) {
        console.error('Error deleting collection:', error);
      }
    }
  };

  const ruleChips = (rule) => {
    const chips = [];
    if (rule.types?.length) chips.push(...rule.types.map((t) => TYPE_META[t]?.label || t));
    if (rule.categories?.length) chips.push(...rule.categories.map((c) => c));
    if (rule.tags?.length) chips.push(...rule.tags.slice(0, 3).map((t) => `#${t}`));
    if (rule.favoritesOnly) chips.push('★ favorites');
    return chips.length ? chips.slice(0, 5) : ['everything'];
  };

  const itemCount = (group) => (group ? group.length : 0);

  const toggleIn = (arr, value) => (arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);

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
            <h1 className="neo-title text-5xl mb-2">Smart Collections</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Rule-based views that stay up to date automatically
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="neo-btn neo-btn-primary"
          >
            <span className="mr-2">➕</span>
            New collection
          </button>
        </div>

        {active ? (
          /* ---------- Detail view ---------- */
          <div className="neo-animate-in">
            <button onClick={closeDetail} className="neo-link text-sm mb-6 flex items-center gap-1">
              ← All collections
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className={`neo-icon neo-icon-${active.color}`} style={{ width: '64px', height: '64px', fontSize: '1.75rem' }}>
                <span>{active.icon}</span>
              </div>
              <div>
                <h2 className="neo-title text-4xl">{active.name}</h2>
                <div className="flex flex-wrap gap-2 mt-3">
                  {ruleChips(active.rule).map((chip) => (
                    <span key={chip} className="neo-badge neo-badge-white text-xs">{chip}</span>
                  ))}
                </div>
              </div>
            </div>

            {items && itemCount(items.videos) + itemCount(items.websites) + itemCount(items.notes) === 0 ? (
              <EmptyState
                icon="🗂"
                iconColor="neo-icon-blue"
                title="Nothing matches this rule yet"
                description="Save a video, website, or note that fits the rule and it will show up here automatically."
                actions={[{ label: '⚡ Quick capture', variant: 'secondary', to: '/capture' }]}
              />
            ) : (
              <div className="space-y-8">
                {TYPES.filter((t) => active.rule.types.length === 0 || active.rule.types.includes(t)).map((type) => {
                  const group = items ? items[`${type}s`] : [];
                  if (!group || group.length === 0) return null;
                  return (
                    <div key={type} className="neo-card-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                          <span>{TYPE_META[type].icon}</span> {TYPE_META[type].label}
                          <span className="neo-badge neo-badge-white text-xs">{group.length}</span>
                        </h3>
                        <Link to={TYPE_META[type].href} className="neo-link text-sm">Open module →</Link>
                      </div>
                      <div className="space-y-1">
                        {group.map((item) => (
                          <div key={item._id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: 'var(--border-light)' }}>
                            <span className="text-base">{type === 'video' ? '🎬' : type === 'website' ? (item.mediaType === 'github' ? '🐙' : item.mediaType === 'pdf' ? '📄' : '🌐') : '📝'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate text-sm" style={{ color: 'var(--text-primary)' }}>
                                {item.title || item.name}
                              </p>
                              {item.summary && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.summary}</p>}
                            </div>
                            {type !== 'note' && (
                              <SafeExternalLink href={item.videoUrl || item.url} className="neo-link text-xs whitespace-nowrap">
                                Open ↗
                              </SafeExternalLink>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : collections.length === 0 ? (
          /* ---------- Empty ---------- */
          <EmptyState
            icon="🗂"
            iconColor="neo-icon-purple"
            title="No collections yet"
            description="Create a rule-based collection — for example “all AI tools”, “learning videos”, or “everything tagged #ideas” — and it fills itself automatically."
            actions={[{ label: '➕ Create a collection', variant: 'primary', onClick: () => { resetForm(); setShowModal(true); } }]}
          />
        ) : (
          /* ---------- Grid ---------- */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection, index) => (
              <div key={collection._id} className={`neo-card-sm neo-animate-in stagger-${Math.min((index % 4) + 1, 4) * 100} cursor-pointer`} onClick={() => openCollection(collection)}>
                <div className="flex justify-between items-start gap-2 mb-4">
                  <div className={`neo-icon neo-icon-${collection.color}`} style={{ width: '52px', height: '52px', fontSize: '1.5rem' }}>
                    <span>{collection.icon}</span>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setFormData({ name: collection.name, icon: collection.icon, color: collection.color, rule: { types: collection.rule?.types || [], categories: collection.rule?.categories || [], tags: (collection.rule?.tags || []).join(', '), favoritesOnly: collection.rule?.favoritesOnly } }); setEditingId(collection._id); setShowModal(true); }}
                      className="p-2 rounded-lg hover:bg-yellow-100 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => { setCollectionToDelete(collection); setShowDeleteModal(true); }} className="p-2 rounded-lg hover:bg-red-100 transition-colors" title="Delete">
                      <svg className="w-5 h-5" style={{ color: '#c92a2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{collection.name}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {ruleChips(collection.rule).map((chip) => (
                    <span key={chip} className="neo-badge neo-badge-white text-xs">{chip}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="neo-badge neo-badge-blue text-xs">{collection.count} items</span>
                  <span className="neo-link text-sm">View →</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Collection modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 neo-animate-in" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="neo-card max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <h2 className="neo-title text-3xl mb-8">{editingId ? 'Edit collection' : 'New collection'}</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="neo-input"
                    placeholder="e.g. AI tools I love"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className="w-10 h-10 rounded-lg text-lg transition-all"
                        style={formData.icon === icon ? { background: 'var(--accent-yellow)', border: '2.5px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' } : { border: '2.5px solid var(--border-light)' }}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Color</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className="w-10 h-10 rounded-lg transition-all"
                        style={{
                          background: `var(--accent-${color})`,
                          border: formData.color === color ? '3px solid var(--border-primary)' : '3px solid var(--border-light)',
                          boxShadow: formData.color === color ? 'var(--shadow-sm)' : 'none'
                        }}
                      >
                        {formData.color === color && <span className="text-white font-bold">✓</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Include types</label>
                  <div className="flex flex-wrap gap-2">
                    {TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, rule: { ...formData.rule, types: toggleIn(formData.rule.types, type) } })}
                        className={`neo-badge text-xs cursor-pointer ${formData.rule.types.includes(type) ? 'neo-badge-blue' : 'neo-badge-white'}`}
                      >
                        {TYPE_META[type].icon} {TYPE_META[type].label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Empty = all types</p>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Categories (websites)</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setFormData({ ...formData, rule: { ...formData.rule, categories: toggleIn(formData.rule.categories, category) } })}
                        className={`neo-badge text-xs cursor-pointer ${formData.rule.categories.includes(category) ? 'neo-badge-purple' : 'neo-badge-white'}`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Match tags</label>
                  <input
                    type="text"
                    value={formData.rule.tags}
                    onChange={(e) => setFormData({ ...formData, rule: { ...formData.rule, tags: e.target.value } })}
                    className="neo-input"
                    placeholder="comma, separated, tags"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.rule.favoritesOnly}
                    onChange={(e) => setFormData({ ...formData, rule: { ...formData.rule, favoritesOnly: e.target.checked } })}
                    className="w-5 h-5 accent-current cursor-pointer"
                  />
                  <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>★ Favorites only</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="neo-btn neo-btn-primary flex-1">{editingId ? 'Update' : 'Create'}</button>
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="neo-btn neo-btn-secondary flex-1">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {showDeleteModal && collectionToDelete && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 neo-animate-in" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="neo-card max-w-md w-full">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🗑️</div>
                <h2 className="neo-title text-3xl mb-3">Delete collection?</h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  “{collectionToDelete.name}” will be removed. Your saved items are never deleted.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteModal(false); setCollectionToDelete(null); }} className="neo-btn neo-btn-secondary flex-1">Cancel</button>
                <button onClick={handleDelete} className="neo-btn flex-1" style={{ background: '#c92a2a', borderColor: '#5c0a0a', color: 'white' }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Collections;
