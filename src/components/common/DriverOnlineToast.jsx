import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../common/Toast.css';
import './DriverOnlineToast.css';
import { useLanguage } from '../../contexts/LanguageContext';

const DriverOnlineToast = ({ driverId, driverName, type = 'success', onClose, duration = 8000 }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const message = t('drivers.driverNowOnline', { name: driverName });

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

  const handleViewDriver = () => {
    handleClose();
    if (driverId) {
      navigate(`/driver-profile/${driverId}`);
    }
  };

  return (
    <div className={`toast driver-online-toast toast-${type} ${isVisible ? 'toast-visible' : 'toast-hidden'}`}>
      <div className="toast-content">
        <span className="toast-icon driver-online-toast-icon">
          <span className="material-symbols-outlined">local_taxi</span>
        </span>
        <div className="driver-online-toast-copy">
          <strong>{t('drivers.driverOnlineTitle')}</strong>
          <span className="toast-message">{message}</span>
        </div>
        <button type="button" className="driver-online-toast-view" onClick={handleViewDriver}>
          {t('drivers.viewDriver')}
        </button>
        <button className="toast-close" onClick={handleClose} aria-label={t('common.close')}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
};

export default DriverOnlineToast;
