import React, { useState } from 'react';
import './DeleteDriverModal.css';
import { useLanguage } from '../../contexts/LanguageContext';

const DeleteDriverModal = ({ isOpen, onClose, onConfirm, driverName, isLoading }) => {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('modals.deleteDriver')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="warning-banner">
              <span className="warning-icon">⚠️</span>
              <p><strong>{t('modals.warning')}:</strong> {t('modals.cannotBeUndone')}</p>
            </div>
            <p>{t('modals.aboutToDelete')} <strong>{driverName}</strong> {t('modals.fromSystem')}</p>
            <label>{t('modals.reasonForDeletion')}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('modals.enterDeletionReason')}
              rows={4}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-delete-confirm" disabled={isLoading}>
              {isLoading ? t('modals.deleting') : t('modals.deleteDriver')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteDriverModal;
