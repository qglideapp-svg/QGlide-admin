import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../common/Toast.css';
import './RideBookingToast.css';
import { useLanguage } from '../../contexts/LanguageContext';

const RideBookingToast = ({
  rideId,
  riderName,
  pickup,
  dropoff,
  type = 'info',
  onClose,
  duration = 10000,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const message = t('rides.newRideBookedMessage', {
    name: riderName || t('rides.rider'),
  });
  const routeLabel = pickup && dropoff
    ? `${pickup} → ${dropoff}`
    : pickup || dropoff || null;

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

  const handleViewRide = () => {
    handleClose();
    if (rideId) {
      navigate(`/ride-details/${rideId}`);
    } else {
      navigate('/ride-management');
    }
  };

  return (
    <div className={`toast ride-booking-toast toast-${type} ${isVisible ? 'toast-visible' : 'toast-hidden'}`}>
      <div className="toast-content">
        <span className="toast-icon ride-booking-toast-icon">
          <span className="material-symbols-outlined">directions_car</span>
        </span>
        <div className="ride-booking-toast-copy">
          <strong>{t('rides.newRideBookedTitle')}</strong>
          <span className="toast-message">{message}</span>
          {routeLabel && <span className="ride-booking-toast-route">{routeLabel}</span>}
        </div>
        <button type="button" className="ride-booking-toast-view" onClick={handleViewRide}>
          {t('rides.viewRide')}
        </button>
        <button className="toast-close" onClick={handleClose} aria-label={t('common.close')}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
};

export default RideBookingToast;
