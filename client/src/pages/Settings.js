import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const Settings = () => {
  const { user } = useAuth();
  const [passkey, setPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSetPasskey = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (passkey !== confirmPasskey) {
      setError('Passkeys do not match');
      return;
    }

    if (passkey.length < 4) {
      setError('Passkey must be at least 4 characters');
      return;
    }

    try {
      await api.post('/auth/vault-passkey', { passkey });
      setMessage('Vault passkey set successfully');
      setPasskey('');
      setConfirmPasskey('');
    } catch (error) {
      setError(error.response?.data?.message || 'Error setting passkey');
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />
      <div className="neo-container py-16">
        <h1 className="neo-title text-5xl mb-12 neo-animate-in">Settings</h1>

        <div className="space-y-6 max-w-3xl">
          {/* Profile Info */}
          <div className="neo-card neo-animate-in stagger-100">
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
              </div>
              <div>
                <label className="text-sm font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Email</label>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Vault Passkey */}
          <div className="neo-card neo-animate-in stagger-200">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Vault Security</h2>
            <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Set a passkey to protect your password vault. You'll need to enter this passkey to access your saved passwords.
            </p>

            {message && (
              <div className="neo-alert neo-alert-success mb-6">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="font-bold">{message}</p>
              </div>
            )}

            {error && (
              <div className="neo-alert neo-alert-error mb-6">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-bold">{error}</p>
              </div>
            )}

            <form onSubmit={handleSetPasskey} className="space-y-5">
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>New Passkey</label>
                <input
                  type="password"
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  className="neo-input"
                  placeholder="Enter new passkey"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Confirm Passkey</label>
                <input
                  type="password"
                  value={confirmPasskey}
                  onChange={(e) => setConfirmPasskey(e.target.value)}
                  className="neo-input"
                  placeholder="Confirm new passkey"
                />
              </div>
              <button
                type="submit"
                className="neo-btn neo-btn-primary"
              >
                {user?.hasVaultPasskey ? 'Update Passkey' : 'Set Passkey'}
              </button>
            </form>
          </div>

          {/* Security Notice */}
          <div className="neo-card neo-animate-in stagger-300" style={{ borderColor: 'var(--accent-yellow)' }}>
            <h2 className="text-2xl font-bold mb-4 flex items-center" style={{ color: 'var(--text-primary)' }}>
              <span className="text-3xl mr-2">⚠️</span>
              Security Notice
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              This is a personal-use security implementation. For production or enterprise use, consider:
            </p>
            <ul className="list-disc list-inside text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <li>Two-factor authentication</li>
              <li>Enhanced encryption algorithms</li>
              <li>Security audit logging</li>
              <li>Rate limiting on authentication</li>
              <li>HTTPS enforcement</li>
            </ul>
          </div>

          {/* App Info */}
          <div className="neo-card neo-animate-in stagger-400">
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>About ReMember</h2>
            <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
              Version 1.0.0 - Personal Digital Memory Vault
            </p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              A MERN stack application for managing passwords, tasks, videos, and useful websites.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
