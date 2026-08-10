import React, { useEffect, useState } from 'react';
import './UpdateDriverBalanceModal.css';
import { useLanguage } from '../../contexts/LanguageContext';

const UpdateDriverBalanceModal = ({
  isOpen,
  onClose,
  onConfirm,
  driverName,
  currentBalance,
  isLoading,
}) => {
  const { t, formatCurrency } = useLanguage();
  const [balance, setBalance] = useState('');
  const [reason, setReason] = useState('');
  const [clearDebt, setClearDebt] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setBalance(currentBalance != null ? String(currentBalance) : '');
      setReason('');
      setClearDebt(false);
      setErrors({});
    }
  }, [isOpen, currentBalance]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    const parsedBalance = Number(balance);

    if (!String(balance).trim()) {
      newErrors.balance = t('modals.balanceRequired');
    } else if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
      newErrors.balance = t('modals.validBalanceRequired');
    }

    if (!reason.trim()) {
      newErrors.reason = t('modals.reasonRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm({
      balance: parsedBalance,
      reason: reason.trim(),
      clearDebt,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content update-driver-balance-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('modals.updateDriverBalance')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p>{t('modals.updatingBalanceFor')} <strong>{driverName}</strong></p>

            <div className="current-balance-info">
              <span className="current-balance-label">{t('drivers.currentBalance')}</span>
              <span className="current-balance-value">{formatCurrency(currentBalance || 0)}</span>
            </div>

            <div className="form-group">
              <label htmlFor="balance">{t('modals.newBalance')}</label>
              <input
                type="number"
                id="balance"
                name="balance"
                min="0"
                step="0.01"
                value={balance}
                onChange={(e) => {
                  setBalance(e.target.value);
                  if (errors.balance) {
                    setErrors((prev) => ({ ...prev, balance: '' }));
                  }
                }}
                placeholder={t('modals.enterNewBalance')}
                className={errors.balance ? 'error' : ''}
                required
              />
              {errors.balance && <span className="error-message">{errors.balance}</span>}
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label" htmlFor="clearDebt">
                <input
                  type="checkbox"
                  id="clearDebt"
                  checked={clearDebt}
                  onChange={(e) => setClearDebt(e.target.checked)}
                />
                <span>{t('modals.clearDriverDebt')}</span>
              </label>
              <p className="checkbox-help">{t('modals.clearDriverDebtHelp')}</p>
            </div>

            <div className="form-group">
              <label htmlFor="reason">{t('modals.reasonForBalanceUpdate')}</label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errors.reason) {
                    setErrors((prev) => ({ ...prev, reason: '' }));
                  }
                }}
                placeholder={t('modals.enterBalanceUpdateReason')}
                rows={4}
                className={errors.reason ? 'error' : ''}
                required
              />
              {errors.reason && <span className="error-message">{errors.reason}</span>}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-save-balance" disabled={isLoading}>
              {isLoading ? t('modals.updatingBalance') : t('modals.updateBalanceButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateDriverBalanceModal;
