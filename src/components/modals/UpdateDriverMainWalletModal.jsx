import React, { useEffect, useState } from 'react';
import './UpdateDriverMainWalletModal.css';
import { useLanguage } from '../../contexts/LanguageContext';

const UpdateDriverMainWalletModal = ({
  isOpen,
  onClose,
  onConfirm,
  driverName,
  currentBalance,
  isLoading,
}) => {
  const { t, formatCurrency } = useLanguage();
  const [operation, setOperation] = useState('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setOperation('credit');
      setAmount('');
      setReason('');
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};
    const parsedAmount = Number(amount);

    if (!String(amount).trim()) {
      newErrors.amount = t('modals.amountRequired');
    } else if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = t('modals.validAmountRequired');
    }

    if (!reason.trim()) {
      newErrors.reason = t('modals.reasonRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onConfirm({
      operation,
      amount: parsedAmount,
      reason: reason.trim(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content update-driver-main-wallet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('modals.updateMainWalletBalance')}</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p>{t('modals.updatingMainWalletFor')} <strong>{driverName}</strong></p>

            <div className="current-balance-info">
              <span className="current-balance-label">{t('drivers.mainWallet')}</span>
              <span className="current-balance-value">{formatCurrency(currentBalance || 0)}</span>
            </div>

            <div className="form-group">
              <label htmlFor="main-wallet-operation">{t('modals.walletOperation')}</label>
              <select
                id="main-wallet-operation"
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
              >
                <option value="credit">{t('modals.creditWallet')}</option>
                <option value="debit">{t('modals.debitWallet')}</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="main-wallet-amount">{t('modals.amountQAR')}</label>
              <input
                type="number"
                id="main-wallet-amount"
                name="amount"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) {
                    setErrors((prev) => ({ ...prev, amount: '' }));
                  }
                }}
                placeholder={t('modals.enterAmount')}
                className={errors.amount ? 'error' : ''}
                required
              />
              {errors.amount && <span className="error-message">{errors.amount}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="main-wallet-reason">{t('modals.reasonForBalanceUpdate')}</label>
              <textarea
                id="main-wallet-reason"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errors.reason) {
                    setErrors((prev) => ({ ...prev, reason: '' }));
                  }
                }}
                placeholder={t('modals.enterMainWalletReason')}
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
            <button type="submit" className="btn-save-main-wallet" disabled={isLoading}>
              {isLoading ? t('modals.updatingBalance') : t('modals.updateMainWalletButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateDriverMainWalletModal;
