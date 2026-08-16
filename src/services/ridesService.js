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

function extractLiveOperationsPayload(data) {
  if (!data || typeof data !== 'object') {
    return { events: [], nextSince: null, hasNew: false };
  }

  const root = data.data && typeof data.data === 'object' ? data.data : data;
  const events =
    (Array.isArray(root.events) && root.events) ||
    (Array.isArray(root.items) && root.items) ||
    (Array.isArray(root.operations) && root.operations) ||
    (Array.isArray(root.data) && root.data) ||
    [];

  const nextSince =
    root.next_since ??
    root.nextSince ??
    data.next_since ??
    data.nextSince ??
    null;

  const hasNew = Boolean(root.has_new ?? root.hasNew ?? data.has_new ?? data.hasNew);

  return { events, nextSince, hasNew };
}

function normalizeOperationEventType(rawType) {
  const type = String(rawType || '').toLowerCase().replace(/-/g, '_');

  if (
    type.includes('pickup') ||
    type.includes('picked_up') ||
    type === 'ride_started' ||
    type === 'trip_started'
  ) {
    return 'pickup';
  }

  if (type.includes('complete') || type === 'ride_completed' || type === 'trip_completed') {
    return 'completed';
  }

  if (type.includes('complaint')) {
    return 'complaint';
  }

  if (type.includes('ticket') || type.includes('support')) {
    return 'support_ticket';
  }

  return type || 'unknown';
}

export const normalizeLiveOperationEvent = (raw, index = 0) => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const rider = raw.rider && typeof raw.rider === 'object' ? raw.rider : {};
  const driver = raw.driver && typeof raw.driver === 'object' ? raw.driver : {};
  const route = raw.route && typeof raw.route === 'object' ? raw.route : {};
  const ticket = raw.ticket && typeof raw.ticket === 'object' ? raw.ticket : {};
  const eventType = normalizeOperationEventType(
    raw.type ?? raw.event_type ?? raw.eventType ?? raw.kind ?? raw.category,
  );

  return {
    id: String(
      raw.id ??
      raw.event_id ??
      raw.eventId ??
      `${eventType}_${raw.occurred_at ?? raw.created_at ?? index}`,
    ),
    type: eventType,
    rideId: raw.ride_id ?? raw.rideId ?? raw.ride?.id ?? route.ride_id ?? null,
    ticketId: raw.ticket_id ?? raw.ticketId ?? ticket.id ?? raw.support_ticket_id ?? null,
    riderName:
      rider.name ??
      rider.full_name ??
      raw.rider_name ??
      raw.requester_name ??
      ticket.requester_name ??
      null,
    driverName:
      driver.name ??
      driver.full_name ??
      raw.driver_name ??
      null,
    title:
      raw.title ??
      raw.subject ??
      ticket.title ??
      ticket.subject ??
      null,
    message:
      raw.message ??
      raw.description ??
      raw.summary ??
      raw.body ??
      ticket.message ??
      ticket.description ??
      null,
    pickup:
      route.pickup_address ??
      raw.pickup_address ??
      raw.pickup_location ??
      null,
    dropoff:
      route.dropoff_address ??
      raw.dropoff_address ??
      raw.dropoff_location ??
      null,
    occurredAt:
      raw.occurred_at ??
      raw.occurredAt ??
      raw.created_at ??
      raw.timestamp ??
      null,
  };
};

