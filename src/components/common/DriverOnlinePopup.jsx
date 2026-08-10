import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import './DriverOnlinePopup.css';

const DriverOnlinePopup = ({ driver, onClose }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (!driver) {
    return null;
  }

  const handleViewDriver = () => {
    onClose();
    navigate(`/driver-profile/${driver.id}`);
  };

  return (
    <div className="driver-online-popup-overlay" onClick={onClose}>
      <div
        className="driver-online-popup"
        role="alertdialog"
        aria-live="assertive"
        aria-labelledby="driver-online-popup-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="driver-online-popup-close" onClick={onClose} aria-label={t('common.close')}>
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="driver-online-popup-icon">
          <span className="material-symbols-outlined">local_taxi</span>
        </div>

        <h2 id="driver-online-popup-title">{t('drivers.driverOnlineTitle')}</h2>
        <p>{t('drivers.driverNowOnline', { name: driver.name })}</p>

        <div className="driver-online-popup-actions">
          <button type="button" className="driver-online-popup-dismiss" onClick={onClose}>
            {t('common.dismiss')}
          </button>
          <button type="button" className="driver-online-popup-view" onClick={handleViewDriver}>
            {t('drivers.viewDriver')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DriverOnlinePopup;
