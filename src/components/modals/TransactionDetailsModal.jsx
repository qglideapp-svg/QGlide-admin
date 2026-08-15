import React, { useEffect, useState } from 'react';
import './TransactionDetailsModal.css';
import { useLanguage } from '../../contexts/LanguageContext';
import LazyLoader from '../common/LazyLoader.jsx';
import {
  fetchTransactionDetails,
  resolveTransactionId,
} from '../../services/financialService';

const DetailRow = ({ label, value }) => {
  if (value == null || value === '') {
    return null;
  }

  return (
    <div className="transaction-detail-row">
      <span className="transaction-detail-label">{label}</span>
      <span className="transaction-detail-value">{value}</span>
    </div>
  );
};

const TransactionDetailsModal = ({ isOpen, onClose, transactionId, fallbackTransaction }) => {
  const { t, formatDateTime, formatCurrency, translateApiLabel } = useLanguage();
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !transactionId) {
      return undefined;
    }

    let isMounted = true;

    const loadTransactionDetails = async () => {
      setIsLoading(true);
      setError(null);
      setTransactionDetails(fallbackTransaction || null);

      try {
        const result = await fetchTransactionDetails(transactionId);

        if (!isMounted) {
          return;
        }

        if (result.success && result.transaction) {
          setTransactionDetails(result.transaction);
        } else {
          setError(result.error || t('financial.transactionDetailsUnavailable'));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || t('financial.transactionDetailsUnavailable'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTransactionDetails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, transactionId, t]);

  if (!isOpen) {
    return null;
  }

  const displayId = resolveTransactionId(transactionDetails || { id: transactionId }) || transactionId;

  return (
    <div className="modal-overlay transaction-details-modal-overlay" onClick={onClose}>
      <div className="modal-content transaction-details-modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('financial.transactionDetails')}</h2>
          <button className="modal-close" type="button" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </div>

        <div className="modal-body transaction-details-modal-body">
          {isLoading && !transactionDetails ? (
            <LazyLoader variant="content" lines={2} message={t('financial.loadingTransactionDetails')} />
          ) : error && !transactionDetails ? (
            <div className="transaction-details-modal-error">{error}</div>
          ) : transactionDetails ? (
            <>
              <div className="transaction-details-modal-summary">
                <div className="transaction-details-modal-id">{displayId}</div>
                {transactionDetails.status && (
                  <span className={`transaction-details-modal-status transaction-details-modal-status-${String(transactionDetails.status).toLowerCase()}`}>
                    {translateApiLabel(transactionDetails.status)}
                  </span>
                )}
              </div>

              <div className="transaction-details-grid">
                <DetailRow
                  label={t('financial.date')}
                  value={transactionDetails.createdAt ? formatDateTime(transactionDetails.createdAt) : null}
                />
                <DetailRow
                  label={t('financial.type')}
                  value={transactionDetails.type ? translateApiLabel(transactionDetails.type) : null}
                />
                <DetailRow
                  label={t('financial.amount')}
                  value={formatCurrency(transactionDetails.amount, transactionDetails.currency)}
                />
                <DetailRow label={t('financial.userDriver')} value={transactionDetails.userName} />
                <DetailRow label={t('users.emailAddress')} value={transactionDetails.userEmail} />
                <DetailRow label={t('users.phoneNumber')} value={transactionDetails.userPhone} />
                <DetailRow label={t('financial.userRole')} value={transactionDetails.userRole ? translateApiLabel(transactionDetails.userRole) : null} />
                <DetailRow label={t('financial.reference')} value={transactionDetails.reference} />
                <DetailRow label={t('financial.description')} value={transactionDetails.description} />
                <DetailRow label={t('rides.paymentMethod')} value={transactionDetails.paymentMethod ? translateApiLabel(transactionDetails.paymentMethod) : null} />
                <DetailRow label={t('rides.paymentStatus')} value={transactionDetails.paymentStatus ? translateApiLabel(transactionDetails.paymentStatus) : null} />
                <DetailRow label={t('financial.rideId')} value={transactionDetails.rideId} />
                <DetailRow label={t('financial.walletId')} value={transactionDetails.walletId} />
                <DetailRow label={t('financial.walletType')} value={transactionDetails.walletType ? translateApiLabel(transactionDetails.walletType) : null} />
                <DetailRow
                  label={t('financial.balanceBefore')}
                  value={transactionDetails.balanceBefore != null ? formatCurrency(transactionDetails.balanceBefore, transactionDetails.currency) : null}
                />
                <DetailRow
                  label={t('financial.balanceAfter')}
                  value={transactionDetails.balanceAfter != null ? formatCurrency(transactionDetails.balanceAfter, transactionDetails.currency) : null}
                />
              </div>

              {error && (
                <div className="transaction-details-modal-warning">{error}</div>
              )}
            </>
          ) : null}
        </div>

        <div className="modal-footer transaction-details-modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
