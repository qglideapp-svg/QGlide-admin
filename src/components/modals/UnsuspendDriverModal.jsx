import React, { useState } from 'react';
import './UnsuspendDriverModal.css';
import { useLanguage } from '../../contexts/LanguageContext';

const UnsuspendDriverModal = ({ isOpen, onClose, onConfirm, driverName, isLoading }) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason);
  };

  const handleCancel = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content unsuspend-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('modals.unsuspendDriver')}</h2>
          <button className="modal-close" onClick={handleCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p>{t('modals.aboutToUnsuspend')} <strong>{driverName}</strong></p>
            <label>{t('modals.reasonForUnsuspending')}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('modals.enterUnsuspendReason')}
              rows={4}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-unsuspend-confirm" disabled={isLoading}>
              {isLoading ? t('modals.unsuspending') : t('modals.unsuspendDriverButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnsuspendDriverModal;
