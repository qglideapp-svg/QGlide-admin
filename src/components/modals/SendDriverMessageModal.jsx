import React, { useCallback, useEffect, useState } from 'react';
import './SendDriverMessageModal.css';
import { useLanguage } from '../../contexts/LanguageContext';
import LazyLoader from '../common/LazyLoader.jsx';
import {
  fetchDriverMessageHistory,
  sendDriverMessage,
} from '../../services/driverService';

const SendDriverMessageModal = ({
  isOpen,
  onClose,
  driverId,
  driverName,
  onSuccess,
  onError,
}) => {
  const { t, formatDateTime, translateApiLabel } = useLanguage();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);
  const [historyNextCursor, setHistoryNextCursor] = useState(null);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isHistoryLoadingMore, setIsHistoryLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const loadHistory = useCallback(async (cursor = null, append = false) => {
    if (!driverId) {
      return;
    }

    if (append) {
      setIsHistoryLoadingMore(true);
    } else {
      setIsHistoryLoading(true);
      setHistoryError(null);
    }

    try {
      const result = await fetchDriverMessageHistory({
        driverId,
        driverName,
        cursor,
        limit: 20,
      });

      if (!result.success) {
        throw new Error(result.error || t('drivers.messageHistoryFailed'));
      }

      const nextMessages = result.data?.messages ?? [];
      setHistory((prev) => (append ? [...prev, ...nextMessages] : nextMessages));
      setHistoryNextCursor(result.data?.nextCursor ?? null);
      setHistoryHasMore(Boolean(result.data?.hasMore));
    } catch (error) {
      setHistoryError(error.message || t('drivers.messageHistoryFailed'));
      if (!append) {
        setHistory([]);
      }
    } finally {
      setIsHistoryLoading(false);
      setIsHistoryLoadingMore(false);
    }
  }, [driverId, driverName, t]);

  useEffect(() => {
    if (!isOpen || !driverId) {
      return;
    }

    setTitle('');
    setMessage('');
    setHistory([]);
    setHistoryNextCursor(null);
    setHistoryHasMore(false);
    setHistoryError(null);
    loadHistory(null, false);
  }, [isOpen, driverId, driverName, loadHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!driverId || !message.trim() || isSending) {
      return;
    }

    setIsSending(true);

    try {
      const result = await sendDriverMessage({
        driverId,
        title: title.trim(),
        message: message.trim(),
      });

      if (!result.success) {
        throw new Error(result.error || t('drivers.messageSentFailed'));
      }

      setTitle('');
      setMessage('');
      onSuccess?.(result.message || t('drivers.messageSentSuccess'));
      await loadHistory(null, false);
    } catch (error) {
      onError?.(error.message || t('drivers.messageSentFailed'));
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (isSending) {
      return;
    }
    onClose?.();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay driver-messages-overlay" onClick={handleClose}>
      <div className="modal-content driver-messages-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{t('drivers.driverMessagesTitle')}</h2>
            <p className="driver-messages-subtitle">
              {t('drivers.driverMessagesSubtitle', {
                name: driverName || t('drivers.driverManagement'),
              })}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="driver-messages-history">
          <div className="driver-messages-history-head">
            <h3>{t('drivers.messageHistoryTitle')}</h3>
          </div>

          <div className="driver-messages-history-body">
            {isHistoryLoading ? (
              <LazyLoader variant="content" lines={4} message={t('drivers.messageHistoryLoading')} />
            ) : historyError ? (
              <div className="driver-messages-state driver-messages-state-error">
                <span className="material-symbols-outlined">error</span>
                <p>{historyError}</p>
                <button type="button" className="btn-cancel" onClick={() => loadHistory(null, false)}>
                  {t('common.tryAgain')}
                </button>
              </div>
            ) : history.length === 0 ? (
              <div className="driver-messages-state">
                <span className="material-symbols-outlined">forum</span>
                <p>{t('drivers.messageHistoryEmpty')}</p>
              </div>
            ) : (
              <ul className="driver-messages-list">
                {history.map((item) => (
                  <li key={item.id} className="driver-message-item">
                    <div className="driver-message-item-head">
                      <strong>{item.title || t('drivers.messageDefaultTitle')}</strong>
                      {item.sentAt && (
                        <time dateTime={item.sentAt}>{formatDateTime(item.sentAt)}</time>
                      )}
                    </div>
                    {item.message && <p>{item.message}</p>}
                    <div className="driver-message-item-meta">
                      {item.sentByName && (
                        <span>{t('drivers.messageSentBy', { name: item.sentByName })}</span>
                      )}
                      {item.status && (
                        <span className={`driver-message-status driver-message-status-${item.status}`}>
                          {translateApiLabel(item.status)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {history.length > 0 && historyHasMore && (
            <div className="driver-messages-history-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => loadHistory(historyNextCursor, true)}
                disabled={isHistoryLoadingMore}
              >
                {isHistoryLoadingMore ? t('drivers.messageHistoryLoadingMore') : t('drivers.messageHistoryLoadMore')}
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="driver-messages-compose">
            <h3>{t('drivers.sendNewMessage')}</h3>
            <p>{t('drivers.sendMessageIntro', { name: driverName || t('drivers.driverManagement') })}</p>
            <label htmlFor="driver-message-title">{t('drivers.messageTitleLabel')}</label>
            <input
              id="driver-message-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('drivers.messageTitlePlaceholder')}
              maxLength={100}
              disabled={isSending}
            />
            <label htmlFor="driver-message-body">{t('drivers.messageBodyLabel')}</label>
            <textarea
              id="driver-message-body"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('drivers.messageBodyPlaceholder')}
              required
              rows={4}
              maxLength={500}
              disabled={isSending}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose} disabled={isSending}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-suspend-confirm" disabled={isSending || !message.trim()}>
              {isSending ? t('drivers.sendingMessage') : t('drivers.sendMessageButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendDriverMessageModal;
