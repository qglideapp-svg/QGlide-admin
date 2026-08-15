import { authenticatedFetch } from './apiClient';
import { SUPABASE_ANON_KEY } from './authService';


const RIDES_API_BASE = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

function parseErrorMessage(errorData, fallback) {
  if (!errorData || typeof errorData !== 'object') return fallback;
  const err = errorData.error ?? errorData.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && typeof err.message === 'string') return err.message;
  return fallback;
}

function extractLiveBookingsPayload(data) {
  if (!data || typeof data !== 'object') {
    return { bookings: [], nextSince: null };
  }

  const root = data.data && typeof data.data === 'object' ? data.data : data;
  const bookings =
    (Array.isArray(root.bookings) && root.bookings) ||
    (Array.isArray(root.rides) && root.rides) ||
    (Array.isArray(root.items) && root.items) ||
    (Array.isArray(root.data) && root.data) ||
    [];

  const nextSince =
    root.next_since ??
    root.nextSince ??
    data.next_since ??
    data.nextSince ??
    null;

  return { bookings, nextSince };
}

export const normalizeLiveRideBooking = (raw, index = 0) => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const rider = raw.rider && typeof raw.rider === 'object' ? raw.rider : {};
  const route = raw.route && typeof raw.route === 'object' ? raw.route : {};

  return {
    id: raw.id ?? raw.ride_id ?? raw.booking_id ?? `booking_${index}`,
    riderName:
      rider.name ??
      rider.full_name ??
      raw.rider_name ??
      raw.user_name ??
      null,
    pickup:
      route.pickup_address ??
      raw.pickup_address ??
      raw.pickup_location ??
      raw.from_address ??
      null,
    dropoff:
      route.dropoff_address ??
      raw.dropoff_address ??
      raw.dropoff_location ??
      raw.to_address ??
      null,
    fare: parseFloat(raw.fare ?? raw.total_amount ?? raw.price ?? 0) || 0,
    status: raw.status ?? 'pending',
    createdAt:
      raw.created_at ??
      raw.booked_at ??
      raw.requested_at ??
      raw.timestamp ??
      null,
  };
};

export const fetchLiveRideBookings = async ({
  since = null,
  waitSeconds = 25,
  limit = 20,
  signal,
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (since) {
      params.append('since', since);
    }
    params.append('wait_seconds', String(waitSeconds));
    params.append('limit', String(limit));

    const url = `${RIDES_API_BASE}/admin-ride-bookings-live?${params.toString()}`;
    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
      },
      signal,
    });

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = parseErrorMessage(errorData, errorMessage);
      } catch {
        // Ignore JSON parse errors for non-JSON responses
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const { bookings, nextSince } = extractLiveBookingsPayload(data);

    return {
      success: true,
      bookings: bookings
        .map((booking, index) => normalizeLiveRideBooking(booking, index))
        .filter(Boolean),
      nextSince,
      raw: data,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, aborted: true, error: error.message };
    }

    console.error('Live Ride Bookings API Error:', error);
    return { success: false, error: error.message };
  }
};

export const fetchRidesList = async (filters = {}) => {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== 'All Statuses') {
      params.append('status', filters.status.toLowerCase());
    }
    
    if (filters.date) {
      params.append('date', filters.date);
    }
    
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    
    if (filters.pageSize) {
      params.append('page_size', filters.pageSize.toString());
    }

    const url = `${RIDES_API_BASE}/admin-rides-list?${params.toString()}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Rides List API Error:', error);
    return { success: false, error: error.message };
  }
};

export const fetchRideDetails = async (rideId) => {
  try {
    const params = new URLSearchParams();
    params.append('ride_id', rideId);

    const url = `${RIDES_API_BASE}/admin-ride-details?${params.toString()}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Ride Details API Error:', error);
    return { success: false, error: error.message };
  }
};

