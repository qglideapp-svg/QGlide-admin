import React, { useState } from 'react';
import './DeleteUserModal.css';
import { useLanguage } from '../../contexts/LanguageContext';

export default function DeleteMarketerModal({ isOpen, onClose, onConfirm, email, displayName, isLoading }) {
  const { t } = useLanguage();
  const [reason, setReason] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || !reason.trim()) return;
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch {
      /* Parent shows error; keep open */
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  const label = displayName && displayName !== '—' ? `${displayName} (${email})` : email;

  return (
    <div className="modal-overlay" role="presentation" onClick={handleClose}>
      <div className="modal-content delete-modal-content" role="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('marketers.deleteModalTitle')}</h2>
          <button type="button" className="modal-close" onClick={handleClose} disabled={isLoading} aria-label={t('common.close')}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="danger-banner">
              <span className="danger-icon">🚨</span>
              <p>
                <strong>{t('modals.danger')}:</strong> {t('marketers.deleteModalWarning')}
              </p>
            </div>
            <p>
              {t('marketers.deleteModalBody')} <strong>{label}</strong>
            </p>
            <div className="form-group">
              <label htmlFor="deleteMarketerReason">{t('modals.reasonForDeletion')}</label>
              <textarea
                id="deleteMarketerReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('marketers.deleteReasonPlaceholder')}
                required
                rows={4}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose} disabled={isLoading}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-delete" disabled={isLoading || !reason.trim()}>
              {isLoading ? t('marketers.deleting') : t('marketers.delete')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
