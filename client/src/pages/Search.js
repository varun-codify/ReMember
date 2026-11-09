import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import api from '../api';

const PRIORITY_COLORS = { high: 'neo-badge-pink', medium: 'neo-badge-yellow', low: 'neo-badge-blue' };
const VIDEO_STATUS = { 'not-watched': 'neo-badge-pink', 'in-progress': 'neo-badge-yellow', completed: 'neo-badge-green' };
const CATEGORY_COLORS = { ai: 'neo-badge-purple', productivity: 'neo-badge-blue', learning: 'neo-badge-green', utilities: 'neo-badge-yellow', development: 'neo-badge-pink', design: 'neo-badge-purple', other: 'neo-badge-white' };
const PASSWORD_CATEGORY_COLORS = { social: 'neo-badge-pink', work: 'neo-badge-blue', finance: 'neo-badge-green', shopping: 'neo-badge-yellow', entertainment: 'neo-badge-purple', other: 'neo-badge-white' };

const Section = ({ title, icon, href, count, children }) => (
  <div className="neo-card mb-6 neo-animate-in">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
        <span>{icon}</span>
        <span>{title}</span>
        <span className="neo-badge neo-badge-white text-xs">{count}</span>
      </h2>
      {href && (
        <Link to={href} className="neo-link text-sm">Open module →</Link>
      )}
    </div>
    {children}
  </div>
);

const Row = ({ children }) => (
  <div className="flex items-center gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border-light)' }}>
    {children}
  </div>
);

const Search = () => {
  const [searchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  const runSearch = (term) => {
    clearTimeout(debounceRef.current);
    const q = (term || '').trim();
    if (!q) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/search', { params: { q } });
        setResults(res.data.data);
      } catch (err) {
        setError(err?.response?.data?.message || 'Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // Re-run when the URL query changes (e.g. from the navbar search box)
  useEffect(() => {
    setQuery(initialQ);
    runSearch(initialQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQ]);

  // Cancel a pending debounced search when leaving the page
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const total =
    results
      ? results.tasks.length + results.videos.length + results.websites.length + results.passwords.length + results.notes.length
      : 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      <main className="neo-container py-16">
        <div className="mb-10 neo-animate-in">
          <h1 className="neo-title text-5xl mb-2">Search</h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Find anything across your passwords, tasks, videos, and links
          </p>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); runSearch(query); }}
          className="flex gap-3 mb-10 neo-animate-in"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); runSearch(e.target.value); }}
            placeholder="Try “AI tool” or “dentist” or a site name…"
            className="neo-input flex-1"
            autoFocus
          />
          <button type="submit" className="neo-btn neo-btn-primary whitespace-nowrap">🔍 Search</button>
        </form>

        {error && (
          <div className="neo-alert neo-alert-error mb-6">
            <p className="font-bold">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="neo-spinner" style={{ width: '48px', height: '48px', borderWidth: '4px' }}></div>
          </div>
        )}

        {!loading && !error && !query.trim() && (
          <EmptyState
            icon="🔎"
            iconColor="neo-icon-coral"
            title="Search your entire memory"
            description="Passwords, tasks, videos, and links all live in one index — type something above to find it instantly."
          />
        )}

        {!loading && !error && results && total === 0 && (
          <EmptyState
            icon="🤷"
            iconColor="neo-icon-yellow"
            title={`No matches for “${query.trim()}”`}
            description="Try a different word, a website name, a username, or a tag — or save it with Quick Capture so it shows up next time."
            actions={[{ label: '⚡ Quick capture', variant: 'secondary', to: '/capture' }]}
          />
        )}

        {!loading && !error && results && total > 0 && (
          <div>
            <p className="text-sm font-bold mb-4" style={{ color: 'var(--text-muted)' }}>
              {total} result{total > 1 ? 's' : ''} for “{query.trim()}”
            </p>

            {results.tasks.length > 0 && (
              <Section title="Tasks" icon="✓" href="/tasks" count={results.tasks.length}>
                {results.tasks.map((task) => (
                  <Row key={task._id}>
                    <span className={`neo-badge ${PRIORITY_COLORS[task.priority] || 'neo-badge-white'} text-xs`}>{task.priority}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{task.title}</p>
                      {task.description && <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{task.description}</p>}
                    </div>
                    {task.dueDate && (
                      <span className="text-xs font-bold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        📅 {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </Row>
                ))}
              </Section>
            )}

            {results.notes.length > 0 && (
              <Section title="Notes" icon="📝" href="/notes" count={results.notes.length}>
                {results.notes.map((note) => (
                  <Row key={note._id}>
                    <span className="text-lg">{note.pinned ? '📌' : '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{note.title}</p>
                      {note.content && <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{note.content}</p>}
                    </div>
                    {note.tags?.length > 0 && (
                      <span className="text-xs font-bold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                        {note.tags.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </Row>
                ))}
              </Section>
            )}

            {results.videos.length > 0 && (
              <Section title="Videos" icon="▶" href="/videos" count={results.videos.length}>
                {results.videos.map((video) => (
                  <Row key={video._id}>
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt="" className="w-14 h-10 object-cover rounded border-2" style={{ borderColor: 'var(--border-light)' }} />
                    ) : (
                      <div className="w-14 h-10 rounded border-2 flex items-center justify-center" style={{ borderColor: 'var(--border-light)' }}>🎬</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{video.title}</p>
                      {video.channel && <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{video.channel}</p>}
                      {video.summary && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{video.summary}</p>}
                    </div>
                    <span className={`neo-badge ${VIDEO_STATUS[video.watchStatus] || 'neo-badge-white'} text-xs`}>{video.watchStatus}</span>
                  </Row>
                ))}
              </Section>
            )}

            {results.websites.length > 0 && (
              <Section title="Websites & AI tools" icon="🔗" href="/websites" count={results.websites.length}>
                {results.websites.map((website) => (
                  <Row key={website._id}>
                    <span className="text-lg">{website.isFavorite ? '★' : '🌐'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{website.name}</p>
                      <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{website.url}</p>
                      {website.summary && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{website.summary}</p>}
                    </div>
                    <span className={`neo-badge ${CATEGORY_COLORS[website.category] || 'neo-badge-white'} text-xs`}>{website.category}</span>
                  </Row>
                ))}
              </Section>
            )}

            {results.passwords.length > 0 && (
              <Section title="Passwords" icon="🔐" href="/passwords" count={results.passwords.length}>
                {results.passwords.map((password) => (
                  <Row key={password._id}>
                    <span className="text-lg">🔑</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>{password.websiteName}</p>
                      <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{password.username}</p>
                    </div>
                    <span className={`neo-badge ${PASSWORD_CATEGORY_COLORS[password.category] || 'neo-badge-white'} text-xs`}>{password.category}</span>
                  </Row>
                ))}
              </Section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Search;
