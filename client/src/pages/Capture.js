import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';
import { isYouTubeUrl } from '../utils/youtube';
import detectMediaType, { MEDIA_TYPE_META } from '../utils/mediaType';

const WEBSITE_CATEGORIES = ['other', 'ai', 'productivity', 'learning', 'utilities', 'development', 'design'];

const hostnameOf = (url) => {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const Capture = () => {
  const [searchParams] = useSearchParams();
  const initialUrl = searchParams.get('url') || '';
  const initialTitle = searchParams.get('title') || '';

  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('other');
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null); // { type: 'video' | 'website' }
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // AI quick capture
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiResult, setAiResult] = useState(null); // parsed structured capture
  const [aiError, setAiError] = useState('');
  const [taskSaved, setTaskSaved] = useState(null); // { title } for parsed tasks
  const [taskSaveError, setTaskSaveError] = useState('');
  const [aiEnrich, setAiEnrich] = useState(true);

  // Quick note capture
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const isVideo = isYouTubeUrl(url);
  const mediaMeta = !isVideo && url.trim() ? MEDIA_TYPE_META[detectMediaType(url.trim())] : null;

  // Check whether AI features are configured on the server
  useEffect(() => {
    api
      .get('/ai/status')
      .then((res) => {
        const enabled = !!res.data?.data?.enabled;
        setAiEnabled(enabled);
        setAiEnrich(enabled);
      })
      .catch(() => {});
  }, []);

  // Auto-fetch the video title when a YouTube URL is provided via bookmarklet
  useEffect(() => {
    if (isVideo && initialUrl) {
      let cancelled = false;
      setFetching(true);
      api
        .post('/videos/fetch-info', { url: initialUrl })
        .then((res) => {
          if (!cancelled && res.data.success && res.data.data.title && !initialTitle) {
            setTitle(res.data.data.title);
          }
        })
        .catch(() => { /* manual entry still works */ })
        .finally(() => { if (!cancelled) setFetching(false); });
      return () => { cancelled = true; };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill a sensible name for websites from the page title / hostname
  useEffect(() => {
    if (!isVideo && url && !title) {
      setTitle(hostnameOf(url));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, isVideo]);

  const handleAiParse = async (e) => {
    e.preventDefault();
    setAiError('');
    setAiResult(null);
    if (!aiText.trim()) {
      setAiError('Type what you want to remember first.');
      return;
    }
    if (!aiEnabled) {
      setAiError('AI capture is not enabled on this server yet.');
      return;
    }
    setAiParsing(true);
    try {
      const res = await api.post('/ai/parse', { text: aiText.trim() });
      const data = res.data.data;
      setAiResult(data);

      // Videos/websites pre-fill the manual form below for review
      if (data.type === 'video' || data.type === 'website') {
        if (data.url) setUrl(data.url);
        if (data.title) setTitle(data.title);
        if (data.description) setNotes(data.description);
        if (data.category && WEBSITE_CATEGORIES.includes(data.category)) setCategory(data.category);
      }
    } catch (err) {
      setAiError(err?.response?.data?.message || 'AI could not parse that. Try again.');
    } finally {
      setAiParsing(false);
    }
  };

  const handleDismissAiResult = () => {
    setAiResult(null);
    setTaskSaveError('');
  };

  const handleSaveAiTask = async () => {
    if (!aiResult) return;
    setSaving(true);
    setTaskSaveError('');
    try {
      await api.post('/tasks', {
        title: aiResult.title,
        description: aiResult.description || '',
        dueDate: aiResult.dueDate || null,
        priority: aiResult.priority || 'medium',
        tags: aiResult.tags || []
      });
      setTaskSaved({ title: aiResult.title });
      setAiText('');
    } catch (err) {
      setTaskSaveError(err?.response?.data?.message || 'Failed to save task.');
    } finally {
      setSaving(false);
    }
  };

  const handleNoteSubmit = async (e) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    setNoteSaving(true);
    try {
      await api.post('/notes', { title: noteTitle.trim(), content: noteContent, tags: [] });
      setNoteTitle('');
      setNoteContent('');
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save note.');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    if (!url.trim()) {
      setError('Please enter or paste a URL.');
      return;
    }

    setSaving(true);
    try {
      if (isYouTubeUrl(url.trim())) {
        const payload = {
          videoUrl: url.trim(),
          title: title.trim() || 'YouTube Video',
          personalNotes: notes.trim()
        };
        if (aiEnabled && aiEnrich) {
          try {
            const enr = await api.post('/ai/enrich', { title: payload.title, notes: payload.personalNotes });
            if (enr.data.data) {
              payload.tags = enr.data.data.tags;
              if (!payload.personalNotes) payload.personalNotes = enr.data.data.summary;
            }
          } catch { /* enrichment is best-effort */ }
        }
        await api.post('/videos', payload);
        setSaved({ type: 'video' });
      } else {
        const payload = {
          name: title.trim() || hostnameOf(url.trim()),
          url: url.trim(),
          description: notes.trim(),
          category
        };
        if (aiEnabled && aiEnrich) {
          try {
            const enr = await api.post('/ai/enrich', { title: payload.name, notes: payload.description });
            if (enr.data.data) {
              payload.tags = enr.data.data.tags;
              if (!payload.description) payload.description = enr.data.data.summary;
            }
          } catch { /* enrichment is best-effort */ }
        }
        await api.post('/websites', payload);
        setSaved({ type: 'website' });
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setUrl('');
    setTitle('');
    setNotes('');
    setCategory('other');
    setSaved(null);
    setError('');
    setAiText('');
    setAiResult(null);
    setAiError('');
    setTaskSaved(null);
    setTaskSaveError('');
  };

  const bookmarkletHref = `javascript:(function(){var u=encodeURIComponent(location.href),t=encodeURIComponent(document.title||'');window.open('${window.location.origin}/capture?url='+u+'&title='+t,'remember_capture','width=640,height=820');})();`;

  const copyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(bookmarkletHref);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const fmtDue = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d)) return null;
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />

      <main className="neo-container py-16">
        <div className="mb-10 neo-animate-in">
          <h1 className="neo-title text-5xl mb-2">Quick Capture</h1>
          <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
            Type it, paste it, or bookmark it — we'll figure out the rest
          </p>
        </div>

        {saved ? (
          <div className="neo-card max-w-2xl neo-animate-in">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="neo-title text-3xl mb-3">Saved!</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                {saved.type === 'video' ? 'Your video is in your watch-later collection.' : 'Your link is saved to your websites.'}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Link to={saved.type === 'video' ? '/videos' : '/websites'} className="neo-btn neo-btn-primary">
                View {saved.type === 'video' ? 'videos' : 'websites'}
              </Link>
              <button onClick={reset} className="neo-btn neo-btn-secondary">
                Capture another
              </button>
            </div>
          </div>
        ) : taskSaved ? (
          <div className="neo-card max-w-2xl neo-animate-in">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="neo-title text-3xl mb-3">Task created!</h2>
              <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                “{taskSaved.title}” is on your list.
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Link to="/tasks" className="neo-btn neo-btn-primary">View tasks</Link>
              <button onClick={reset} className="neo-btn neo-btn-secondary">Capture another</button>
            </div>
          </div>
        ) : (
          <>
            {/* AI Quick Capture */}
            <div className="neo-card max-w-2xl mb-10 neo-animate-in" style={{ borderColor: 'var(--accent-purple)' }}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <span className="text-3xl">✨</span> AI Quick Capture
                </h2>
                {aiEnabled && <span className="neo-badge neo-badge-purple text-xs">AI ready</span>}
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Describe it like you'd tell a friend: “remind me to call mom Friday at 5pm”,
                “save this tool for building UI”, or “watch this video about AI agents”.
              </p>

              <form onSubmit={handleAiParse} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={aiText}
                  onChange={(e) => setAiText(e.target.value)}
                  className="neo-input flex-1"
                  placeholder="e.g. remind me to renew the domain next friday"
                  aria-label="AI capture note"
                />
                <button type="submit" disabled={aiParsing} className="neo-btn neo-btn-purple whitespace-nowrap" style={{ background: 'var(--accent-purple)' }}>
                  {aiParsing ? '✨ Thinking…' : '✨ Parse'}
                </button>
              </form>

              {aiError && (
                <div className="neo-alert neo-alert-warning mt-4">
                  <p className="font-bold text-sm">{aiError}</p>
                </div>
              )}

              {!aiEnabled && !aiParsing && (
                <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                  Set <code>AI_API_KEY</code> on the server to enable AI capture.
                </p>
              )}

              {aiResult && aiResult.type === 'task' && (
                <div className="mt-5 neo-card-sm neo-animate-in">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="neo-badge neo-badge-pink text-xs">Task</span>
                      {aiResult.dueDate && (
                        <span className="neo-badge neo-badge-white text-xs">📅 {fmtDue(aiResult.dueDate)}</span>
                      )}
                      <span className="neo-badge neo-badge-white text-xs">Prio: {aiResult.priority}</span>
                    </div>
                    <button
                      onClick={handleDismissAiResult}
                      className="text-sm font-bold"
                      style={{ color: 'var(--text-muted)' }}
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                  <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{aiResult.title}</h3>
                  {aiResult.description && (
                    <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{aiResult.description}</p>
                  )}
                  {aiResult.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {aiResult.tags.map((tag) => (
                        <span key={tag} className="neo-badge neo-badge-white text-xs">#{tag}</span>
                      ))}
                    </div>
                  )}
                  {taskSaveError && (
                    <div className="neo-alert neo-alert-error mb-4">
                      <p className="font-bold text-sm">{taskSaveError}</p>
                    </div>
                  )}
                  <button onClick={handleSaveAiTask} disabled={saving} className="neo-btn neo-btn-primary neo-btn-sm">
                    {saving ? 'Saving…' : '➕ Create task'}
                  </button>
                </div>
              )}

              {(aiResult?.type === 'video' || aiResult?.type === 'website') && (
                <div className="neo-alert neo-alert-info mt-4">
                  <span>{aiResult.type === 'video' ? '🎬' : '🔗'}</span>
                  <p className="font-bold text-sm">
                    AI detected a {aiResult.type} — the fields below were filled in for you.
                  </p>
                </div>
              )}

              {aiResult?.type === 'password' && (
                <div className="neo-alert neo-alert-warning mt-4">
                  <span>🔐</span>
                  <p className="font-bold text-sm">
                    Password capture isn't available here — head to the Vault to store it safely.
                  </p>
                </div>
              )}
            </div>

            {/* Quick note */}
            <div className="neo-card max-w-2xl mb-10 neo-animate-in" style={{ borderColor: 'var(--accent-yellow)' }}>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span className="text-3xl">✍️</span> Quick note
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                No link needed — write an idea down and it's instantly searchable.
              </p>
              <form onSubmit={handleNoteSubmit} className="space-y-4">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="neo-input"
                  placeholder="Note title…"
                  aria-label="Note title"
                  required
                />
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="neo-textarea"
                  rows="3"
                  placeholder="Write it down…"
                />
                <button type="submit" disabled={noteSaving} className="neo-btn neo-btn-yellow">
                  {noteSaving ? 'Saving…' : '💾 Save note'}
                </button>
                {noteSaved && (
                  <div className="neo-alert neo-alert-success">
                    <p className="font-bold text-sm">✓ Note saved!</p>
                  </div>
                )}
              </form>
            </div>

            {/* Manual capture form */}
            <form onSubmit={handleSave} className="neo-card max-w-2xl mb-10 neo-animate-in">
              {error && (
                <div className="neo-alert neo-alert-error mb-6">
                  <p className="font-bold">{error}</p>
                </div>
              )}

              {isVideo && (
                <div className="neo-alert neo-alert-info mb-6">
                  <span>🎬</span>
                  <p className="font-bold">Detected: YouTube video</p>
                </div>
              )}
              {mediaMeta && (
                <div className="neo-alert neo-alert-info mb-6">
                  <span>{mediaMeta.icon}</span>
                  <p className="font-bold">Detected: {mediaMeta.label}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>URL *</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="neo-input"
                    placeholder="https://youtube.com/watch?v=… or https://any-site.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {isVideo ? 'Title' : 'Name'}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="neo-input"
                    placeholder={isVideo ? (fetching ? 'Fetching title…' : 'Video title') : 'Website or tool name'}
                  />
                </div>

                {!isVideo && (
                  <div>
                    <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="neo-select">
                      {WEBSITE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {isVideo ? 'Notes' : 'Description'}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="neo-textarea"
                    rows="3"
                    placeholder={isVideo ? 'Why you want to watch this…' : 'What is this tool / site for?…'}
                  />
                </div>

                {aiEnabled && (
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={aiEnrich}
                      onChange={(e) => setAiEnrich(e.target.checked)}
                      className="w-5 h-5 accent-current cursor-pointer"
                    />
                    <span className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
                      ✨ Auto-tag & summarize with AI
                    </span>
                  </label>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={saving} className="neo-btn neo-btn-primary flex-1">
                    {saving ? 'Saving…' : '💾 Save'}
                  </button>
                  <button type="button" onClick={reset} className="neo-btn neo-btn-secondary">
                    Clear
                  </button>
                </div>
              </div>
            </form>

            {/* Bookmarklet */}
            <div className="neo-card max-w-2xl neo-animate-in" style={{ borderColor: 'var(--accent-yellow)' }}>
              <h2 className="text-2xl font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <span className="text-3xl">📌</span> One-click capture from any tab
              </h2>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Drag the button below to your browser bookmarks bar. When you find something worth
                remembering, click it and this page will open pre-filled.
              </p>

              <a
                href={bookmarkletHref}
                className="neo-btn neo-btn-yellow mb-4"
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                ⭐ ReMember Capture
              </a>

              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs px-3 py-2 rounded-lg overflow-x-auto whitespace-nowrap" style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                  {bookmarkletHref.slice(0, 80)}…
                </code>
                <button onClick={copyBookmarklet} className="neo-btn neo-btn-sm neo-btn-secondary">
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
                Tip: if dragging doesn't work, copy the snippet and paste it as a new bookmark's URL.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Capture;
