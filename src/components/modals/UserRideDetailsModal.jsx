import React, { useEffect, useState } from 'react';
import './UserRideDetailsModal.css';
import { useLanguage } from '../../contexts/LanguageContext';
import LazyLoader from '../common/LazyLoader.jsx';
import {
  extractRideDetailsPayload,
  fetchRideDetails,
  mapRideDetailsSummary,
} from '../../services/ridesService';

const DetailRow = ({ label, value }) => {
  if (value == null || value === '') {
    return null;
  }

  return (
    <div className="user-ride-detail-row">
      <span className="user-ride-detail-label">{label}</span>
      <span className="user-ride-detail-value">{value}</span>
    </div>
  );
};

const UserRideDetailsModal = ({ isOpen, onClose, rideId, fallbackRide }) => {
  const { t, formatDateTime, formatCurrency, translateApiLabel } = useLanguage();
  const [rideDetails, setRideDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !rideId) {
      return undefined;
    }

    let isMounted = true;

    const loadRideDetails = async () => {
      setIsLoading(true);
      setError(null);
      setRideDetails(fallbackRide || null);

      try {
        const result = await fetchRideDetails(rideId);

        if (!isMounted) {
          return;
        }

        if (result.success) {
          const payload = extractRideDetailsPayload(result.data);
          const mapped = mapRideDetailsSummary(payload);

          if (mapped) {
            setRideDetails(mapped);
          } else {
            setError(t('users.rideDetailsUnavailable'));
          }
        } else {
          setError(result.error || t('users.rideDetailsUnavailable'));
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || t('users.rideDetailsUnavailable'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadRideDetails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, rideId, t]);

  if (!isOpen) {
    return null;
  }

  const isCancelled = ['cancelled', 'canceled'].includes(String(rideDetails?.status || '').toLowerCase());

  return (
    <div className="modal-overlay user-ride-modal-overlay" onClick={onClose}>
      <div className="modal-content user-ride-modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('users.rideDetailsTitle')}</h2>
          <button className="modal-close" type="button" onClick={onClose} aria-label={t('common.close')}>
            ×
          </button>
        </div>

        <div className="modal-body user-ride-modal-body">
          {isLoading && !rideDetails ? (
            <LazyLoader variant="content" lines={2} message={t('rides.loadingRideDetails')} />
          ) : error && !rideDetails ? (
            <div className="user-ride-modal-error">{error}</div>
          ) : rideDetails ? (
            <>
              <div className="user-ride-modal-summary">
                <div className="user-ride-modal-id">#{rideDetails.id}</div>
                <span className={`user-ride-modal-status user-ride-modal-status-${String(rideDetails.status).toLowerCase()}`}>
                  {translateApiLabel(rideDetails.status)}
                </span>
              </div>

              <div className="user-ride-details-grid">
                <DetailRow label={t('users.date')} value={rideDetails.date ? formatDateTime(rideDetails.date) : null} />
                <DetailRow
                  label={t('users.route')}
                  value={`${rideDetails.route.from} → ${rideDetails.route.to}`}
                />
                <DetailRow label={t('users.driver')} value={rideDetails.driver?.name} />
                <DetailRow label={t('users.phoneNumber')} value={rideDetails.driver?.phone} />
                <DetailRow label={t('drivers.vehicleModel')} value={rideDetails.driver?.vehicle} />
                <DetailRow label={t('drivers.licensePlate')} value={rideDetails.driver?.licensePlate} />
                <DetailRow label={t('users.fare')} value={formatCurrency(rideDetails.fare.total)} />
                <DetailRow label={t('rides.paymentMethod')} value={rideDetails.payment?.method} />
                <DetailRow label={t('rides.paymentStatus')} value={rideDetails.payment?.status} />
                <DetailRow
                  label={t('users.requestedAt')}
                  value={rideDetails.timeline?.requestedAt ? formatDateTime(rideDetails.timeline.requestedAt) : null}
                />
                <DetailRow
                  label={t('users.completedAt')}
                  value={rideDetails.timeline?.completedAt ? formatDateTime(rideDetails.timeline.completedAt) : null}
                />
              </div>

              {isCancelled && (
                <div className="user-ride-cancellation-panel">
                  <h3>{t('users.cancellationDetails')}</h3>
                  <DetailRow
                    label={t('users.cancellationReason')}
                    value={rideDetails.cancellation?.reason || t('users.noCancellationReason')}
                  />
                  <DetailRow
                    label={t('users.cancelledBy')}
                    value={rideDetails.cancellation?.cancelledBy ? translateApiLabel(rideDetails.cancellation.cancelledBy) : null}
                  />
                  <DetailRow
                    label={t('users.cancelledAt')}
                    value={
                      rideDetails.cancellation?.cancelledAt
                        ? formatDateTime(rideDetails.cancellation.cancelledAt)
                        : null
                    }
                  />
                </div>
              )}

              {error && (
                <div className="user-ride-modal-warning">{error}</div>
              )}
            </>
          ) : null}
        </div>

        <div className="modal-footer user-ride-modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserRideDetailsModal;