export const fetchLiveOperations = async ({
  since = null,
  waitSeconds = 25,
  signal,
} = {}) => {
  try {
    const params = new URLSearchParams();
    if (since) {
      params.append('since', since);
    }
    params.append('wait_seconds', String(waitSeconds));

    const url = `${RIDES_API_BASE}/admin-operations-live?${params.toString()}`;
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
    const { events, nextSince, hasNew } = extractLiveOperationsPayload(data);

    return {
      success: true,
      events: events
        .map((event, index) => normalizeLiveOperationEvent(event, index))
        .filter(Boolean),
      nextSince,
      hasNew,
      raw: data,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, aborted: true, error: error.message };
    }

    console.error('Live Operations API Error:', error);
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

const FARE_META_KEYS = new Set([
  'distance_km',
  'time_minutes',
  'promo_code',
  'surge_multiplier',
  'total_fare',
  'final_fare',
  'subtotal',
  'currency',
]);

const FARE_LINE_DEFINITIONS = [
  { keys: ['base_fare'], labelKey: 'baseFare', kind: 'charge' },
  {
    keys: ['distance_fare'],
    labelKey: 'distance',
    kind: 'charge',
    metaKey: 'distance_km',
    metaSuffixKey: 'km',
  },
  {
    keys: ['time_fare'],
    labelKey: 'time',
    kind: 'charge',
    metaKey: 'time_minutes',
    metaSuffixKey: 'min',
  },
  { keys: ['booking_fee'], labelKey: 'bookingFee', kind: 'charge' },
  { keys: ['airport_surcharge'], labelKey: 'airportSurcharge', kind: 'charge' },
  { keys: ['night_surcharge'], labelKey: 'nightSurcharge', kind: 'charge' },
  { keys: ['peak_hour_surcharge', 'peak_surcharge'], labelKey: 'peakHourSurcharge', kind: 'charge' },
  { keys: ['surge_amount', 'surge_surcharge', 'surge_fare'], labelKey: 'surgeAmount', kind: 'charge' },
  {
    keys: [
      'waiting_time_charge',
      'wait_component_qar',
      'waiting_charge',
      'waiting_fee',
      'pickup_wait_charge',
      'wait_fee_amount',
    ],
    labelKey: 'waitingTimeCharge',
    kind: 'charge',
  },
  {
    keys: [
      'government_imposition_surcharge_qar',
      'government_fee_charge',
      'government_fee',
    ],
    labelKey: 'governmentFee',
    kind: 'charge',
  },
  { keys: ['minimum_fare_adjustment', 'minimum_fare_top_up'], labelKey: 'minimumFareAdjustment', kind: 'charge' },
  {
    keys: ['trip_fare_before_wait', 'calculated_fare_after_surge', 'fare_total_charge', 'fare_total'],
    labelKey: 'tripFare',
    kind: 'charge',
    aggregate: true,
  },
  { keys: ['promo_discount'], labelKey: 'promoCode', kind: 'discount', codeKey: 'promo_code' },
  { keys: ['location_discount', 'discount_amount'], labelKey: 'locationDiscount', kind: 'discount' },
];

function readFareAmount(raw) {
  if (raw == null || raw === '') return null;
  const value = typeof raw === 'number' ? raw : parseFloat(String(raw));
  return Number.isFinite(value) ? value : null;
}

function readFirstFareAmount(source, keys) {
  if (!source || typeof source !== 'object') return null;
  for (const key of keys) {
    const value = readFareAmount(source[key]);
    if (value != null) return value;
  }
  return null;
}

function mergeFareSources(apiRide) {
  const fareDetails = apiRide?.fare_details && typeof apiRide.fare_details === 'object'
    ? { ...apiRide.fare_details }
    : {};

  const fareBreakdown = apiRide?.fare_breakdown && typeof apiRide.fare_breakdown === 'object'
    ? apiRide.fare_breakdown
    : null;

  if (fareBreakdown) {
    return { ...fareBreakdown, ...fareDetails };
  }

  return fareDetails;
}

function humanizeFareKey(key) {
  return String(key)
    .replace(/_qar$/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildExtraFareLineItems(source, usedKeys) {
  if (!source || typeof source !== 'object') return [];

  return Object.entries(source)
    .filter(([key, value]) => {
      if (usedKeys.has(key) || FARE_META_KEYS.has(key)) return false;
      const amount = readFareAmount(value);
      return amount != null && amount !== 0;
    })
    .map(([key, value]) => ({
      id: key,
      labelKey: null,
      label: humanizeFareKey(key),
      amount: readFareAmount(value),
      kind: readFareAmount(value) < 0 ? 'discount' : 'charge',
      isExtra: true,
    }));
}

function mapApiFareLineItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const amount = readFareAmount(item.amount);
      if (amount == null || amount === 0) return null;

      return {
        id: String(item.key ?? `line_item_${index}`),
        key: item.key ?? null,
        label: String(item.label ?? humanizeFareKey(item.key ?? `item_${index}`)).trim(),
        amount,
        detail: item.detail != null && String(item.detail).trim() !== '' ? String(item.detail).trim() : null,
        kind: amount < 0 ? 'discount' : 'charge',
        isExtra: false,
      };
    })
    .filter(Boolean);
}

function resolveFareTotal(source, apiRide, options = {}) {
  const { preferAfterPromo = true } = options;

  if (preferAfterPromo) {
    const afterPromo = readFareAmount(source.total_after_promo);
    if (afterPromo != null) return afterPromo;
  }

  return readFirstFareAmount(source, [
    'actual_fare',
    'gross_total_fare',
    'total_fare',
    'final_fare',
    'rider_paid_amount',
  ]) ?? readFareAmount(apiRide?.fare ?? apiRide?.total_amount ?? apiRide?.price) ?? 0;
}

