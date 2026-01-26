import React, { useState } from 'react';
import './SuspendDriverModal.css';
import { useLanguage } from '../../contexts/LanguageContext';

const SuspendDriverModal = ({ isOpen, onClose, onConfirm, driverName, isLoading }) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('modals.suspendDriver')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p>{t('modals.aboutToSuspend')} <strong>{driverName}</strong></p>
            <label>{t('modals.reasonForSuspension')}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('modals.enterReason')}
              required
              rows={4}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-suspend-confirm" disabled={isLoading || !reason.trim()}>
              {isLoading ? t('modals.suspending') : t('modals.suspendDriverButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuspendDriverModal;
