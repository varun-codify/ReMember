import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const PasswordVault = () => {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(false);
  // Users without a vault passkey skip the lock screen entirely (the server
  // only requires the passkey when one is set).
  const [isUnlocked, setIsUnlocked] = useState(!user?.hasVaultPasskey);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordToDelete, setPasswordToDelete] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [passkeyError, setPasskeyError] = useState('');
  const [passkey, setPasskey] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({}); // Track which passwords are visible
  const [copiedId, setCopiedId] = useState(null); // Track which password was copied
  const [formData, setFormData] = useState({
    websiteName: '',
    username: '',
    password: '',
    category: 'other',
    websiteUrl: '',
    notes: '',
  });

  const fetchPasswords = async () => {
    try {
      setLoading(true);
      const res = await api.get('/passwords');
      setPasswords(res.data.data || []);
    } catch (err) {
      console.error('Fetch passwords error:', err);
      setError(err?.response?.data?.message || 'Failed to load passwords');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setPasskeyError('');
    try {
      await api.post('/auth/verify-vault-passkey', { passkey });
      setIsUnlocked(true);
      await fetchPasswords();
    } catch (err) {
      setPasskeyError(err?.response?.data?.message || 'Invalid passkey');
    }
  };

  // Re-lock the vault when the server rejects the passkey (e.g. it was
  // changed elsewhere, or the session needs re-verification).
  const handleVaultError = (err) => {
    setPasskeyError(err?.response?.data?.message || 'Vault verification failed');
    setIsUnlocked(false);
    setPasskey('');
    setVisiblePasswords({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/passwords/${editingId}`, formData);
      } else {
        await api.post('/passwords', formData);
      }
      await fetchPasswords();
      setShowModal(false);
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save password');
    }
  };

  const handleEdit = (password) => {
    setFormData({
      websiteName: password.websiteName,
      username: password.username,
      password: '',
      category: password.category || 'other',
      websiteUrl: password.websiteUrl || '',
      notes: password.notes || '',
    });
    setEditingId(password._id);
    setShowModal(true);
  };

  const confirmDelete = (password) => {
    setPasswordToDelete(password);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (passwordToDelete) {
      try {
        await api.delete(`/passwords/${passwordToDelete._id}`);
        setShowDeleteModal(false);
        setPasswordToDelete(null);
        await fetchPasswords();
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to delete password');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      websiteName: '',
      username: '',
      password: '',
      category: 'other',
      websiteUrl: '',
      notes: '',
    });
    setEditingId(null);
  };

  const togglePasswordVisibility = async (passwordId) => {
    if (visiblePasswords[passwordId]) {
      // Hide password
      setVisiblePasswords(prev => ({ ...prev, [passwordId]: null }));
    } else {
      // Fetch and show password (server requires the vault passkey to decrypt)
      try {
        const res = await api.get(`/passwords/${passwordId}`, {
          headers: { 'X-Vault-Passkey': passkey }
        });
        setVisiblePasswords(prev => ({
          ...prev,
          [passwordId]: res.data.data.decryptedPassword
        }));
      } catch (err) {
        if (err?.response?.status === 403) {
          handleVaultError(err);
        } else {
          setError(err?.response?.data?.message || 'Failed to decrypt password');
        }
      }
    }
  };

  const copyToClipboard = async (passwordId) => {
    try {
      if (!visiblePasswords[passwordId]) {
        // Fetch password first (server requires the vault passkey to decrypt)
        const res = await api.get(`/passwords/${passwordId}`, {
          headers: { 'X-Vault-Passkey': passkey }
        });
        const decryptedPassword = res.data.data.decryptedPassword;
        await navigator.clipboard.writeText(decryptedPassword);
      } else {
        await navigator.clipboard.writeText(visiblePasswords[passwordId]);
      }

      setCopiedId(passwordId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      if (err?.response?.status === 403) {
        handleVaultError(err);
      } else {
        setError('Failed to copy password');
      }
    }
  };

  const categoryColors = {
    social: 'neo-badge-pink',
    work: 'neo-badge-blue',
    finance: 'neo-badge-green',
    shopping: 'neo-badge-yellow',
    entertainment: 'neo-badge-purple',
    other: 'neo-badge-white'
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

  if (!isUnlocked) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh] p-6">
          <div className="neo-card max-w-md w-full neo-animate-in">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center mb-6">
                <div className="neo-icon neo-icon-coral" style={{ width: '64px', height: '64px' }}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <h2 className="neo-title text-4xl mb-3">Vault Locked</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Enter your vault passkey to access</p>
            </div>

            <form onSubmit={handleUnlock}>
              {passkeyError && (
                <div className="neo-alert neo-alert-error mb-6">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-bold">{passkeyError}</p>
                </div>
              )}

              <input
                type="password"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                placeholder="Enter passkey"
                className="neo-input mb-6"
                required
              />

              <button
                type="submit"
                className="neo-btn neo-btn-primary w-full"
              >
                🔓 Unlock Vault
              </button>
            </form>

            <p className="text-xs text-center mt-6" style={{ color: 'var(--text-muted)' }}>
              Set your vault passkey in Settings if you haven't already.
            </p>
          </div>
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
            <h1 className="neo-title text-5xl mb-2">Password Vault</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Securely manage your passwords</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="neo-btn neo-btn-primary"
          >
            <span className="mr-2">➕</span>
            Add Password
          </button>
        </div>

        {error && (
          <div className="neo-alert neo-alert-error mb-6">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-bold">{error}</p>
          </div>
        )}

        {passwords.length === 0 ? (
          <div className="text-center py-24 neo-card">
            <div className="text-6xl mb-6">🔐</div>
            <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>No passwords saved yet</p>
            <button onClick={() => { resetForm(); setShowModal(true); }} className="neo-btn neo-btn-blue">
              Add your first password
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {passwords.map((password, index) => (
              <div key={password._id} className={`neo-card-sm neo-animate-in stagger-${Math.min((index % 4) + 1, 4) * 100}`}>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{password.websiteName}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(password)} className="p-2 rounded-lg hover:bg-yellow-100 transition-colors">
                      <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => confirmDelete(password)} className="p-2 rounded-lg hover:bg-red-100 transition-colors">
                      <svg className="w-5 h-5" style={{ color: '#c92a2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span className="font-bold">Username:</span> <span style={{ color: 'var(--text-primary)' }}>{password.username}</span>
                  </p>

                  {/* Password Field with Show/Hide and Copy */}
                  <div className="neo-card-sm" style={{ background: 'var(--bg-tertiary)', padding: '12px' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Password:</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => togglePasswordVisibility(password._id)}
                          className="p-1.5 rounded-lg hover:bg-blue-100 transition-all"
                          title={visiblePasswords[password._id] ? 'Hide password' : 'Show password'}
                        >
                          {visiblePasswords[password._id] ? (
                            <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(password._id)}
                          className="p-1.5 rounded-lg hover:bg-green-100 transition-all"
                          title="Copy password"
                        >
                          {copiedId === password._id ? (
                            <svg className="w-5 h-5" style={{ color: '#2f9e44' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                    <div
                      className="text-sm font-mono px-3 py-2 rounded-lg neo-animate-in"
                      style={{
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        wordBreak: 'break-all',
                        border: '2px solid var(--border-color)'
                      }}
                    >
                      {visiblePasswords[password._id] || '••••••••••••'}
                    </div>
                    {copiedId === password._id && (
                      <p className="text-xs mt-2 neo-animate-in" style={{ color: '#2f9e44', fontWeight: 'bold' }}>
                        ✓ Copied to clipboard!
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`neo-badge ${categoryColors[password.category]}`}>
                      {password.category}
                    </span>
                  </div>
                  {password.websiteUrl && (
                    <a href={password.websiteUrl} target="_blank" rel="noopener noreferrer" className="neo-link text-sm block">
                      Visit Site →
                    </a>
                  )}
                  {password.notes && <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{password.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 neo-animate-in" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="neo-card max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="neo-title text-3xl mb-8">
                {editingId ? 'Edit Password' : 'Add Password'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Website Name *</label>
                  <input
                    type="text"
                    value={formData.websiteName}
                    onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
                    className="neo-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Website URL</label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="neo-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Username/Email *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="neo-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="neo-input"
                    required={!editingId}
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
                    <option value="social">Social</option>
                    <option value="work">Work</option>
                    <option value="finance">Finance</option>
                    <option value="shopping">Shopping</option>
                    <option value="entertainment">Entertainment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="neo-textarea"
                    rows="3"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="neo-btn neo-btn-primary flex-1"
                  >
                    {editingId ? 'Update' : 'Save'}
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
        {showDeleteModal && passwordToDelete && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 neo-animate-in" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="neo-card max-w-md w-full">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🗑️</div>
                <h2 className="neo-title text-3xl mb-3">Delete Password?</h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Are you sure you want to delete the password for <strong>{passwordToDelete.websiteName}</strong>? This action cannot be undone.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPasswordToDelete(null);
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

export default PasswordVault;
