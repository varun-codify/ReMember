import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReminderBell from './ReminderBell';
import { toggleTheme, isDark } from '../utils/theme';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dark, setDark] = useState(isDark());

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '◆' },
    { path: '/passwords', label: 'Vault', icon: '🔐' },
    { path: '/tasks', label: 'Tasks', icon: '✓' },
    { path: '/videos', label: 'Videos', icon: '▶' },
    { path: '/websites', label: 'Links', icon: '🔗' },
    { path: '/notes', label: 'Notes', icon: '📝' },
    { path: '/collections', label: 'Collections', icon: '🗂' },
    { path: '/assistant', label: 'AI', icon: '🤖' },
    { path: '/knowledge', label: 'Graph', icon: '🕸' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: 'var(--bg-card)',
      borderBottom: '3px solid var(--border-primary)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="neo-container">
        <div className="flex items-center justify-between h-20 gap-3">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 flex-shrink-0">
            <div className="neo-logo" style={{ width: '40px', height: '40px', background: 'var(--accent-coral)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <span className="neo-title text-xl hidden sm:block">ReMember</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all"
                style={isActive(item.path) ? {
                  background: 'var(--accent-yellow)',
                  color: 'var(--text-primary)',
                  border: '2.5px solid var(--border-primary)',
                  boxShadow: 'var(--shadow-sm)',
                  transform: 'translate(-1px, -1px)'
                } : {
                  color: 'var(--text-secondary)',
                  border: '2.5px solid transparent'
                }}
              >
                <span className="text-base">{item.icon}</span>
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Search (desktop) */}
          <form onSubmit={handleSearch} className="hidden xl:flex items-center flex-1 max-w-xs relative" role="search">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your memory…"
              className="neo-input w-full"
              style={{ paddingRight: '42px' }}
              aria-label="Search"
            />
            <button
              type="submit"
              className="absolute right-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-lg" style={{
              background: 'var(--bg-secondary)',
              border: '2.5px solid var(--border-light)'
            }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white border-2 border-white" style={{
                background: 'var(--accent-pink)'
              }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-bold hidden xl:inline" style={{ color: 'var(--text-primary)' }}>{user?.name}</span>
            </div>

            <button
              onClick={() => setDark(toggleTheme())}
              className="p-2.5 rounded-lg transition-all hover:bg-gray-100 text-lg leading-none"
              style={{ color: 'var(--text-secondary)' }}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle color theme"
            >
              {dark ? '☀️' : '🌙'}
            </button>

            <ReminderBell />

            <Link
              to="/capture"
              className="p-2.5 rounded-lg transition-all hover:bg-gray-100 text-lg leading-none"
              style={{ color: 'var(--text-secondary)' }}
              title="Quick capture"
            >
              ＋
            </Link>

            <Link
              to="/settings"
              className="p-2.5 rounded-lg transition-all hover:bg-gray-100"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>

            <button
              onClick={handleLogout}
              className="hidden md:block neo-btn neo-btn-sm"
              style={{
                background: '#ffe0e0',
                color: '#c92a2a',
                borderColor: 'var(--border-primary)'
              }}
            >
              Logout
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-lg font-bold text-xl"
              style={{ color: 'var(--text-primary)' }}
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden" style={{ borderTop: '3px solid var(--border-primary)', background: 'var(--bg-card)' }}>
          <div className="neo-container py-4 space-y-2">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your memory…"
                className="neo-input"
                aria-label="Search"
              />
              <button type="submit" className="neo-btn neo-btn-sm neo-btn-primary">🔍</button>
            </form>

            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all"
                style={isActive(item.path) ? {
                  background: 'var(--accent-yellow)',
                  color: 'var(--text-primary)',
                  border: '2.5px solid var(--border-primary)',
                  boxShadow: 'var(--shadow-sm)'
                } : {
                  color: 'var(--text-secondary)',
                  border: '2.5px solid transparent'
                }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}

            <Link
              to="/capture"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg font-bold"
              style={{ color: 'var(--text-secondary)', border: '2.5px solid var(--border-light)' }}
            >
              <span className="text-lg">＋</span>
              Quick capture
            </Link>

            <button
              onClick={() => setDark(toggleTheme())}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold"
              style={{ color: 'var(--text-secondary)', border: '2.5px solid var(--border-light)' }}
            >
              <span className="text-lg">{dark ? '☀️' : '🌙'}</span>
              {dark ? 'Light mode' : 'Dark mode'}
            </button>

            <button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold"
              style={{
                background: '#ffe0e0',
                color: '#c92a2a',
                border: '2.5px solid var(--border-primary)'
              }}
            >
              <span>→</span>
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
