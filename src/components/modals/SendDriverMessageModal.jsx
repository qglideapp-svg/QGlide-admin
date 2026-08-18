import React, { useEffect, useMemo, useState } from 'react';
import './SendDriverMessageModal.css';
import { useLanguage } from '../../contexts/LanguageContext';
import DriverChatPanel from '../common/DriverChatPanel';

const SendDriverMessageModal = ({
  isOpen,
  onClose,
  driverId,
  driverName,
  alternateDriverIds = [],
}) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay driver-chat-modal-overlay" onClick={onClose}>
      <div className="modal-content driver-chat-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{t('driverMessages.chatTitle')}</h2>
            <p className="driver-messages-subtitle">
              {t('drivers.driverMessagesSubtitle', {
                name: driverName || t('drivers.driverManagement'),
              })}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="driver-chat-modal-body">
          <DriverChatPanel
            driverId={driverId}
            driverName={driverName}
            alternateDriverIds={alternateDriverIds}
          />
        </div>
      </div>
    </div>
  );
};

export default SendDriverMessageModal;
