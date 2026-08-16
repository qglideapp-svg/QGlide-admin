const seenEventIds = new Set();
let hasBaseline = false;
let operationListener = null;

export const OPERATIONS_SINCE_STORAGE_KEY = 'qglide_admin_operations_live_since';

export const setOperationListener = (listener) => {
  operationListener = typeof listener === 'function' ? listener : null;
};

export const detectNewOperationEvents = (events = []) => {
  if (!Array.isArray(events) || events.length === 0) {
    hasBaseline = true;
    return [];
  }

  const newlyDetected = [];

  events.forEach((event) => {
    const id = String(event.id || '');
    if (!id) {
      return;
    }

    if (hasBaseline && !seenEventIds.has(id)) {
      newlyDetected.push(event);
    }

    seenEventIds.add(id);
  });

  hasBaseline = true;

  if (newlyDetected.length && operationListener) {
    newlyDetected.forEach((event) => operationListener(event));
  }

  return newlyDetected;
};

export const readStoredOperationsSince = () => {
  try {
    return localStorage.getItem(OPERATIONS_SINCE_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const storeOperationsSince = (since) => {
  if (!since) {
    return;
  }

  try {
    localStorage.setItem(OPERATIONS_SINCE_STORAGE_KEY, since);
  } catch {
    // Ignore storage errors
  }
};
