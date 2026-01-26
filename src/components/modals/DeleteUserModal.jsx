import React, { useState } from 'react';
import './DeleteUserModal.css';
import { useLanguage } from '../../contexts/LanguageContext';

const DeleteUserModal = ({ isOpen, onClose, onConfirm, userName, isLoading }) => {
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
      <div className="modal-content delete-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('modals.deleteUserAccount')}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="danger-banner">
              <span className="danger-icon">🚨</span>
              <p><strong>{t('modals.danger')}:</strong> {t('modals.deleteAccountWarning')}</p>
            </div>
            <p>{t('modals.aboutToDeleteAccount')} <strong>{userName}</strong>.</p>
            
            <div className="form-group">
              <label htmlFor="reason">{t('modals.reasonForDeletion')}</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('modals.enterDeletionReasonExample')}
                required
                rows={4}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-delete" disabled={isLoading || !reason.trim()}>
              {isLoading ? t('modals.deleting') : t('modals.deleteAccount')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteUserModal;
