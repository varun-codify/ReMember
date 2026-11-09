import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';
import api from '../api';
import SafeExternalLink from '../components/SafeExternalLink';
import { safeExternalUrl } from '../utils/safeUrl';

const fmtTime = (seconds) => {
  const s = Math.max(0, Math.round(seconds || 0));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const withTimestamp = (url, seconds) => {
  try {
    const u = new URL(url);
    u.searchParams.set('t', String(Math.round(seconds)));
    return u.toString();
  } catch (e) {
    return `${url}&t=${Math.round(seconds)}`;
  }
};

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [formData, setFormData] = useState({ videoUrl: '', title: '', personalNotes: '' });
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [summarizingId, setSummarizingId] = useState(null);
  const [progressMinutes, setProgressMinutes] = useState({});
  const navigate = useNavigate();

  const askAI = (video) =>
    navigate(`/assistant?contextType=video&contextId=${video._id}&title=${encodeURIComponent(video.title)}&prompt=${encodeURIComponent('Explain this video and its key points')}`);

  useEffect(() => {
    fetchVideos();
    // One delayed refresh to catch background AI enrichment after a capture
    const t = setTimeout(fetchVideos, 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    api.get('/ai/status').then((res) => setAiEnabled(!!res.data?.data?.enabled)).catch(() => {});
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await api.get('/videos');
      setVideos(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchYouTubeInfo = async () => {
    if (!formData.videoUrl) {
      alert('Please enter a YouTube URL first');
      return;
    }
    setFetchingInfo(true);
    try {
      const response = await api.post('/videos/fetch-info', { url: formData.videoUrl });
      if (response.data.success) {
        setFormData({ ...formData, title: response.data.data.title });
        if (response.data.data.message) alert(response.data.data.message);
      }
    } catch (error) {
      console.error('Error fetching video info:', error);
      alert(error.response?.data?.message || 'Error fetching video information');
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/videos', formData);
      setShowModal(false);
      setFormData({ videoUrl: '', title: '', personalNotes: '' });
      fetchVideos();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving video');
    }
  };

  const updateStatus = async (id, status, extra = {}) => {
    try {
      await api.put(`/videos/${id}`, { watchStatus: status, ...extra });
      fetchVideos();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleVideoClick = async (video) => {
    if (video.watchStatus === 'not-watched') {
      try {
        await api.put(`/videos/${video._id}`, {
          watchStatus: 'in-progress',
          clickCount: (video.clickCount || 0) + 1,
          lastWatchedAt: new Date()
        });
        fetchVideos();
      } catch (error) {
        console.error('Error updating video:', error);
      }
    }
  };

  const saveProgress = async (video) => {
    const minutes = parseInt(progressMinutes[video._id], 10);
    if (isNaN(minutes) || minutes < 0) return;
    await updateStatus(video._id, 'in-progress', {
      positionSeconds: minutes * 60,
      lastWatchedAt: new Date()
    });
    setProgressMinutes((prev) => ({ ...prev, [video._id]: '' }));
  };

  const summarizeVideo = async (video) => {
    setSummarizingId(video._id);
    try {
      await api.post('/ai/summarize-item', { type: 'video', id: video._id });
      fetchVideos();
    } catch (error) {
      alert(error.response?.data?.message || 'AI summarization failed');
    } finally {
      setSummarizingId(null);
    }
  };

  const confirmDelete = (video) => {
    setVideoToDelete(video);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (videoToDelete) {
      try {
        await api.delete(`/videos/${videoToDelete._id}`);
        setShowDeleteModal(false);
        setVideoToDelete(null);
        fetchVideos();
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  const statusColors = { 'not-watched': 'neo-badge-pink', 'in-progress': 'neo-badge-yellow', completed: 'neo-badge-green' };
  const statusLabels = { 'not-watched': 'Not watched', 'in-progress': 'In progress', completed: 'Completed' };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />
      <main className="neo-container py-16">
        <div className="flex items-center justify-between mb-12 neo-animate-in">
          <div>
            <h1 className="neo-title text-5xl mb-2">Videos</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>Your watch later collection</p>
          </div>
          <button onClick={() => setShowModal(true)} className="neo-btn neo-btn-primary">
            <span className="mr-2">🎬</span> Add video
          </button>
        </div>

        {videos.length === 0 ? (
          <EmptyState
            icon="📺"
            iconColor="neo-icon-green"
            title="Nothing in your watch list"
            description="Save YouTube videos with auto-fetched titles, thumbnails, and transcripts — searchable and summarized by AI."
            actions={[
              { label: '🎬 Add a video', variant: 'primary', onClick: () => setShowModal(true) },
              { label: '⚡ Quick capture', variant: 'secondary', to: '/capture' },
            ]}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <div key={video._id} className={`neo-card-sm neo-animate-in stagger-${Math.min((index % 4) + 1, 4) * 100}`}>
                {safeExternalUrl(video.videoUrl) && (
                  <SafeExternalLink href={video.videoUrl} className="block mb-4" onClick={() => handleVideoClick(video)}>
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-48 object-cover rounded-lg border-3"
                      style={{ borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-sm)' }}
                    />
                  </SafeExternalLink>
                )}

                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{video.title}</h3>

                {video.personalNotes && (
                  <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{video.personalNotes}</p>
                )}

                {/* AI summary */}
                {video.summary && (
                  <div className="mb-3 p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border-light)' }}>
                    <p className="text-xs font-bold mb-1" style={{ color: 'var(--text-muted)' }}>✨ AI summary</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{video.summary}</p>
                    {video.keyPoints?.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {video.keyPoints.slice(0, 4).map((point, i) => (
                          <li key={i} className="text-xs flex gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--accent-coral)' }}>•</span>{point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {!video.summary && aiEnabled && (
                  <button onClick={() => summarizeVideo(video)} disabled={summarizingId === video._id} className="text-xs font-bold neo-link mb-3">
                    {summarizingId === video._id ? '✨ Summarizing…' : '✨ Summarize with AI'}
                  </button>
                )}
                {aiEnabled && (
                  <button onClick={() => askAI(video)} className="text-xs font-bold neo-link mb-3 ml-3">
                    🤖 Ask AI
                  </button>
                )}

                {/* Resume / progress */}
                {video.watchStatus === 'in-progress' && (
                  <div className="mb-3">
                    {video.positionSeconds >= 5 && safeExternalUrl(video.videoUrl) && (
                      <SafeExternalLink
                        href={withTimestamp(video.videoUrl, video.positionSeconds)}
                        className="neo-link text-xs font-bold"
                      >
                        ▶ Resume at {fmtTime(video.positionSeconds)}
                      </SafeExternalLink>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        min="0"
                        value={progressMinutes[video._id] ?? ''}
                        onChange={(e) => setProgressMinutes((prev) => ({ ...prev, [video._id]: e.target.value }))}
                        placeholder="min"
                        className="neo-input !py-1 !px-2 text-xs"
                        style={{ width: '72px' }}
                        aria-label="Video position in minutes"
                      />
                      <button onClick={() => saveProgress(video)} className="neo-btn neo-btn-sm neo-btn-secondary text-xs">
                        Set progress
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 mt-4">
                  <div className="flex items-center gap-2">
                    <span className={`neo-badge ${statusColors[video.watchStatus]}`}>{statusLabels[video.watchStatus]}</span>
                    {video.transcript && <span className="neo-badge neo-badge-white text-xs" title="Transcript indexed for search">📝</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={video.watchStatus}
                      onChange={(e) => updateStatus(video._id, e.target.value)}
                      className="text-xs py-1.5 px-3 font-bold rounded-lg border-3 bg-white"
                      style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                      <option value="not-watched">Not watched</option>
                      <option value="in-progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button onClick={() => confirmDelete(video)} className="p-2 rounded-lg hover:bg-red-100 transition-colors" title="Delete video">
                      <svg className="w-5 h-5" style={{ color: '#c92a2a' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {video.lastWatchedAt && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Last watched: {new Date(video.lastWatchedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 neo-animate-in" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="neo-card max-w-lg w-full">
              <h2 className="neo-title text-3xl mb-8">Add video</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>YouTube URL *</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="neo-input flex-1"
                      placeholder="https://youtube.com/watch?v=..."
                      required
                    />
                    <button type="button" onClick={fetchYouTubeInfo} disabled={fetchingInfo} className="neo-btn neo-btn-blue whitespace-nowrap" style={{ minWidth: '120px' }}>
                      {fetchingInfo ? '⏳ Fetching...' : '🔍 Fetch Info'}
                    </button>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Paste a YouTube link — titles and transcripts are fetched automatically
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Title *</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="neo-input" placeholder="Video title" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Notes</label>
                  <textarea value={formData.personalNotes} onChange={(e) => setFormData({ ...formData, personalNotes: e.target.value })} className="neo-textarea" rows="3" placeholder="Why you want to watch this..." />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="neo-btn neo-btn-primary flex-1">Save</button>
                  <button type="button" onClick={() => { setShowModal(false); setFormData({ videoUrl: '', title: '', personalNotes: '' }); }} className="neo-btn neo-btn-secondary flex-1">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteModal && videoToDelete && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 neo-animate-in" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="neo-card max-w-md w-full">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🗑️</div>
                <h2 className="neo-title text-3xl mb-3">Delete Video?</h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                  Are you sure you want to delete <strong>{videoToDelete.title}</strong>? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteModal(false); setVideoToDelete(null); }} className="neo-btn neo-btn-secondary flex-1">Cancel</button>
                <button onClick={handleDelete} className="neo-btn flex-1" style={{ background: '#c92a2a', borderColor: '#5c0a0a', color: 'white' }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Videos;
