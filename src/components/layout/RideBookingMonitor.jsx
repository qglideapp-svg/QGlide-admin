import React, { useCallback, useEffect, useRef, useState } from 'react';
import RideBookingToast from '../common/RideBookingToast';
import { fetchLiveRideBookings } from '../../services/ridesService';
import {
  detectNewRideBookings,
  readStoredRideBookingsSince,
  setRideBookingListener,
  storeRideBookingsSince,
} from '../../utils/rideBookingLiveState';

const WAIT_SECONDS = 25;
const BOOKING_LIMIT = 20;
const ERROR_RETRY_MS = 3000;

const RideBookingMonitor = () => {
  const [toast, setToast] = useState(null);
  const toastQueueRef = useRef([]);
  const sinceRef = useRef(null);
  const isPollingRef = useRef(false);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);

  const showNextToast = useCallback(() => {
    const nextToast = toastQueueRef.current.shift();

    if (!nextToast) {
      setToast(null);
      return;
    }

    setToast(nextToast);
  }, []);

  const enqueueBookingAlert = useCallback((booking) => {
    const alert = {
      type: 'info',
      rideId: booking.id,
      riderName: booking.riderName,
      pickup: booking.pickup,
      dropoff: booking.dropoff,
    };

    setToast((current) => {
      if (!current) {
        return alert;
      }

      toastQueueRef.current.push(alert);
      return current;
    });
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    setRideBookingListener(enqueueBookingAlert);

    return () => {
      isMountedRef.current = false;
      setRideBookingListener(null);
    };
  }, [enqueueBookingAlert]);

  useEffect(() => {
    sinceRef.current = readStoredRideBookingsSince() || new Date().toISOString();

    const sleep = (ms) =>
      new Promise((resolve) => {
        window.setTimeout(resolve, ms);
      });

    const pollLiveBookings = async () => {
      while (isMountedRef.current) {
        if (isPollingRef.current) {
          await sleep(250);
          continue;
        }

        isPollingRef.current = true;
        abortControllerRef.current = new AbortController();

        try {
          const result = await fetchLiveRideBookings({
            since: sinceRef.current,
            waitSeconds: WAIT_SECONDS,
            limit: BOOKING_LIMIT,
            signal: abortControllerRef.current.signal,
          });

          if (!isMountedRef.current || result.aborted) {
            break;
          }

          if (result.success) {
            if (result.nextSince) {
              sinceRef.current = result.nextSince;
              storeRideBookingsSince(result.nextSince);
            }

            detectNewRideBookings(result.bookings || []);

            continue;
          }

          await sleep(ERROR_RETRY_MS);
        } catch {
          if (!isMountedRef.current) {
            break;
          }

          await sleep(ERROR_RETRY_MS);
        } finally {
          isPollingRef.current = false;
          abortControllerRef.current = null;
        }
      }
    };

    pollLiveBookings();

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  if (!toast) {
    return null;
  }

  return (
    <RideBookingToast
      rideId={toast.rideId}
      riderName={toast.riderName}
      pickup={toast.pickup}
      dropoff={toast.dropoff}
      type={toast.type}
      duration={10000}
      onClose={showNextToast}
    />
  );
};

export default RideBookingMonitor;
