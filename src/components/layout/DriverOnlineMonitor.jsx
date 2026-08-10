import React, { useCallback, useEffect, useRef, useState } from 'react';
import DriverOnlineToast from '../common/DriverOnlineToast';
import { fetchAllDriversForMonitoring, transformDriverData } from '../../services/driverService';
import {
  detectNewlyOnlineDrivers,
  setDriverOnlineListener,
} from '../../utils/driverOnlineState';

const POLL_INTERVAL_MS = 2000;

const DriverOnlineMonitor = () => {
  const [toast, setToast] = useState(null);
  const toastQueueRef = useRef([]);
  const isPollingRef = useRef(false);
  const isMountedRef = useRef(true);

  const showNextToast = useCallback(() => {
    const nextToast = toastQueueRef.current.shift();

    if (!nextToast) {
      setToast(null);
      return;
    }

    setToast(nextToast);
  }, []);

  const enqueueOnlineAlert = useCallback((driver) => {
    const alert = {
      type: 'success',
      driverId: driver.id,
      message: '',
      name: driver.name,
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
    setDriverOnlineListener(enqueueOnlineAlert);

    return () => {
      isMountedRef.current = false;
      setDriverOnlineListener(null);
    };
  }, [enqueueOnlineAlert]);

  const pollDriverStatuses = useCallback(async () => {
    if (isPollingRef.current) {
      return;
    }

    isPollingRef.current = true;

    try {
      const result = await fetchAllDriversForMonitoring();

      if (!isMountedRef.current || !result.success) {
        return;
      }

      const freshDrivers = result.drivers.map(transformDriverData);
      detectNewlyOnlineDrivers(freshDrivers);
    } catch {
      // Ignore background poll errors
    } finally {
      isPollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    pollDriverStatuses();

    const intervalId = window.setInterval(pollDriverStatuses, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [pollDriverStatuses]);

  if (!toast) {
    return null;
  }

  return (
    <DriverOnlineToast
      driverId={toast.driverId}
      driverName={toast.name}
      type={toast.type}
      duration={8000}
      onClose={showNextToast}
    />
  );
};

export default DriverOnlineMonitor;
