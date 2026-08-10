const onlineStateByDriverId = new Map();
let hasBaseline = false;
let onlineListener = null;

export const setDriverOnlineListener = (listener) => {
  onlineListener = typeof listener === 'function' ? listener : null;
};

export const seedDriverOnlineState = (drivers = []) => {
  drivers.forEach((driver) => {
    const key = String(driver.id || '');
    if (!key) {
      return;
    }

    onlineStateByDriverId.set(key, Boolean(driver.isOnline));
  });

  hasBaseline = true;
};

export const detectNewlyOnlineDrivers = (drivers = []) => {
  const newlyOnline = [];

  drivers.forEach((driver) => {
    const key = String(driver.id || '');
    if (!key) {
      return;
    }

    const isOnline = Boolean(driver.isOnline);
    const wasOnline = onlineStateByDriverId.get(key);

    if (hasBaseline && wasOnline === false && isOnline) {
      newlyOnline.push(driver);
    }

    onlineStateByDriverId.set(key, isOnline);
  });

  hasBaseline = true;

  if (newlyOnline.length && onlineListener) {
    newlyOnline.forEach((driver) => onlineListener(driver));
  }

  return newlyOnline;
};