function normalizeFareDetailsFromLineItems(source, apiRide) {
  const lineItems = mapApiFareLineItems(source.line_items);
  const promoDiscount = readFareAmount(source.promo_discount) ?? 0;
  const promoCode = source.promo_code ? String(source.promo_code) : null;
  const hasPromoLine = lineItems.some((item) => ['promo', 'promo_discount', 'promo_code'].includes(item.key));

  if (promoDiscount > 0 && !hasPromoLine) {
    lineItems.push({
      id: 'promo_discount',
      key: 'promo_discount',
      label: promoCode ? `Promo (${promoCode})` : 'Promo discount',
      amount: promoDiscount,
      detail: null,
      kind: 'discount',
      isExtra: false,
    });
  }

  const grossTotal = readFareAmount(source.gross_total_fare);
  const totalAfterPromo = readFareAmount(source.total_after_promo);
  const total = resolveFareTotal(source, apiRide, { preferAfterPromo: true });

  return {
    lineItems,
    currency: source.currency ? String(source.currency) : 'QAR',
    rideType: source.ride_type ?? null,
    carType: source.car_type ?? null,
    isEstimate: Boolean(source.is_estimate),
    estimatedFare: readFareAmount(source.estimated_fare),
    grossTotal,
    totalAfterPromo,
    total,
    promoCode: promoCode
      ? {
          code: promoCode,
          discount: promoDiscount,
        }
      : null,
    reconciliation: source.reconciliation && typeof source.reconciliation === 'object'
      ? source.reconciliation
      : null,
    notes: Array.isArray(source.notes) ? source.notes.filter(Boolean) : [],
    distanceKm: source.distance_km ?? null,
    timeMinutes: source.time_minutes ?? null,
    surgeMultiplier: readFareAmount(source.surge_multiplier),
    raw: source,
  };
}

export function normalizeFareDetails(apiRide) {
  const source = mergeFareSources(apiRide);

  if (Array.isArray(source.line_items) && source.line_items.length > 0) {
    return normalizeFareDetailsFromLineItems(source, apiRide);
  }

  const usedKeys = new Set();
  const lineItems = [];
  const hasComponentBreakdown = ['base_fare', 'distance_fare', 'time_fare'].some((key) => {
    const amount = readFareAmount(source[key]);
    return amount != null && amount !== 0;
  });

  for (const definition of FARE_LINE_DEFINITIONS) {
    if (definition.aggregate && hasComponentBreakdown) {
      definition.keys.forEach((key) => usedKeys.add(key));
      continue;
    }

    const amount = readFirstFareAmount(source, definition.keys);
    if (amount == null || amount === 0) {
      definition.keys.forEach((key) => usedKeys.add(key));
      continue;
    }

    definition.keys.forEach((key) => usedKeys.add(key));

    const item = {
      id: definition.keys[0],
      labelKey: definition.labelKey,
      amount,
      kind: definition.kind,
      isExtra: false,
    };

    if (definition.metaKey && source[definition.metaKey] != null) {
      item.metaValue = source[definition.metaKey];
      item.metaSuffixKey = definition.metaSuffixKey ?? null;
      usedKeys.add(definition.metaKey);
    }

    if (definition.codeKey && source[definition.codeKey]) {
      item.code = String(source[definition.codeKey]);
      usedKeys.add(definition.codeKey);
    }

    lineItems.push(item);
  }

  lineItems.push(...buildExtraFareLineItems(source, usedKeys));

  const promoDiscount = readFirstFareAmount(source, ['promo_discount']);
  if (promoDiscount != null) {
    usedKeys.add('promo_discount');
  }
  if (source.promo_code) {
    usedKeys.add('promo_code');
  }

  const total = resolveFareTotal(source, apiRide, { preferAfterPromo: true });

  return {
    lineItems,
    currency: source.currency ? String(source.currency) : 'QAR',
    rideType: source.ride_type ?? null,
    carType: source.car_type ?? null,
    isEstimate: Boolean(source.is_estimate),
    estimatedFare: readFareAmount(source.estimated_fare),
    grossTotal: readFareAmount(source.gross_total_fare),
    totalAfterPromo: readFareAmount(source.total_after_promo),
    total,
    distanceKm: source.distance_km ?? null,
    timeMinutes: source.time_minutes ?? null,
    surgeMultiplier: readFareAmount(source.surge_multiplier),
    promoCode: source.promo_code
      ? {
          code: String(source.promo_code),
          discount: promoDiscount ?? 0,
        }
      : null,
    reconciliation: source.reconciliation && typeof source.reconciliation === 'object'
      ? source.reconciliation
      : null,
    notes: Array.isArray(source.notes) ? source.notes.filter(Boolean) : [],
    raw: source,
  };
}

export function resolveRideListFare(ride) {
  if (!ride || typeof ride !== 'object') return 0;

  const normalized = normalizeFareDetails(ride);
  if (normalized.total > 0) {
    return normalized.total;
  }

  return readFareAmount(ride.fare) ?? 0;
}

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
    fare: (() => {
      const normalizedFare = normalizeFareDetails(apiRide);
      return {
        total: normalizedFare.total,
        base: apiRide.fare_details?.base_fare ?? null,
        distance: apiRide.fare_details?.distance_fare ?? null,
        time: apiRide.fare_details?.time_fare ?? null,
        lineItems: normalizedFare.lineItems,
        distanceKm: normalizedFare.distanceKm,
        timeMinutes: normalizedFare.timeMinutes,
        surgeMultiplier: normalizedFare.surgeMultiplier,
        promoCode: normalizedFare.promoCode,
      };
    })(),
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
