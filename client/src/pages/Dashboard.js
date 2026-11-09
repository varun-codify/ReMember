import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import api from '../api';
import SafeExternalLink from '../components/SafeExternalLink';

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
  const [learning, setLearning] = useState(null);
  const [review, setReview] = useState(null);
  const [suggestions, setSuggestions] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    api.get('/stats/learning')
      .then((res) => setLearning(res.data.data))
      .catch(() => { /* learning section is optional */ });
    api.get('/review')
      .then((res) => setReview(res.data.data || []))
      .catch(() => setReview(null));
    api.post('/ai/recommendations', {})
      .then((res) => setSuggestions(res.data.data))
      .catch(() => setSuggestions(null));
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

        {/* Onboarding checklist — shows until the user has data in every module */}
        {(() => {
          const steps = [
            { done: stats.tasks > 0, label: 'Add your first task', to: '/tasks', icon: '✓' },
            { done: stats.videos > 0, label: 'Save a video to watch later', to: '/videos', icon: '▶' },
            { done: stats.websites > 0, label: 'Bookmark a useful link', to: '/websites', icon: '🔗' },
            { done: stats.passwords > 0, label: 'Store your first password', to: '/passwords', icon: '🔐' },
            { done: !!user?.hasVaultPasskey, label: 'Set your vault passkey', to: '/settings', icon: '🔑' },
          ];
          const done = steps.filter((s) => s.done).length;
          if (done === steps.length) return null;
          return (
            <div className="neo-card mb-16 neo-animate-in stagger-200" style={{ borderColor: 'var(--accent-blue)' }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                  <span className="text-3xl">🎓</span>
                  Getting started
                </h2>
                <span className="neo-badge neo-badge-white text-sm">{done}/{steps.length} complete</span>
              </div>

              <div className="h-4 rounded-lg mb-8 overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '2.5px solid var(--border-primary)' }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${(done / steps.length) * 100}%`, background: 'var(--accent-green)' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {steps.map((step) =>
                  step.done ? (
                    <div
                      key={step.label}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg"
                      style={{ background: 'var(--bg-secondary)', border: '2.5px solid var(--border-light)' }}
                    >
                      <span className="neo-badge neo-badge-green text-xs">✓</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>{step.label}</span>
                    </div>
                  ) : (
                    <Link
                      key={step.label}
                      to={step.to}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all hover:translate-x-0.5"
                      style={{ color: 'var(--text-primary)', border: '2.5px solid var(--border-primary)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}
                    >
                      <span className="text-base">{step.icon}</span>
                      <span className="text-sm">{step.label}</span>
                      <span className="ml-auto" style={{ color: 'var(--text-muted)' }}>→</span>
                    </Link>
                  )
                )}
              </div>
            </div>
          );
        })()}

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
              { label: 'Ask the AI', href: '/assistant', icon: '🤖', color: 'purple' },
              { label: 'Knowledge graph', href: '/knowledge', icon: '🕸', color: 'green' },
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

        {/* Learning analytics */}
        {learning && (
          <div className="mb-16 neo-animate-in stagger-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <span className="text-3xl">📚</span> Your learning
              </h2>
              <Link to="/collections" className="neo-link text-sm">Collections →</Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weekly activity */}
              <div className="neo-card-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Weekly activity</h3>
                  <span className="neo-badge neo-badge-white text-xs">last 7 days</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="neo-badge neo-badge-blue text-xs">▶ {learning.totals.videos} videos</span>
                  <span className="neo-badge neo-badge-green text-xs">🔗 {learning.totals.websites} links</span>
                  <span className="neo-badge neo-badge-yellow text-xs">📝 {learning.totals.notes} notes</span>
                  <span className="neo-badge neo-badge-pink text-xs">✓ {learning.totals.completedVideos} finished</span>
                </div>
                <div className="flex items-end justify-between gap-2 h-36">
                  {(() => {
                    const max = Math.max(1, ...learning.weekly.map((b) => b.count));
                    return learning.weekly.map((bucket) => (
                      <div key={bucket.date} className="flex flex-col items-center justify-end flex-1 h-full">
                        <span className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>{bucket.count}</span>
                        <div
                          className="w-full rounded-t-lg transition-all"
                          style={{
                            height: `${Math.max(6, (bucket.count / max) * 100)}%`,
                            background: bucket.count > 0 ? 'var(--accent-coral)' : 'var(--bg-secondary)',
                            border: '2px solid var(--border-primary)',
                          }}
                        />
                        <span className="text-[10px] font-bold mt-1" style={{ color: 'var(--text-muted)' }}>{bucket.label}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Categories */}
              <div className="neo-card-sm">
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Saved links by category</h3>
                {learning.categories.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No links saved yet — start bookmarking!</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {learning.categories.map((category) => (
                      <span key={category.name} className="neo-badge neo-badge-white text-sm">
                        {category.name} <strong style={{ color: 'var(--accent-coral)' }}>{category.count}</strong>
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-6">
                  <p className="text-sm mb-2 font-bold" style={{ color: 'var(--text-secondary)' }}>Your stats</p>
                  <div className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <p>▶ <strong>{learning.totals.inProgressVideos}</strong> videos in progress</p>
                    <p>📖 <strong>{learning.totals.readingWebsites}</strong> links partially read</p>
                    <p>🎓 <strong>{learning.totals.completedVideos}</strong> videos completed</p>
                  </div>
                </div>
              </div>

              {/* Continue learning */}
              <div className="neo-card-sm">
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Continue learning</h3>
                {learning.recentlyViewed.videos.length === 0 && learning.recentlyViewed.websites.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Nothing in progress. Save a video or link to start learning! 🚀
                  </p>
                ) : (
                  <div className="space-y-2">
                    {learning.recentlyViewed.videos.slice(0, 3).map((video) => (
                      <SafeExternalLink
                        key={video._id}
                        href={video.videoUrl}
                        className="block text-sm font-bold truncate neo-link"
                      >
                        ▶ {video.title}
                      </SafeExternalLink>
                    ))}
                    {learning.recentlyViewed.websites.slice(0, 3).map((website) => (
                      <SafeExternalLink
                        key={website._id}
                        href={website.url}
                        className="block text-sm truncate"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        📖 {website.name}
                        {website.readingProgress > 0 && <strong style={{ color: 'var(--text-muted)' }}> — {website.readingProgress}%</strong>}
                      </SafeExternalLink>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI corner — daily review + suggested topics */}
        {(review !== null || suggestions !== null) && (
          <div className="mb-16 neo-animate-in stagger-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <span className="text-3xl">🧠</span> Your AI corner
              </h2>
              <div className="flex gap-3">
                <Link to="/knowledge" className="neo-link text-sm">Graph →</Link>
                <Link to="/assistant" className="neo-link text-sm">Assistant →</Link>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily review — spaced repetition */}
              <div className="neo-card-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>⏰ Daily review</h3>
                  <Link to="/videos" className="neo-link text-xs font-bold">Review all</Link>
                </div>
                {review === null ? (
                  <div className="p-6 text-center rounded-lg" style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border-light)' }}>
                    <div className="text-4xl mb-2">⚠️</div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Couldn't load your review list</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Check that the API is running.</p>
                  </div>
                ) : review.length === 0 ? (
                  <div className="p-6 text-center rounded-lg" style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border-light)' }}>
                    <div className="text-4xl mb-2">✨</div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>All caught up!</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Nothing is gathering dust right now.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {review.slice(0, 5).map((item) => (
                      <Link
                        key={`${item.type}-${item.id}`}
                        to={item.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:translate-x-0.5"
                        style={{ background: 'var(--bg-secondary)', border: '2.5px solid var(--border-light)' }}
                      >
                        <span className="text-lg">
                          {item.type === 'video' ? '▶' : item.type === 'website' ? '🔗' : '📝'}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</span>
                          {item.readingProgress !== undefined && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.readingProgress}% read</span>
                          )}
                        </span>
                        <span
                          className="neo-badge text-xs flex-shrink-0"
                          style={{
                            background: item.daysSince >= 14 ? '#ffe0e0' : 'var(--bg-card)',
                            color: item.daysSince >= 14 ? '#c92a2a' : 'var(--text-secondary)',
                          }}
                        >
                          {item.daysSince === 0 ? 'today' : `${item.daysSince}d ago`}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggested for you */}
              <div className="neo-card-sm">
                <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>🎯 Suggested for you</h3>
                {suggestions === null ? (
                  <div className="p-6 text-center rounded-lg" style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border-light)' }}>
                    <div className="text-4xl mb-2">🤖</div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>AI suggestions need AI_API_KEY</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Set it in the server env and this card lights up.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-bold mb-3" style={{ color: 'var(--text-muted)' }}>
                      Because you're learning <strong style={{ color: 'var(--text-primary)' }}>#{suggestions.topic}</strong>:
                    </p>
                    {suggestions.suggestions.map((s, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 rounded-lg"
                        style={{ background: 'var(--bg-secondary)', border: '2.5px solid var(--border-light)' }}
                      >
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{s.topic}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.why}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
