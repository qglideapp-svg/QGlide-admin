import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchAdminDriverMessages } from '../../services/driverService';
import { setDriverMessagesSummaryListener } from '../../utils/driverMessagesLiveState';
import { useLanguage } from '../../contexts/LanguageContext';
import DriverChatPanel from './DriverChatPanel';
import LazyLoader from './LazyLoader.jsx';
import './DriverMessagesModal.css';

function groupMessagesByDriver(messages = []) {
  const grouped = new Map();

  messages.forEach((message) => {
    const driverId = message.driverId;
    if (!driverId) {
      return;
    }

    const existing = grouped.get(driverId) || {
      driverId,
      driverName: message.driverName || 'Driver',
      latestMessage: '',
      latestAt: null,
      unreadCount: 0,
      ticketStatus: message.ticketStatus || 'open',
    };

    if (message.message) {
      existing.latestMessage = message.message;
    }
    if (message.createdAt) {
      existing.latestAt = message.createdAt;
    }
    if (!message.isRead && message.sender !== 'admin') {
      existing.unreadCount += 1;
    }
    if (message.ticketStatus) {
      existing.ticketStatus = message.ticketStatus;
    }
    if (message.driverName) {
      existing.driverName = message.driverName;
    }

    grouped.set(driverId, existing);
  });

  return Array.from(grouped.values()).sort((left, right) => {
    const leftTime = new Date(left.latestAt || 0).getTime();
    const rightTime = new Date(right.latestAt || 0).getTime();
    return rightTime - leftTime;
  });
}

export default function DriverMessagesModal({
  isOpen,
  onClose,
  onUnreadCountChange,
  initialDriverId = null,
}) {
  const { t, formatDateTime } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [selectedDriverId, setSelectedDriverId] = useState(initialDriverId);
  const [selectedDriverName, setSelectedDriverName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await fetchAdminDriverMessages({ limit: 100, senderType: 'driver' });

    setIsLoading(false);

    if (!result.success) {
      setConversations([]);
      setError(result.error || t('driverMessages.errorLoad'));
      onUnreadCountChange?.(0);
      return;
    }

    const grouped = groupMessagesByDriver(result.data.messages ?? []);
    setConversations(grouped);
    onUnreadCountChange?.(result.data.summary?.unreadCount ?? 0);

    if (initialDriverId) {
      const matched = grouped.find((item) => item.driverId === initialDriverId);
      if (matched) {
        setSelectedDriverId(matched.driverId);
        setSelectedDriverName(matched.driverName);
      }
    } else if (!selectedDriverId && grouped.length > 0) {
      setSelectedDriverId(grouped[0].driverId);
      setSelectedDriverName(grouped[0].driverName);
    }
  }, [initialDriverId, onUnreadCountChange, selectedDriverId, t]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    loadConversations();

    setDriverMessagesSummaryListener((summary) => {
      if (summary?.unreadCount != null) {
        onUnreadCountChange?.(Number(summary.unreadCount));
      }
      loadConversations();
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
      setDriverMessagesSummaryListener(null);
    };
  }, [isOpen, loadConversations, onClose, onUnreadCountChange]);

  const selectedConversation = useMemo(
    () => conversations.find((item) => item.driverId === selectedDriverId) ?? null,
    [conversations, selectedDriverId],
  );

  const handleSelectConversation = (conversation) => {
    setSelectedDriverId(conversation.driverId);
    setSelectedDriverName(conversation.driverName);
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="driver-messages-modal-overlay" onClick={onClose}>
      <div className="driver-messages-modal-panel driver-messages-chat-layout" onClick={(event) => event.stopPropagation()}>
        <div className="driver-messages-modal-header">
          <div>
            <h2>{t('driverMessages.inboxTitle')}</h2>
            <p>{t('driverMessages.inboxSubtitle')}</p>
          </div>
          <button type="button" className="driver-messages-modal-close" onClick={onClose} aria-label={t('common.close')}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="driver-messages-chat-shell">
          <aside className="driver-messages-sidebar">
            {isLoading ? (
              <LazyLoader variant="content" lines={4} message={t('driverMessages.loading')} />
            ) : error ? (
              <div className="driver-messages-modal-state driver-messages-modal-state-error">
                <p>{error}</p>
                <button type="button" className="btn-cancel" onClick={loadConversations}>
                  {t('common.tryAgain')}
                </button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="driver-messages-modal-state">
                <p>{t('driverMessages.empty')}</p>
              </div>
            ) : (
              <ul className="driver-messages-conversation-list">
                {conversations.map((conversation) => (
                  <li key={conversation.driverId}>
                    <button
                      type="button"
                      className={`driver-messages-conversation-item ${selectedDriverId === conversation.driverId ? 'active' : ''}`}
                      onClick={() => handleSelectConversation(conversation)}
                    >
                      <div className="driver-messages-conversation-head">
                        <strong>{conversation.driverName}</strong>
                        {conversation.latestAt && (
                          <time dateTime={conversation.latestAt}>
                            {formatDateTime(conversation.latestAt)}
                          </time>
                        )}
                      </div>
                      <p>{conversation.latestMessage}</p>
                      <div className="driver-messages-conversation-meta">
                        {conversation.unreadCount > 0 && (
                          <span className="driver-messages-unread-badge">
                            {conversation.unreadCount}
                          </span>
                        )}
                        {(conversation.ticketStatus === 'closed' || conversation.ticketStatus === 'resolved') && (
                          <span className="driver-messages-closed-badge">{t('driverMessages.closed')}</span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="driver-messages-chat-pane">
            <DriverChatPanel
              driverId={selectedDriverId}
              driverName={selectedDriverName || selectedConversation?.driverName}
              onThreadUpdated={() => loadConversations()}
            />
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
