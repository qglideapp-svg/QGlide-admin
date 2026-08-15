const seenBookingIds = new Set();
let hasBaseline = false;
let bookingListener = null;

export const RIDE_BOOKINGS_SINCE_STORAGE_KEY = 'qglide_ride_bookings_live_since';

export const setRideBookingListener = (listener) => {
  bookingListener = typeof listener === 'function' ? listener : null;
};

export const detectNewRideBookings = (bookings = []) => {
  if (!Array.isArray(bookings) || bookings.length === 0) {
    hasBaseline = true;
    return [];
  }

  const newlyBooked = [];

  bookings.forEach((booking) => {
    const id = String(booking.id || '');
    if (!id) {
      return;
    }

    if (hasBaseline && !seenBookingIds.has(id)) {
      newlyBooked.push(booking);
    }

    seenBookingIds.add(id);
  });

  hasBaseline = true;

  if (newlyBooked.length && bookingListener) {
    newlyBooked.forEach((booking) => bookingListener(booking));
  }

  return newlyBooked;
};

export const readStoredRideBookingsSince = () => {
  try {
    return localStorage.getItem(RIDE_BOOKINGS_SINCE_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const storeRideBookingsSince = (since) => {
  if (!since) {
    return;
  }

  try {
    localStorage.setItem(RIDE_BOOKINGS_SINCE_STORAGE_KEY, since);
  } catch {
    // Ignore storage errors
  }
};
