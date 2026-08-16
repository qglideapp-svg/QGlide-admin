import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../common/Toast.css';
import './AdminLiveToast.css';
import { useLanguage } from '../../contexts/LanguageContext';

const TOAST_CONFIG = {
  booking: {
    icon: 'directions_car',
    tone: 'info',
    titleKey: 'liveUpdates.newRideBookedTitle',
    messageKey: 'liveUpdates.newRideBookedMessage',
    actionKey: 'liveUpdates.viewRide',
  },
  pickup: {
    icon: 'person_pin_circle',
    tone: 'info',
    titleKey: 'liveUpdates.ridePickupTitle',
    messageKey: 'liveUpdates.ridePickupMessage',
    actionKey: 'liveUpdates.viewRide',
  },
  completed: {
    icon: 'check_circle',
    tone: 'success',
    titleKey: 'liveUpdates.rideCompletedTitle',
    messageKey: 'liveUpdates.rideCompletedMessage',
    actionKey: 'liveUpdates.viewRide',
  },
  support_ticket: {
    icon: 'support_agent',
    tone: 'warning',
    titleKey: 'liveUpdates.supportTicketTitle',
    messageKey: 'liveUpdates.supportTicketMessage',
    actionKey: 'liveUpdates.viewTicket',
  },
  complaint: {
    icon: 'report',
    tone: 'error',
    titleKey: 'liveUpdates.complaintTitle',
    messageKey: 'liveUpdates.complaintMessage',
    actionKey: 'liveUpdates.viewTicket',
  },
};

const AdminLiveToast = ({
  kind = 'booking',
  rideId,
  ticketId,
  riderName,
  driverName,
  pickup,
  dropoff,
  title,
  message,
  onClose,
  duration = 10000,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const config = TOAST_CONFIG[kind] || TOAST_CONFIG.booking;

  const displayMessage = message
    || t(config.messageKey, {
      rider: riderName || t('rides.rider'),
      driver: driverName || t('rides.driver'),
      name: riderName || t('rides.rider'),
    });

  const routeLabel = pickup && dropoff
    ? `${pickup} → ${dropoff}`
    : pickup || dropoff || title || null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(false);
      window.setTimeout(() => onClose(), 300);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    window.setTimeout(() => onClose(), 300);
  };

  const handleAction = () => {
    handleClose();

    if (kind === 'support_ticket' || kind === 'complaint') {
      const params = new URLSearchParams({ section: 'support' });
      if (ticketId) {
        params.set('ticket', ticketId);
      }
      navigate(`/dashboard?${params.toString()}`);
      return;
    }

    if (rideId) {
      navigate(`/ride-details/${rideId}`);
      return;
    }

    navigate('/ride-management');
  };

  return (
    <div className={`toast admin-live-toast toast-${config.tone} ${isVisible ? 'toast-visible' : 'toast-hidden'}`}>
      <div className="toast-content">
        <span className={`toast-icon admin-live-toast-icon admin-live-toast-icon-${kind}`}>
          <span className="material-symbols-outlined">{config.icon}</span>
        </span>
        <div className="admin-live-toast-copy">
          <strong>{title || t(config.titleKey)}</strong>
          <span className="toast-message">{displayMessage}</span>
          {routeLabel && <span className="admin-live-toast-detail">{routeLabel}</span>}
        </div>
        <button type="button" className="admin-live-toast-action" onClick={handleAction}>
          {t(config.actionKey)}
        </button>
        <button className="toast-close" onClick={handleClose} aria-label={t('common.close')}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
};

export default AdminLiveToast;
