import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-md w-full neo-animate-in">
        {/* Logo & Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="neo-logo" style={{ width: '64px', height: '64px', background: 'var(--accent-coral)' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
          </div>
          <h1 className="neo-title text-5xl mb-3">ReMember</h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Welcome back to your vault</p>
        </div>

        {/* Login Card */}
        <div className="neo-card mb-6">
          {error && (
            <div className="neo-alert neo-alert-error mb-6">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2.5" style={{ color: 'var(--text-primary)' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neo-input"
                placeholder="you@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-2.5" style={{ color: 'var(--text-primary)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neo-input"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="neo-btn neo-btn-primary w-full mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="neo-spinner"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="neo-link">
              Create one
            </Link>
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="mt-12 flex items-center justify-center gap-8 text-sm">
          {[
            { icon: '🔐', label: 'Encrypted', color: 'var(--accent-blue)' },
            { icon: '⚡', label: 'Fast', color: 'var(--accent-yellow)' },
            { icon: '✨', label: 'Beautiful', color: 'var(--accent-pink)' }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="text-3xl">{item.icon}</div>
              <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Login;
