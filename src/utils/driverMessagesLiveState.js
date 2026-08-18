const seenMessageIds = new Set();
let hasBaseline = false;
let messageListener = null;
let summaryListener = null;
let chatRefreshListener = null;

export const DRIVER_MESSAGES_SINCE_STORAGE_KEY = 'qglide_admin_driver_messages_since';

export const setIncomingDriverMessageListener = (listener) => {
  messageListener = typeof listener === 'function' ? listener : null;
};

export const setDriverMessagesSummaryListener = (listener) => {
  summaryListener = typeof listener === 'function' ? listener : null;
};

export const setDriverChatRefreshListener = (listener) => {
  chatRefreshListener = typeof listener === 'function' ? listener : null;
};

export const notifyDriverMessagesSummary = (summary) => {
  if (summary && summaryListener) {
    summaryListener(summary);
  }
};

export const notifyDriverChatRefresh = (message) => {
  if (message && chatRefreshListener) {
    chatRefreshListener(message);
  }
};

export const detectNewIncomingDriverMessages = (messages = []) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    hasBaseline = true;
    return [];
  }

  const newlyDetected = [];

  messages.forEach((message) => {
    const id = String(message.id || '');
    if (!id) {
      return;
    }

    if (hasBaseline && !seenMessageIds.has(id)) {
      newlyDetected.push(message);
    }

    seenMessageIds.add(id);
  });

  hasBaseline = true;

  if (newlyDetected.length) {
    newlyDetected.forEach((message) => {
      messageListener?.(message);
      notifyDriverChatRefresh(message);
    });
  }

  return newlyDetected;
};

export const readStoredDriverMessagesSince = () => {
  try {
    return localStorage.getItem(DRIVER_MESSAGES_SINCE_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const storeDriverMessagesSince = (since) => {
  if (!since) {
    return;
  }

  try {
    localStorage.setItem(DRIVER_MESSAGES_SINCE_STORAGE_KEY, since);
  } catch {
    // Ignore storage errors
  }
};
