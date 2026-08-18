import React, { useCallback, useEffect, useState } from 'react';
import { fetchAdminDriverMessages } from '../../services/driverService';
import { setDriverMessagesSummaryListener } from '../../utils/driverMessagesLiveState';
import { useLanguage } from '../../contexts/LanguageContext';
import DriverMessagesModal from './DriverMessagesModal';
import './DriverMessagesModal.css';

export default function DriverMessagesBell({
  buttonClassName = 'ibtn driver-messages-bell',
  dotClassName = 'dot driver-messages-bell-dot',
  dotElement = 'i',
}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    const result = await fetchAdminDriverMessages({
      limit: 1,
      unreadOnly: true,
      senderType: 'driver',
    });

    if (!result.success) {
      return;
    }

    setUnreadCount(result.data.summary?.unreadCount ?? 0);
  }, []);

  useEffect(() => {
    refreshUnreadCount();

    setDriverMessagesSummaryListener((summary) => {
      if (summary?.unreadCount != null) {
        setUnreadCount(Number(summary.unreadCount));
      }
    });

    return () => {
      setDriverMessagesSummaryListener(null);
    };
  }, [refreshUnreadCount]);

  const Dot = dotElement;

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        aria-label={t('driverMessages.inboxTitle')}
        title={t('driverMessages.inboxTitle')}
        onClick={() => setIsOpen(true)}
      >
        <span className="material-symbols-outlined">chat</span>
        {unreadCount > 0 && <Dot className={dotClassName} aria-hidden="true" />}
      </button>
      <DriverMessagesModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          refreshUnreadCount();
        }}
        onUnreadCountChange={setUnreadCount}
      />
    </>
  );
}
