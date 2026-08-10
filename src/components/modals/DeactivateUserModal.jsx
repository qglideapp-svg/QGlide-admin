import React, { useState } from 'react';
import './DeactivateUserModal.css';
import { useLanguage } from '../../contexts/LanguageContext';

const DeactivateUserModal = ({ isOpen, onClose, onConfirm, userName, isLoading }) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content deactivate-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('modals.suspendRider')}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p>{t('modals.aboutToSuspend')} <strong>{userName}</strong></p>

            <div className="form-group">
              <label htmlFor="reason">{t('modals.reasonForSuspension')}</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('modals.enterReason')}
                required
                rows={4}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-deactivate" disabled={isLoading || !reason.trim()}>
              {isLoading ? t('modals.suspending') : t('modals.suspendRiderButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeactivateUserModal;
