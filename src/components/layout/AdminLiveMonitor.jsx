import React, { useCallback, useEffect, useRef, useState } from 'react';
import AdminLiveToast from '../common/AdminLiveToast';
import { fetchAdminDriverMessages } from '../../services/driverService';
import { fetchLiveOperations, fetchLiveRideBookings } from '../../services/ridesService';
import {
  detectNewIncomingDriverMessages,
  notifyDriverMessagesSummary,
  readStoredDriverMessagesSince,
  setIncomingDriverMessageListener,
  storeDriverMessagesSince,
} from '../../utils/driverMessagesLiveState';
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
const DRIVER_MESSAGES_POLL_MS = 2000;
const DRIVER_MESSAGES_FULL_SYNC_EVERY = 15;
const DRIVER_MESSAGES_LIMIT = 50;
const ERROR_RETRY_MS = 3000;

const AdminLiveMonitor = () => {
  const [toast, setToast] = useState(null);
  const toastQueueRef = useRef([]);
  const bookingsSinceRef = useRef(null);
  const operationsSinceRef = useRef(null);
  const driverMessagesSinceRef = useRef(null);
  const isBookingsPollingRef = useRef(false);
  const isOperationsPollingRef = useRef(false);
  const isDriverMessagesPollingRef = useRef(false);
  const driverMessagesPollCountRef = useRef(0);
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

  const enqueueDriverMessageAlert = useCallback((incomingMessage) => {
    enqueueAlert({
      kind: 'driver_message',
      driverId: incomingMessage.driverId,
      driverName: incomingMessage.driverName,
      message: incomingMessage.message,
      messageId: incomingMessage.id,
    });
  }, [enqueueAlert]);

  useEffect(() => {
    isMountedRef.current = true;
    setRideBookingListener(enqueueBookingAlert);
    setOperationListener(enqueueOperationAlert);
    setIncomingDriverMessageListener(enqueueDriverMessageAlert);

    return () => {
      isMountedRef.current = false;
      setRideBookingListener(null);
      setOperationListener(null);
      setIncomingDriverMessageListener(null);
    };
  }, [enqueueBookingAlert, enqueueDriverMessageAlert, enqueueOperationAlert]);

  useEffect(() => {
    bookingsSinceRef.current = readStoredRideBookingsSince();
    operationsSinceRef.current = readStoredOperationsSince();
    driverMessagesSinceRef.current = readStoredDriverMessagesSince();

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

    const pollDriverMessages = async () => {
      while (isMountedRef.current) {
        if (isDriverMessagesPollingRef.current) {
          await sleep(250);
          continue;
        }

        isDriverMessagesPollingRef.current = true;

        try {
          driverMessagesPollCountRef.current += 1;
          const shouldFullSync =
            !driverMessagesSinceRef.current ||
            driverMessagesPollCountRef.current % DRIVER_MESSAGES_FULL_SYNC_EVERY === 0;

          const result = await fetchAdminDriverMessages({
            since: shouldFullSync ? undefined : driverMessagesSinceRef.current,
            limit: DRIVER_MESSAGES_LIMIT,
            senderType: 'driver',
          });

          if (!isMountedRef.current) {
            break;
          }

          if (result.success) {
            const polledMessages = result.data.messages || [];
            const latestMessageAt =
              result.data.summary?.latestMessageAt ??
              polledMessages.reduce((latest, message) => {
                if (!message?.createdAt) {
                  return latest;
                }
                const parsed = new Date(message.createdAt);
                if (Number.isNaN(parsed.getTime())) {
                  return latest;
                }
                if (!latest || parsed.getTime() > new Date(latest).getTime()) {
                  return parsed.toISOString();
                }
                return latest;
              }, null);

            if (latestMessageAt) {
              driverMessagesSinceRef.current = latestMessageAt;
              storeDriverMessagesSince(latestMessageAt);
            }

            notifyDriverMessagesSummary(result.data.summary);
            detectNewIncomingDriverMessages(polledMessages);
          } else if (import.meta.env.DEV) {
            console.warn('[driver-messages poll]', result.error);
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn('[driver-messages poll]', error);
          }
        } finally {
          isDriverMessagesPollingRef.current = false;
        }

        await sleep(DRIVER_MESSAGES_POLL_MS);
      }
    };

    pollLiveBookings();
    pollLiveOperations();
    pollDriverMessages();

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
      driverId={toast.driverId}
      driverName={toast.driverName}
      riderName={toast.riderName}
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
