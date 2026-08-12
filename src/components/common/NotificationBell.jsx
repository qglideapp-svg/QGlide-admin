import React, { useCallback, useEffect, useState } from 'react';
import notificationsIcon from '../../assets/icons/notifications.png';
import { fetchAdminActivityFeed } from '../../services/notificationService';
import { useLanguage } from '../../contexts/LanguageContext';
import NotificationsModal from './NotificationsModal';

export default function NotificationBell({
  buttonClassName = 'ibtn',
  dotClassName = 'dot',
  dotElement = 'i',
}) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshIndicator = useCallback(async () => {
    const result = await fetchAdminActivityFeed({ limit: 1, unreadOnly: true });
    if (!result.success) {
      setUnreadCount(0);
      return;
    }

    if (result.data.unreadCount != null) {
      setUnreadCount(result.data.unreadCount);
      return;
    }

    setUnreadCount(result.data.events?.length ?? 0);
  }, []);

  useEffect(() => {
    refreshIndicator();
  }, [refreshIndicator]);

  const handleNotificationsLoaded = (count) => {
    setUnreadCount(count);
  };

  const Dot = dotElement;

  return (
    <>
      <button
        type="button"
        className={buttonClassName}
        aria-label={t('common.notifications')}
        onClick={() => setIsOpen(true)}
      >
        <img src={notificationsIcon} alt="" className="kimg" />
        {unreadCount > 0 && <Dot className={dotClassName} aria-hidden="true" />}
      </button>
      <NotificationsModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          refreshIndicator();
        }}
        onNotificationsLoaded={handleNotificationsLoaded}
      />
    </>
  );
}
