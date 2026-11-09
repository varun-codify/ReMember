import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: '🔐',
    color: 'neo-icon-blue',
    title: 'Password Vault',
    description: 'Store credentials encrypted with your own vault passkey. Show, copy, and manage them safely.',
  },
  {
    icon: '✓',
    color: 'neo-icon-pink',
    title: 'Tasks & Reminders',
    description: 'Track tasks with due dates and priorities. Get reminded in-app, by email, or by push notification.',
  },
  {
    icon: '▶',
    color: 'neo-icon-green',
    title: 'Watch Later',
    description: 'Save YouTube videos with auto-fetched titles, thumbnails, and watch progress tracking.',
  },
  {
    icon: '🔗',
    color: 'neo-icon-yellow',
    title: 'Link Library',
    description: 'Bookmark useful websites and AI tools, tagged and categorized so you can always find them again.',
  },
  {
    icon: '🔎',
    color: 'neo-icon-coral',
    title: 'Global Search',
    description: 'One search box across passwords, tasks, videos, and links. Never dig for a memory again.',
  },
  {
    icon: '⚡',
    color: 'neo-icon-blue',
    title: 'Quick Capture',
    description: 'Save anything in two seconds with the bookmarklet — or just type it and let AI figure out the rest.',
  },
];

const Landing = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="neo-spinner" style={{ width: '48px', height: '48px', borderWidth: '4px' }}></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-50"
        style={{ background: 'var(--bg-card)', borderBottom: '3px solid var(--border-primary)' }}
      >
        <div className="neo-container flex items-center justify-between h-20">
          <div className="flex items-center gap-3">
            <div className="neo-logo" style={{ background: 'var(--accent-coral)' }}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <span className="neo-title text-2xl">ReMember</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="neo-btn neo-btn-secondary neo-btn-sm">Log in</Link>
            <Link to="/register" className="neo-btn neo-btn-primary neo-btn-sm">Get started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="neo-container py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div className="neo-animate-in">
            <div className="neo-badge neo-badge-yellow mb-6">🧠 Your digital memory</div>
            <h1 className="neo-title text-5xl md:text-7xl leading-tight mb-6">
              Never forget anything important{' '}
              <span style={{ color: 'var(--accent-coral)' }}>again.</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10" style={{ color: 'var(--text-secondary)' }}>
              Passwords, tasks, videos, and links — captured in seconds, found in one
              search, and remembered for you. Even AI helps you save things faster.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/register" className="neo-btn neo-btn-primary" style={{ fontSize: '1.0625rem', padding: '1rem 2.5rem' }}>
                ✨ Start remembering — free
              </Link>
              <Link to="/login" className="neo-btn neo-btn-secondary" style={{ fontSize: '1.0625rem', padding: '1rem 2.5rem' }}>
                I already have an account
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 mt-10">
              {['🔐 Encrypted vault', '🌙 Dark mode', '📱 Installable PWA', '🔔 Push reminders', '✨ AI capture'].map((chip) => (
                <span key={chip} className="neo-badge neo-badge-white">{chip}</span>
              ))}
            </div>
          </div>

          {/* Mock dashboard card */}
          <div className="neo-card neo-animate-in stagger-200" style={{ transform: 'rotate(1.5deg)' }}>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="neo-logo" style={{ width: '36px', height: '36px', background: 'var(--accent-coral)' }}>🧠</div>
                <span className="font-bold">ReMember</span>
              </div>
              <div className="neo-status neo-status-active"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Passwords', value: '12', color: 'neo-stat-card-blue', icon: '🔐' },
                { label: 'Pending tasks', value: '5', color: 'neo-stat-card-pink', icon: '✓' },
                { label: 'Watch later', value: '9', color: 'neo-stat-card-green', icon: '▶' },
                { label: 'Saved links', value: '24', color: 'neo-stat-card-yellow', icon: '🔗' },
              ].map((stat) => (
                <div key={stat.label} className={`neo-stat-card ${stat.color} !p-4`}>
                  <div className="text-3xl mb-1">{stat.icon}</div>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="neo-card-sm">
              <div className="text-sm font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>⏰ Reminders</div>
              <p className="text-sm mb-1">📅 <strong>Call the dentist</strong> — due today</p>
              <p className="text-sm">📺 <strong>Finish “The AI Economy”</strong> — in progress</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="neo-container pt-8 pb-24">
        <div className="text-center mb-14">
          <h2 className="neo-title text-4xl md:text-5xl mb-4">Everything you forget, in one place</h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Four kinds of memory, one vault — built for the way your brain actually works.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <div key={feature.title} className="neo-card-sm neo-animate-in stagger-200">
              <div className={`neo-icon ${feature.color} mb-5`} style={{ width: '56px', height: '56px', fontSize: '1.75rem' }}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="neo-container pt-8 pb-24">
        <div className="neo-card" style={{ borderColor: 'var(--accent-purple)' }}>
          <h2 className="neo-title text-3xl md:text-4xl mb-10 text-center">Set up in three minutes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Create your vault', desc: 'Sign up and set a vault passkey — your passwords stay encrypted.' },
              { step: '2', title: 'Start capturing', desc: 'Add tasks, save videos, bookmark links, or drag the capture bookmarklet into your browser bar.' },
              { step: '3', title: 'Let it remember for you', desc: 'Search anything instantly, get reminded before you forget, and install it as an app.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="neo-icon mx-auto mb-4" style={{ width: '64px', height: '64px', background: 'var(--accent-coral)' }}>
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="neo-container pt-8 pb-28">
        <div className="neo-card text-center py-16" style={{ background: 'var(--accent-yellow)' }}>
          <h2 className="neo-title text-4xl md:text-5xl mb-4">Stop remembering. Start doing.</h2>
          <p className="text-xl mb-8" style={{ color: 'var(--text-primary)' }}>
            Your future self will thank you.
          </p>
          <Link to="/register" className="neo-btn" style={{ background: 'var(--accent-coral)', color: 'white', fontSize: '1.0625rem', padding: '1rem 2.5rem' }}>
            Create your free vault
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '3px solid var(--border-primary)', background: 'var(--bg-card)' }}>
        <div className="neo-container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="neo-logo" style={{ width: '32px', height: '32px', background: 'var(--accent-coral)' }}>🧠</div>
            <span className="font-bold">ReMember</span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            ReMember — your digital memory. Made with ♥ and a very good bookmarklet.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
