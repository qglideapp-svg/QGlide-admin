import React, { useCallback, useEffect, useRef, useState } from 'react';
import AdminLiveToast from '../common/AdminLiveToast';
import { fetchLiveOperations, fetchLiveRideBookings } from '../../services/ridesService';
import {
  detectNewRideBookings,
  readStoredRideBookingsSince,
  setRideBookingListener,
  storeRideBookingsSince,
} from '../../utils/rideBookingLiveState';
import {
  detectNewOperationEvents,
  readStoredOperationsSince,
  setOperationListener,
  storeOperationsSince,
} from '../../utils/operationsLiveState';

const WAIT_SECONDS = 25;
const BOOKING_LIMIT = 20;
const ERROR_RETRY_MS = 3000;

const AdminLiveMonitor = () => {
  const [toast, setToast] = useState(null);
  const toastQueueRef = useRef([]);
  const bookingsSinceRef = useRef(null);
  const operationsSinceRef = useRef(null);
  const isBookingsPollingRef = useRef(false);
  const isOperationsPollingRef = useRef(false);
  const isMountedRef = useRef(true);
  const bookingsAbortRef = useRef(null);
  const operationsAbortRef = useRef(null);

  const showNextToast = useCallback(() => {
    const nextToast = toastQueueRef.current.shift();

    if (!nextToast) {
      setToast(null);
      return;
    }

    setToast(nextToast);
  }, []);

  const enqueueAlert = useCallback((alert) => {
    setToast((current) => {
      if (!current) {
        return alert;
      }

      toastQueueRef.current.push(alert);
      return current;
    });
  }, []);

  const enqueueBookingAlert = useCallback((booking) => {
    enqueueAlert({
      kind: 'booking',
      rideId: booking.id,
      riderName: booking.riderName,
      pickup: booking.pickup,
      dropoff: booking.dropoff,
    });
  }, [enqueueAlert]);

  const enqueueOperationAlert = useCallback((event) => {
    const supportedTypes = new Set(['pickup', 'completed', 'support_ticket', 'complaint']);
    if (!supportedTypes.has(event.type)) {
      return;
    }

    enqueueAlert({
      kind: event.type,
      rideId: event.rideId,
      ticketId: event.ticketId,
      riderName: event.riderName,
      driverName: event.driverName,
      pickup: event.pickup,
      dropoff: event.dropoff,
      title: event.title,
      message: event.message,
    });
  }, [enqueueAlert]);

  useEffect(() => {
    isMountedRef.current = true;
    setRideBookingListener(enqueueBookingAlert);
    setOperationListener(enqueueOperationAlert);

    return () => {
      isMountedRef.current = false;
      setRideBookingListener(null);
      setOperationListener(null);
    };
  }, [enqueueBookingAlert, enqueueOperationAlert]);

  useEffect(() => {
    bookingsSinceRef.current = readStoredRideBookingsSince();
    operationsSinceRef.current = readStoredOperationsSince();

    const sleep = (ms) =>
      new Promise((resolve) => {
        window.setTimeout(resolve, ms);
      });

    const pollLiveBookings = async () => {
      while (isMountedRef.current) {
        if (isBookingsPollingRef.current) {
          await sleep(250);
          continue;
        }

        isBookingsPollingRef.current = true;
        bookingsAbortRef.current = new AbortController();

        try {
          const result = await fetchLiveRideBookings({
            since: bookingsSinceRef.current,
            waitSeconds: WAIT_SECONDS,
            limit: BOOKING_LIMIT,
            signal: bookingsAbortRef.current.signal,
          });

          if (!isMountedRef.current || result.aborted) {
            break;
          }

          if (result.success) {
            if (result.nextSince) {
              bookingsSinceRef.current = result.nextSince;
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
          isBookingsPollingRef.current = false;
          bookingsAbortRef.current = null;
        }
      }
    };

    const pollLiveOperations = async () => {
      while (isMountedRef.current) {
        if (isOperationsPollingRef.current) {
          await sleep(250);
          continue;
        }

        isOperationsPollingRef.current = true;
        operationsAbortRef.current = new AbortController();

        try {
          const result = await fetchLiveOperations({
            since: operationsSinceRef.current,
            waitSeconds: WAIT_SECONDS,
            signal: operationsAbortRef.current.signal,
          });

          if (!isMountedRef.current || result.aborted) {
            break;
          }

          if (result.success) {
            if (result.nextSince) {
              operationsSinceRef.current = result.nextSince;
              storeOperationsSince(result.nextSince);
            }

            detectNewOperationEvents(result.events || []);
            continue;
          }

          await sleep(ERROR_RETRY_MS);
        } catch {
          if (!isMountedRef.current) {
            break;
          }

          await sleep(ERROR_RETRY_MS);
        } finally {
          isOperationsPollingRef.current = false;
          operationsAbortRef.current = null;
        }
      }
    };

    pollLiveBookings();
    pollLiveOperations();

    return () => {
      isMountedRef.current = false;
      bookingsAbortRef.current?.abort();
      operationsAbortRef.current?.abort();
    };
  }, []);

  if (!toast) {
    return null;
  }

  return (
    <AdminLiveToast
      kind={toast.kind}
      rideId={toast.rideId}
      ticketId={toast.ticketId}
      riderName={toast.riderName}
      driverName={toast.driverName}
      pickup={toast.pickup}
      dropoff={toast.dropoff}
      title={toast.title}
      message={toast.message}
      duration={10000}
      onClose={showNextToast}
    />
  );
};

export default AdminLiveMonitor;
