import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  closeDriverMessageTicket,
  fetchDriverChatThread,
  isAdminChatMessage,
  isDriverMessageTicketClosed,
  markAdminDriverMessagesRead,
  sendDriverMessage,
} from '../../services/driverService';
import {
  setDriverChatRefreshListener,
} from '../../utils/driverMessagesLiveState';
import { useLanguage } from '../../contexts/LanguageContext';
import LazyLoader from './LazyLoader.jsx';
import './DriverChatPanel.css';

const POLL_INTERVAL_MS = 2000;

function mergeThreadMessages(existing = [], incoming = []) {
  const merged = new Map();

  [...existing, ...incoming].forEach((message) => {
    if (!message?.message) {
      return;
    }

    const key = String(message.id || `${message.sender}|${message.createdAt}|${message.message}`);
    merged.set(key, message);
  });

  return Array.from(merged.values()).sort((left, right) => {
    const leftTime = new Date(left.createdAt || 0).getTime();
    const rightTime = new Date(right.createdAt || 0).getTime();
    return leftTime - rightTime;
  });
}

const DriverChatPanel = ({
  driverId,
  driverName,
  alternateDriverIds = [],
  onThreadUpdated,
}) => {
  const { t, formatDateTime, formatTime } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [ticketId, setTicketId] = useState(null);
  const [ticketStatus, setTicketStatus] = useState('open');
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState(null);
  const threadEndRef = useRef(null);
  const isMountedRef = useRef(true);
  const messagesRef = useRef([]);
  const loadThreadRef = useRef(null);

  const isClosed = useMemo(
    () => isDriverMessageTicketClosed(ticketStatus),
    [ticketStatus],
  );

  const scrollToBottom = useCallback(() => {
    threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const markUnreadMessagesRead = useCallback(async (threadMessages) => {
    const unreadIds = threadMessages
      .filter((item) => !isAdminChatMessage(item) && !item.isRead)
      .map((item) => item.id);

    if (unreadIds.length === 0) {
      return;
    }

    await markAdminDriverMessagesRead(unreadIds);
  }, []);

  const applyThreadResult = useCallback(async (result, { merge = false } = {}) => {
    if (!result.success) {
      if (!merge) {
        setMessages([]);
        setError(result.error || t('driverMessages.errorLoad'));
      }
      return;
    }

    const nextMessages = result.data.messages ?? [];

    setMessages((prev) => {
      const resolved = merge ? mergeThreadMessages(prev, nextMessages) : nextMessages;
      messagesRef.current = resolved;
      return resolved;
    });
    setTicketId(result.data.ticketId ?? null);
    setTicketStatus(result.data.ticketStatus ?? 'open');
    setError(null);
    onThreadUpdated?.(result.data);

    await markUnreadMessagesRead(merge ? mergeThreadMessages(messagesRef.current, nextMessages) : nextMessages);
  }, [markUnreadMessagesRead, onThreadUpdated, t]);

  const loadThread = useCallback(async ({ silent = false, merge = false } = {}) => {
    if (!driverId) {
      return;
    }

    if (!silent) {
      setIsLoading(true);
      setError(null);
    }

    const result = await fetchDriverChatThread({
      driverId,
      driverName,
      alternateDriverIds,
      limit: 100,
    });

    if (!isMountedRef.current) {
      return;
    }

    if (!silent) {
      setIsLoading(false);
    }

    await applyThreadResult(result, { merge });
  }, [applyThreadResult, driverId, driverName, alternateDriverIds]);

  loadThreadRef.current = loadThread;

  const pollLatestMessages = useCallback(async () => {
    if (!driverId) {
      return;
    }

    const result = await fetchDriverChatThread({
      driverId,
      driverName,
      alternateDriverIds,
      limit: 100,
    });

    if (!isMountedRef.current || !result.success) {
      return;
    }

    await applyThreadResult(result, { merge: false });
  }, [applyThreadResult, driverId, driverName, alternateDriverIds]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!driverId) {
      return undefined;
    }

    setDraft('');
    messagesRef.current = [];
    loadThread();

    const intervalId = window.setInterval(() => {
      pollLatestMessages();
    }, POLL_INTERVAL_MS);

    setDriverChatRefreshListener((incomingMessage) => {
      const targetIds = [driverId, ...alternateDriverIds]
        .map((value) => String(value ?? '').trim())
        .filter(Boolean);

      if (!incomingMessage?.driverId || !targetIds.includes(String(incomingMessage.driverId))) {
        return;
      }

      loadThreadRef.current?.({ silent: true, merge: false });
    });

    return () => {
      isMountedRef.current = false;
      window.clearInterval(intervalId);
      setDriverChatRefreshListener(null);
    };
  }, [driverId, driverName, alternateDriverIds, loadThread, pollLatestMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!driverId || !trimmed || isSending || isClosed) {
      return;
    }

    setIsSending(true);

    try {
      const result = await sendDriverMessage({
        driverId,
        message: trimmed,
      });

      if (!result.success) {
        throw new Error(result.error || t('drivers.messageSentFailed'));
      }

      setDraft('');
      await loadThread({ silent: true, merge: false });
    } catch (sendError) {
      setError(sendError.message || t('drivers.messageSentFailed'));
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (isClosing || isClosed) {
      return;
    }

    if (!window.confirm(t('driverMessages.closeConfirm'))) {
      return;
    }

    setIsClosing(true);

    try {
      const result = await closeDriverMessageTicket({
        ticketId,
        driverId,
      });

      if (!result.success) {
        throw new Error(result.error || t('driverMessages.closeFailed'));
      }

      setTicketStatus('closed');
      await loadThread({ silent: true });
    } catch (closeError) {
      setError(closeError.message || t('driverMessages.closeFailed'));
    } finally {
      setIsClosing(false);
    }
  };

  if (!driverId) {
    return (
      <div className="driver-chat-empty-state">
        <span className="material-symbols-outlined">forum</span>
        <p>{t('driverMessages.selectConversation')}</p>
      </div>
    );
  }

  return (
    <div className="driver-chat-panel">
      <div className="driver-chat-panel-header">
        <div>
          <h3>{driverName || t('drivers.driverManagement')}</h3>
          <p className="driver-chat-panel-status">
            {isClosed ? t('driverMessages.chatClosed') : t('driverMessages.chatOpen')}
            {!isClosed && <span className="driver-chat-live-indicator">{t('driverMessages.live')}</span>}
          </p>
        </div>
        {!isClosed && (
          <button
            type="button"
            className="driver-chat-close-btn"
            onClick={handleCloseTicket}
            disabled={isClosing}
          >
            {isClosing ? t('driverMessages.closingChat') : t('driverMessages.endChat')}
          </button>
        )}
      </div>

      <div className="driver-chat-thread">
        {isLoading ? (
          <LazyLoader variant="content" lines={5} message={t('driverMessages.loading')} />
        ) : error && messages.length === 0 ? (
          <div className="driver-chat-state driver-chat-state-error">
            <span className="material-symbols-outlined">error</span>
            <p>{error}</p>
            <button type="button" className="btn-cancel" onClick={() => loadThread()}>
              {t('common.tryAgain')}
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="driver-chat-state">
            <span className="material-symbols-outlined">chat_bubble_outline</span>
            <p>{t('driverMessages.emptyThread')}</p>
          </div>
        ) : (
          <>
            {messages.map((item) => (
              <div
                key={item.id}
                className={`driver-chat-bubble ${isAdminChatMessage(item) ? 'is-admin' : 'is-driver'}`}
              >
                <div className="driver-chat-bubble-head">
                  <span className="driver-chat-sender">
                    {isAdminChatMessage(item)
                      ? (item.senderName || t('driverMessages.adminLabel'))
                      : (item.senderName || driverName || t('drivers.driverManagement'))}
                  </span>
                  {item.createdAt && (
                    <time dateTime={item.createdAt}>
                      {formatTime(item.createdAt) || formatDateTime(item.createdAt)}
                    </time>
                  )}
                </div>
                <div className="driver-chat-bubble-body">{item.message}</div>
              </div>
            ))}
            <div ref={threadEndRef} />
          </>
        )}
      </div>

      {isClosed ? (
        <div className="driver-chat-closed-banner">
          <span className="material-symbols-outlined">lock</span>
          <p>{t('driverMessages.chatEndedNotice')}</p>
        </div>
      ) : (
        <div className="driver-chat-compose">
          {error && messages.length > 0 && (
            <p className="driver-chat-compose-error">{error}</p>
          )}
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t('driverMessages.typeMessage')}
            rows={3}
            maxLength={500}
            disabled={isSending}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="driver-chat-compose-actions">
            <button
              type="button"
              className="btn-suspend-confirm"
              onClick={handleSend}
              disabled={isSending || !draft.trim()}
            >
              {isSending ? t('drivers.sendingMessage') : t('driverMessages.send')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverChatPanel;
