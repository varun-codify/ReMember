import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    passwords: 0,
    tasks: 0,
    videos: 0,
    websites: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoadError('');
    setLoading(true);
    try {
      const [passwordsRes, tasksRes, videosRes, websitesRes] = await Promise.allSettled([
        api.get('/passwords'),
        api.get('/tasks'),
        api.get('/videos'),
        api.get('/websites'),
      ]);

      // API responses use the { data: [...] } envelope; allSettled gives us
      // either the resolved response or a rejected reason.
      const listOf = (result) => (result.status === 'fulfilled' ? result.value.data.data || [] : []);

      setStats({
        passwords: listOf(passwordsRes).length,
        tasks: listOf(tasksRes).filter(t => t.status === 'pending').length,
        videos: listOf(videosRes).filter(v => v.watchStatus === 'not-watched').length,
        websites: listOf(websitesRes).length,
      });

      const failed = [passwordsRes, tasksRes, videosRes, websitesRes].filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        setLoadError(`Couldn't load ${failed} of 4 sections. Check that the API is running, then retry.`);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoadError('Something went wrong while loading your dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center gap-3">
            <div className="neo-spinner" style={{ borderTopColor: 'var(--accent-blue)' }}></div>
            <div className="neo-spinner" style={{ borderTopColor: 'var(--accent-pink)', animationDelay: '0.2s' }}></div>
            <div className="neo-spinner" style={{ borderTopColor: 'var(--accent-yellow)', animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Passwords',
      value: stats.passwords,
      href: '/passwords',
      description: 'Secured credentials',
      icon: '🔐',
      color: 'blue'
    },
    {
      label: 'Tasks',
      value: stats.tasks,
      href: '/tasks',
      description: 'Pending items',
      icon: '✓',
      color: 'pink'
    },
    {
      label: 'Videos',
      value: stats.videos,
      href: '/videos',
      description: 'Saved to watch',
      icon: '▶',
      color: 'green'
    },
    {
      label: 'Websites',
      value: stats.websites,
      href: '/websites',
      description: 'Bookmarked links',
      icon: '🔗',
      color: 'yellow'
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      <main className="neo-container py-16">
        {/* Load errors */}
        {loadError && (
          <div className="neo-alert neo-alert-warning mb-8 neo-animate-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-bold">{loadError}</p>
            <button onClick={fetchDashboardData} className="neo-btn neo-btn-sm neo-btn-yellow ml-auto">
              Try again
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-16 neo-animate-in">
          <h1 className="text-6xl font-bold mb-3">
            <span className="neo-title">{getGreeting()},</span>{' '}
            <span className="neo-title" style={{ color: 'var(--accent-coral)' }}>{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-xl" style={{ color: 'var(--text-secondary)' }}>
            Your digital memory at a glance
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {metrics.map((metric, index) => (
            <Link
              key={metric.label}
              to={metric.href}
              className={`neo-stat-card neo-stat-card-${metric.color} neo-animate-in stagger-${(index + 1) * 100}`}
            >
              <div className="flex items-start justify between mb-6">
                <div className={`neo-icon neo-icon-${metric.color}`}>
                  {metric.icon}
                </div>
              </div>
              <div>
                <div className="text-5xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{metric.value}</div>
                <div className="text-sm font-bold mb-1" style={{ color: 'var(--text-secondary)' }}>{metric.label}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{metric.description}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="neo-card mb-16 neo-animate-in stagger-300">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
            <span className="text-3xl">⚡</span>
            Quick actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'New password', href: '/passwords', icon: '➕', color: 'blue' },
              { label: 'Add task', href: '/tasks', icon: '✓', color: 'pink' },
              { label: 'Save video', href: '/videos', icon: '🎬', color: 'green' },
              { label: 'Bookmark link', href: '/websites', icon: '🔖', color: 'yellow' },
            ].map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className={`neo-btn neo-btn-${action.color} text-center py-4 flex flex-col items-center gap-2`}
              >
                <span className="text-2xl">{action.icon}</span>
                <span className="text-sm">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="neo-card neo-animate-in stagger-400">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Vault status</h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>All systems operational</p>
              </div>
              <div className="neo-status neo-status-active"></div>
            </div>
            <div className="neo-alert neo-alert-success mt-6">
              <svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-bold">Encrypted and secure</span>
            </div>
          </div>

          <div className="neo-card neo-animate-in stagger-400">
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Total items</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Across all categories</p>
            <div className="flex items-baseline gap-3">
              <div className="text-6xl font-bold neo-title" style={{ color: 'var(--accent-coral)' }}>
                {stats.passwords + stats.tasks + stats.videos + stats.websites}
              </div>
              <div className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>memories saved</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
