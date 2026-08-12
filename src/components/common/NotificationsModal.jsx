import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  fetchAdminActivityFeed,
  markActivityEventsRead,
  markAllActivityEventsRead,
} from '../../services/notificationService';
import { useLanguage } from '../../contexts/LanguageContext';
import LazyLoader from './LazyLoader.jsx';
import './NotificationsModal.css';

export default function NotificationsModal({ isOpen, onClose, onNotificationsLoaded }) {
  const navigate = useNavigate();
  const { t, formatDateTime, translateApiLabel } = useLanguage();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [error, setError] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const syncUnreadIndicator = useCallback((items) => {
    const unreadCount = items.filter((item) => !item.isRead).length;
    onNotificationsLoaded?.(unreadCount);
  }, [onNotificationsLoaded]);

  const loadActivityFeed = useCallback(async ({ cursor = null, append = false } = {}) => {
    if (!append) {
      setIsLoading(true);
      setError(null);
    } else {
      setIsLoadingMore(true);
    }

    const result = await fetchAdminActivityFeed({
      limit: 30,
      cursor: cursor || undefined,
    });

    if (!append) {
      setIsLoading(false);
    } else {
      setIsLoadingMore(false);
    }

    if (!result.success) {
      if (!append) {
        setEvents([]);
        setError(result.error || t('notificationCenter.errorLoad'));
        onNotificationsLoaded?.(0);
      }
      return;
    }

    const nextEvents = result.data.events ?? [];
    setEvents((prev) => {
      const merged = append ? [...prev, ...nextEvents] : nextEvents;
      if (result.data.unreadCount != null) {
        onNotificationsLoaded?.(result.data.unreadCount);
      } else {
        syncUnreadIndicator(merged);
      }
      return merged;
    });
    setNextCursor(result.data.nextCursor ?? null);
    setHasMore(Boolean(result.data.hasMore));
    setError(null);
  }, [onNotificationsLoaded, syncUnreadIndicator, t]);

  useEffect(() => {
    if (!isOpen) return undefined;

    loadActivityFeed();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, loadActivityFeed, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = () => {
    onClose();
  };

  const handleLoadMore = () => {
    if (hasMore && nextCursor && !isLoadingMore) {
      loadActivityFeed({ cursor: nextCursor, append: true });
    }
  };

  const handleManageNotifications = () => {
    onClose();
    navigate('/notifications');
  };

  const handleMarkAllRead = async () => {
    setIsMarkingAllRead(true);
    const result = await markAllActivityEventsRead();
    setIsMarkingAllRead(false);

    if (!result.success) {
      setError(result.error || t('notificationCenter.errorMarkRead'));
      return;
    }

    setEvents((prev) => {
      const updated = prev.map((event) => ({ ...event, isRead: true }));
      syncUnreadIndicator(updated);
      return updated;
    });
  };

  const handleEventClick = async (event) => {
    if (event.isRead) {
      if (event.actionUrl) {
        window.open(event.actionUrl, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    const result = await markActivityEventsRead([event.id]);
    if (result.success) {
      setEvents((prev) => {
        const updated = prev.map((item) =>
          item.id === event.id ? { ...item, isRead: true } : item,
        );
        syncUnreadIndicator(updated);
        return updated;
      });
    }

    if (event.actionUrl) {
      window.open(event.actionUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const getCategoryLabel = (category) => translateApiLabel(category || 'general');

  const hasUnread = events.some((event) => !event.isRead);

  return createPortal(
    <div className="notifications-modal-overlay" onClick={handleOverlayClick}>
      <div
        className="notifications-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="notifications-modal-header">
          <div>
            <h2 id="notifications-modal-title">{t('notificationCenter.title')}</h2>
            <p>{t('notificationCenter.subtitle')}</p>
          </div>
          <div className="notifications-modal-header-actions">
            {hasUnread && (
              <button
                type="button"
                className="notifications-modal-mark-all"
                onClick={handleMarkAllRead}
                disabled={isMarkingAllRead}
              >
                {isMarkingAllRead ? t('common.loading') : t('notificationCenter.markAllRead')}
              </button>
            )}
            <button type="button" className="notifications-modal-close" onClick={onClose} aria-label={t('common.close')}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="notifications-modal-body">
          {isLoading ? (
            <LazyLoader variant="content" lines={4} message={t('notificationCenter.loading')} />
          ) : error ? (
            <div className="notifications-modal-state notifications-modal-state-error">
              <span className="material-symbols-outlined">error</span>
              <p>{error}</p>
              <button type="button" className="notifications-modal-retry" onClick={() => loadActivityFeed()}>
                {t('common.tryAgain')}
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="notifications-modal-state">
              <span className="material-symbols-outlined">notifications_off</span>
              <p>{t('notificationCenter.empty')}</p>
            </div>
          ) : (
            <ul className="notifications-modal-list">
              {events.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    className={`notifications-modal-item ${event.isRead ? 'is-read' : 'is-unread'}`}
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="notifications-modal-item-head">
                      <span className={`notifications-modal-type notifications-modal-type-${event.category}`}>
                        {getCategoryLabel(event.category)}
                      </span>
                      {event.createdAt && (
                        <time dateTime={event.createdAt}>
                          {formatDateTime(event.createdAt)}
                        </time>
                      )}
                    </div>
                    <h3>{event.title || t('notificationCenter.untitled')}</h3>
                    {event.message && <p>{event.message}</p>}
                    {!event.isRead && <span className="notifications-modal-unread-dot" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="notifications-modal-footer">
          {events.length > 0 && hasMore && (
            <button
              type="button"
              className="notifications-modal-load-more"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? t('common.loading') : t('notificationCenter.loadMore')}
            </button>
          )}
          <button type="button" className="notifications-modal-manage" onClick={handleManageNotifications}>
            {t('notificationCenter.manage')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