export const extractRideDetailsPayload = (responseData) => {
  if (!responseData) {
    return null;
  }

  if (responseData.data?.ride) {
    return responseData.data.ride;
  }

  if (responseData.data?.data?.ride) {
    return responseData.data.data.ride;
  }

  if (responseData.ride) {
    return responseData.ride;
  }

  if (responseData.data && typeof responseData.data === 'object' && !Array.isArray(responseData.data)) {
    return responseData.data;
  }

  return responseData;
};

const readCancellationReason = (apiRide) => {
  const cancellation = apiRide.cancellation || apiRide.cancel_details || apiRide.cancellation_details || {};

  return (
    apiRide.cancellation_reason ||
    apiRide.cancel_reason ||
    apiRide.cancelled_reason ||
    apiRide.canceled_reason ||
    cancellation.reason ||
    cancellation.cancellation_reason ||
    cancellation.cancel_reason ||
    cancellation.note ||
    cancellation.description ||
    null
  );
};

const readCancelledBy = (apiRide) => {
  const cancellation = apiRide.cancellation || apiRide.cancel_details || apiRide.cancellation_details || {};

  return (
    apiRide.cancelled_by ||
    apiRide.canceled_by ||
    cancellation.cancelled_by ||
    cancellation.canceled_by ||
    cancellation.cancelled_by_role ||
    null
  );
};

export const mapRideDetailsSummary = (apiRide) => {
  if (!apiRide) {
    return null;
  }

  const statusRaw = String(apiRide.status || '').toLowerCase();
  const isCancelled = statusRaw === 'cancelled' || statusRaw === 'canceled';
  const cancellationReason = readCancellationReason(apiRide);
  const cancelledBy = readCancelledBy(apiRide);
  const cancelledAt =
    apiRide.timeline?.cancelled_at ||
    apiRide.timeline?.canceled_at ||
    apiRide.cancelled_at ||
    apiRide.canceled_at ||
    apiRide.cancellation?.cancelled_at ||
    null;

  return {
    id: apiRide.id || apiRide.ride_id,
    status: apiRide.status || 'Unknown',
    date: apiRide.created_at || apiRide.requested_at || apiRide.timeline?.requested_at || null,
    route: {
      from:
        apiRide.route?.pickup_address ||
        apiRide.pickup_location ||
        apiRide.pickup_address ||
        apiRide.from_address ||
        'Unknown',
      to:
        apiRide.route?.dropoff_address ||
        apiRide.dropoff_location ||
        apiRide.dropoff_address ||
        apiRide.to_address ||
        'Unknown',
    },
    driver: {
      name: apiRide.driver?.name || apiRide.driver?.full_name || apiRide.driver_name || 'Unknown Driver',
      phone: apiRide.driver?.phone || apiRide.driver_phone || null,
      vehicle: apiRide.driver?.vehicle || apiRide.vehicle_model || null,
      licensePlate: apiRide.driver?.license_plate || apiRide.license_plate || null,
    },
    rider: {
      name: apiRide.rider?.name || apiRide.rider?.full_name || apiRide.rider_name || null,
      phone: apiRide.rider?.phone || apiRide.rider_phone || null,
    },
    fare: {
      total: parseFloat(apiRide.fare_details?.total_fare || apiRide.fare || apiRide.total_amount || apiRide.price || 0),
      base: apiRide.fare_details?.base_fare ?? null,
      distance: apiRide.fare_details?.distance_fare ?? null,
      time: apiRide.fare_details?.time_fare ?? null,
    },
    payment: {
      method: apiRide.payment?.payment_method || apiRide.payment_method || null,
      status: apiRide.payment?.status || apiRide.payment_status || null,
    },
    timeline: {
      requestedAt: apiRide.timeline?.requested_at || apiRide.created_at || null,
      acceptedAt: apiRide.timeline?.accepted_at || null,
      startedAt: apiRide.timeline?.started_at || null,
      completedAt: apiRide.timeline?.completed_at || null,
      cancelledAt,
    },
    cancellation: isCancelled || cancellationReason || cancelledBy || cancelledAt
      ? {
          reason: cancellationReason,
          cancelledBy,
          cancelledAt,
        }
      : null,
  };
};
