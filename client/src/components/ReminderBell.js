import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';
import {
  notificationsSupported,
  getPushConfig,
  enableNotifications,
  disableNotifications
} from '../utils/notifications';

const ReminderBell = () => {
  const [reminders, setReminders] = useState(null);
  const [open, setOpen] = useState(false);
  const [pushState, setPushState] = useState('checking'); // checking | enabled | disabled | unavailable | unsupported
  const location = useLocation();
  const panelRef = useRef(null);

  const fetchReminders = async () => {
    try {
      const res = await api.get('/reminders');
      setReminders(res.data.data);
    } catch {
      // Bell simply stays empty if the API is unavailable
    }
  };

  // Fetch on mount, then refresh periodically
  useEffect(() => {
    fetchReminders();
    const id = setInterval(fetchReminders, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Close the panel on navigation
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Inspect push capability + current subscription each time the panel opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const check = async () => {
      setPushState('checking');
      if (!notificationsSupported()) {
        if (!cancelled) setPushState('unsupported');
        return;
      }
      const config = await getPushConfig();
      if (!config.pushEnabled) {
        if (!cancelled) setPushState('unavailable');
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (!cancelled) setPushState(subscription ? 'enabled' : 'disabled');
      } catch {
        if (!cancelled) setPushState('disabled');
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleEnable = async () => {
    const result = await enableNotifications();
    if (result.ok) {
      setPushState('enabled');
    } else if (result.reason === 'unavailable') {
      setPushState('unavailable');
    } else if (result.reason === 'unsupported') {
      setPushState('unsupported');
    } else {
      setPushState('disabled');
    }
  };

  const handleDisable = async () => {
    await disableNotifications();
    setPushState('disabled');
  };

  const count = reminders?.count || 0;
  const isEmpty = reminders && count === 0 && !reminders.notWatchedVideos?.length;

  const renderSection = (title, icon, items, href) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-4 last:mb-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            {icon} {title}
          </span>
          <Link to={href} className="neo-link text-xs" onClick={() => setOpen(false)}>Open</Link>
        </div>
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item._id} className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
              {item.title || item.websiteName || item.name}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-lg transition-all hover:bg-gray-100"
        style={{ color: 'var(--text-secondary)' }}
        title="Reminders"
        aria-label="Reminders"
      >
        🔔
        {count > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
            style={{ background: '#c92a2a', border: '2px solid var(--bg-card)' }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 max-h-[70vh] overflow-y-auto neo-card-sm z-50 neo-animate-in"
          style={{ background: 'var(--bg-card)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Reminders</h3>
            <Link to="/tasks" className="neo-link text-xs" onClick={() => setOpen(false)}>Open tasks</Link>
          </div>

          {!reminders ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
          ) : isEmpty ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All caught up 🎉</p>
          ) : (
            <>
              {renderSection('Overdue', '⏰', reminders.overdueTasks, '/tasks')}
              {renderSection('Due today', '📅', reminders.dueTodayTasks, '/tasks')}
              {renderSection('In progress', '▶️', reminders.inProgressVideos, '/videos')}
              {renderSection('Not watched', '📺', reminders.notWatchedVideos, '/videos')}
            </>
          )}

          {/* Push notifications opt-in */}
          <div className="mt-4 pt-3" style={{ borderTop: '2px solid var(--border-light)' }}>
            {pushState === 'checking' && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>🔔 Checking notifications…</p>
            )}
            {pushState === 'enabled' && (
              <button onClick={handleDisable} className="text-xs font-bold neo-link">
                🔕 Turn off browser notifications
              </button>
            )}
            {pushState === 'disabled' && (
              <button onClick={handleEnable} className="text-xs font-bold neo-link">
                🔔 Turn on browser notifications
              </button>
            )}
            {pushState === 'unavailable' && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                🔕 Push isn't configured on this server yet.
              </p>
            )}
            {pushState === 'unsupported' && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                🔕 Browser notifications aren't supported in this browser.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReminderBell;
