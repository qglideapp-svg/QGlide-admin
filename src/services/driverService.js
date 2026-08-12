import { authenticatedFetch } from './apiClient';


const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2YXpvb3dtbWl5bWJiaHhvZ2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTQzMjQsImV4cCI6MjA3NTI3MDMyNH0.9vdJHTTnW38CctYwD9GZOvoX_SEu58FLu81mbjQFBdk';

export const mapStatusFilterToApiValue = (statusFilter = '') => {
  if (!statusFilter || statusFilter === 'All Statuses' || statusFilter.toLowerCase() === 'all') {
    return '';
  }

  const normalized = statusFilter.toLowerCase();
  if (normalized === 'online' || normalized === 'offline') {
    return '';
  }

  return normalized;
};

export const driverMatchesStatusFilter = (driver, statusFilter = 'All Statuses') => {
  if (statusFilter === 'All Statuses') return true;

  const driverStatus = typeof driver === 'string' ? driver : driver?.status;
  const isOnline = typeof driver === 'object' ? Boolean(driver?.isOnline) : false;
  const normalizedFilter = statusFilter.toLowerCase();
  const normalizedDriverStatus = String(driverStatus || '').toLowerCase();

  if (normalizedFilter === 'online') {
    return isOnline;
  }

  if (normalizedFilter === 'offline') {
    return !isOnline && normalizedDriverStatus !== 'suspended';
  }

  if (normalizedFilter === 'suspended') {
    return normalizedDriverStatus === 'suspended';
  }

  return normalizedDriverStatus === normalizedFilter;
};

export const fetchDriversList = async (searchTerm = '', statusFilter = '', ratingFilter = '', page = 1, limit = 20, startDate = '', endDate = '') => {
  try {
    // Use saved token from login
    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    const params = new URLSearchParams();
    
    if (searchTerm && searchTerm.trim()) {
      params.set('search', searchTerm.trim());
    }
    
    const normalizedStatusFilter = statusFilter?.toLowerCase?.() || '';
    if (normalizedStatusFilter === 'online') {
      params.set('is_online', 'true');
    } else if (normalizedStatusFilter === 'offline') {
      params.set('is_online', 'false');
    } else {
      const apiStatus = mapStatusFilterToApiValue(statusFilter);
      if (apiStatus) {
        params.set('status', apiStatus);
      }
    }

    if (ratingFilter && ratingFilter !== 'Any Rating' && ratingFilter !== 'Any') {
      params.set('min_rating', ratingFilter.replace('+', ''));
    }

    if (startDate) {
      params.set('start_date', startDate);
    }

    if (endDate) {
      params.set('end_date', endDate);
    }

    params.set('page', String(page));
    params.set('limit', String(limit));
    
    const queryString = params.toString();
    const url = `${API_BASE_URL}/admin-drivers-list?${queryString}`;

    console.log('🚀 API REQUEST DETAILS:', {
      '🔗 URL': url,
      '🔍 Search Term': searchTerm,
      '📊 Status Filter': statusFilter,
      '⭐ Rating Filter': ratingFilter,
      '📅 Start Date': startDate,
      '📅 End Date': endDate,
      '📄 Page': page,
      '📏 Limit': limit,
      '🔑 Has Anon Key': !!anonKey,
      '⏰ Timestamp': new Date().toISOString(),
      '🔍 Making request to admin-drivers-list endpoint': true
    });

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
      },
    });

    console.log('📡 HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '📋 Headers': Object.fromEntries(response.headers.entries()),
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Log the raw response first to see what we're getting
    console.log('📡 RAW API RESPONSE:', JSON.stringify(data, null, 2));
    
    // Try to find drivers in the response - check multiple possible locations
    let driversArray = [];
    
    // Check if response is directly an array
    if (Array.isArray(data)) {
      driversArray = data;
      console.log('✅ Found drivers as direct array');
    }
    // Check the actual API response structure: data.data.drivers
    else if (data.data && data.data.drivers && Array.isArray(data.data.drivers)) {
      driversArray = data.data.drivers;
      console.log('✅ Found drivers in data.data.drivers');
    }
    // Check other common API response structures
    else if (data.drivers && Array.isArray(data.drivers)) {
      driversArray = data.drivers;
      console.log('✅ Found drivers in data.drivers');
    }
    else if (data.data && Array.isArray(data.data)) {
      driversArray = data.data;
      console.log('✅ Found drivers in data.data');
    }
    else if (data.results && Array.isArray(data.results)) {
      driversArray = data.results;
      console.log('✅ Found drivers in data.results');
    }
    else if (data.items && Array.isArray(data.items)) {
      driversArray = data.items;
      console.log('✅ Found drivers in data.items');
    }
    else {
      console.log('❌ No drivers array found in response');
      console.log('Available keys:', Object.keys(data));
    }
    
    // Transform API response to match UI expectations
    const transformedData = {
      drivers: driversArray,
      totalCount: data.data?.total_count || data.totalCount || data.total || data.count || driversArray.length,
      totalPages: data.data?.total_pages || data.totalPages || Math.ceil((data.data?.total_count || data.totalCount || data.total || data.count || driversArray.length) / limit) || 1,
      currentPage: data.data?.page || data.page || page,
      hasNextPage: data.data?.hasNextPage || data.hasNextPage || false,
      hasPrevPage: data.data?.hasPrevPage || data.hasPrevPage || false
    };

    console.log('🔍 FULL API RESPONSE DEBUG:', {
      '📡 Raw Response': data,
      '🔍 Response Type': typeof data,
      '📊 Is Object': typeof data === 'object',
      '🔢 Response Keys': Object.keys(data || {}),
      '📝 Drivers Array': driversArray,
      '📏 Drivers Length': driversArray.length,
      '🔍 First Driver': driversArray[0] || 'No drivers',
      '📋 All Drivers': driversArray,
      '⚙️ Transformed Data': transformedData,
      '🔗 Request URL': url,
      '🔍 Data.drivers check': data.drivers,
      '🔍 Data.data check': data.data,
      '🔍 Is data.drivers array?': Array.isArray(data.drivers),
      '🔍 Is data.data array?': Array.isArray(data.data),
      '🔍 Is data array?': Array.isArray(data),
      '🔍 Raw data stringified': JSON.stringify(data, null, 2)
    });

    return { success: true, data: transformedData };
  } catch (error) {
    console.error('❌ FETCH DRIVERS LIST ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    return { 
      success: false, 
      error: error.message || 'Failed to fetch drivers list' 
    };
  }
};

export const fetchAllDriversForMonitoring = async (pageLimit = 200) => {
  const allDrivers = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const result = await fetchDriversList('', 'All Statuses', 'Any Rating', page, pageLimit);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch drivers for monitoring',
        drivers: allDrivers,
      };
    }

    const driversArray = Array.isArray(result.data.drivers) ? result.data.drivers : [];
    allDrivers.push(...driversArray);

    totalPages = result.data.totalPages || 1;
    page += 1;
  }

  return {
    success: true,
    drivers: allDrivers,
  };
};

// Fetch driver details by ID
export const fetchDriverDetails = async (driverId) => {
  try {
    const url = `${API_BASE_URL}/admin-driver-details?driver_id=${driverId}`;
    
    console.log('🚀 FETCH DRIVER DETAILS REQUEST:', {
      '🔗 URL': url,
      '🆔 Driver ID': driverId,
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 DRIVER DETAILS HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 RAW DRIVER DETAILS RESPONSE:', JSON.stringify(data, null, 2));
    
    // Try multiple possible response structures
    let driverData = null;
    
    // Structure 1: data.data.driver (admin driver details)
    if (data.success && data.data?.driver?.id) {
      driverData = data.data.driver;
    }
    // Structure 2: data.data.user (legacy/alternate payload with reviews)
    else if (data.success && data.data?.user?.id) {
      driverData = data.data.user;
    }
    // Structure 3: data.data (driver at top level of data)
    else if (data.success && data.data && data.data.id) {
      driverData = data.data;
    }
    // Structure 4: data.driver (driver directly in response)
    else if (data.success && data.driver && data.driver.id) {
      driverData = data.driver;
    }
    // Structure 5: data is the driver object itself
    else if (data.id && (data.full_name || data.name)) {
      driverData = data;
    }
    
    if (driverData) {
      console.log('✅ DRIVER DETAILS EXTRACTED SUCCESSFULLY:', {
        '📊 Driver Data': driverData,
        '🔍 Driver ID': driverData.id,
        '👤 Driver Name': driverData.full_name || driverData.name,
        '📱 Phone': driverData.phone || driverData.phone_number,
        '🚗 Vehicle Info': driverData.driver_profile,
        '📄 Has Driver Profile': !!driverData.driver_profile,
        '✅ Is Verified': driverData.is_verified,
        '💰 Earnings': driverData.earnings,
        '🚕 Recent Rides': driverData.recent_rides
      });
      
      return { success: true, data: driverData };
    }
    
    console.log('❌ INVALID DRIVER DETAILS RESPONSE STRUCTURE:', {
      '📊 Raw Data': data,
      '🔍 Success': data.success,
      '🔍 Has Data': !!data.data,
      '🔍 Has Driver': !!data.data?.driver,
      '🔍 Data Keys': data.data ? Object.keys(data.data) : 'No data',
      '🔍 Top Level Keys': Object.keys(data)
    });
    
    return { success: false, error: 'Invalid response structure - driver data not found' };
  } catch (error) {
    console.error('❌ FETCH DRIVER DETAILS ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to fetch driver details' 
    };
  }
};

export const parsePercentageRate = (rate) => {
  if (rate == null) return null;
  if (typeof rate === 'number' && !Number.isNaN(rate)) return rate;
  if (typeof rate === 'object' && rate.percentage != null) {
    const value = Number(rate.percentage);
    return Number.isNaN(value) ? null : value;
  }
  return null;
};

export const mapAcceptanceRate = (rate) => {
  if (rate == null) return null;

  if (typeof rate === 'object') {
    const percentage = parsePercentageRate(rate);
    if (percentage == null && rate.accepted_responses == null && rate.total_responses == null) {
      return null;
    }

    return {
      percentage,
      accepted: rate.accepted_responses ?? rate.accepted ?? null,
      declined: rate.declined_responses ?? rate.declined ?? null,
      total: rate.total_responses ?? rate.total ?? null,
    };
  }

  const percentage = parsePercentageRate(rate);
  return percentage == null ? null : { percentage, accepted: null, declined: null, total: null };
};

export const mapCancellationRate = (rate) => {
  if (rate == null) return null;

  if (typeof rate === 'object') {
    const percentage = parsePercentageRate(rate);
    if (percentage == null && rate.cancelled_rides == null && rate.total_assigned_rides == null) {
      return null;
    }

    return {
      percentage,
      cancelled: rate.cancelled_rides ?? rate.cancelled ?? null,
      completed: rate.completed_rides ?? rate.completed ?? null,
      totalAssigned: rate.total_assigned_rides ?? rate.total_assigned ?? null,
    };
  }

  const percentage = parsePercentageRate(rate);
  return percentage == null ? null : { percentage, cancelled: null, completed: null, totalAssigned: null };
};

export const formatDocumentLabel = (value = '') => (
  String(value || 'Document')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
);

export const mapDriverReview = (review = {}) => ({
  id: review.id || '',
  rideId: review.ride_id || review.rideId || '',
  rating: Number(review.rating) || 0,
  comment: review.comment || '',
  createdAt: review.created_at || review.createdAt || null,
});

export const getDriverReviewsFromPayload = (apiDriver = {}) => {
  if (Array.isArray(apiDriver.driver_reviews) && apiDriver.driver_reviews.length > 0) {
    return apiDriver.driver_reviews.map(mapDriverReview);
  }

  return (apiDriver.recent_rides || [])
    .filter((ride) => ride?.driver_review)
    .map((ride) => mapDriverReview({
      ...ride.driver_review,
      ride_id: ride.driver_review.ride_id || ride.id,
    }));
};

export const mapDriverRecentRide = (ride = {}, index = 0) => {
  const rider = ride.rider;
  const riderName = typeof rider === 'string'
    ? rider
    : rider?.full_name || rider?.name || ride.rider_name || '';

  return {
    id: ride.id || `ride-${index + 1}`,
    rider: riderName,
    pickupAddress: ride.pickup_address || ride.pickup || '',
    dropoffAddress: ride.dropoff_address || ride.dropoff || '',
    date: ride.completed_at || ride.created_at || ride.date || null,
    fare: parseFloat(ride.fare || 0),
    status: ride.status || 'pending',
    review: ride.driver_review ? mapDriverReview({
      ...ride.driver_review,
      ride_id: ride.driver_review.ride_id || ride.id,
    }) : null,
  };
};

// Approve driver by ID
export const approveDriver = async (driverId) => {
  try {
    const url = `${API_BASE_URL}/approve-driver`;
    
    console.log('🚀 APPROVE DRIVER REQUEST:', {
      '🔗 URL': url,
      '🆔 Driver ID': driverId,
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ driver_id: driverId })
    });

    console.log('📡 APPROVE DRIVER HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 APPROVE DRIVER RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ APPROVE DRIVER ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to approve driver' 
    };
  }
};

// Unsuspend driver by ID with optional reason
export const unsuspendDriver = async (driverId, reason = '') => {
  try {
    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    const url = `${API_BASE_URL}/admin-unsuspend-driver`;
    
    console.log('🚀 UNSUSPEND DRIVER REQUEST:', {
      '🔗 URL': url,
      '🆔 Driver ID': driverId,
      '📝 Reason': reason,
      '🔑 Has Anon Key': !!anonKey,
      '⏰ Timestamp': new Date().toISOString()
    });

    const headers = {
      'Content-Type': 'application/json',
      'apikey': anonKey,
    };

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        driver_id: driverId,
        reason: reason || 'Suspension lifted after review'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 UNSUSPEND DRIVER RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ UNSUSPEND DRIVER ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to unsuspend driver' 
    };
  }
};

// Suspend driver by ID with reason
export const suspendDriver = async (driverId, reason) => {
  try {
    const url = `${API_BASE_URL}/admin-update-driver-status`;
    
    console.log('🚀 SUSPEND DRIVER REQUEST:', {
      '🔗 URL': url,
      '🆔 Driver ID': driverId,
      '📝 Reason': reason,
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        driver_id: driverId,
        status: 'suspended',
        reason: reason
      })
    });

    console.log('📡 SUSPEND DRIVER HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 SUSPEND DRIVER RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ SUSPEND DRIVER ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to suspend driver' 
    };
  }
};

// Update driver details
export const updateDriver = async (driverId, updateData) => {
  try {
    const url = `${API_BASE_URL}/admin-update-driver`;
    
    console.log('🚀 UPDATE DRIVER REQUEST:', {
      '🔗 URL': url,
      '🆔 Driver ID': driverId,
      '📝 Update Data': updateData,
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        driver_id: driverId,
        ...updateData
      })
    });

    console.log('📡 UPDATE DRIVER HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 UPDATE DRIVER RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ UPDATE DRIVER ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to update driver' 
    };
  }
};

export const parseDriverBalance = (apiDriver) => {
  if (!apiDriver || typeof apiDriver !== 'object') {
    return 0;
  }

  const profile = apiDriver.driver_profile || {};
  const rawBalance =
    apiDriver.wallet_balance ??
    apiDriver.balance ??
    apiDriver.available_balance ??
    profile.wallet_balance ??
    profile.balance ??
    apiDriver.earnings?.balance ??
    apiDriver.earnings?.wallet_balance ??
    0;

  const parsed = Number(rawBalance);
  return Number.isNaN(parsed) ? 0 : parsed;
};

function toWalletNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function extractDriverWalletEntries(payload) {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const drivers =
    payload.data?.drivers ??
    payload.drivers ??
    (Array.isArray(payload.data) ? payload.data : null);

  if (Array.isArray(drivers)) {
    return drivers;
  }

  if (
    payload.driver_id != null ||
    payload.found != null ||
    payload.wallet ||
    payload.driver
  ) {
    return [payload];
  }

  if (payload.data?.wallet || payload.wallet) {
    return [{
      driver_id: payload.data?.driver_id ?? payload.driver_id,
      found: payload.data?.found ?? payload.found ?? true,
      driver: payload.data?.driver ?? payload.driver ?? null,
      wallet: payload.data?.wallet ?? payload.wallet,
      error: payload.data?.error ?? payload.error,
    }];
  }

  return [];
}

export function normalizeDriverWalletEntry(entry, requestedDriverId = null) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const driverId = String(
    entry.driver_id ??
    entry.driver?.id ??
    requestedDriverId ??
    '',
  );

  if (!entry.found) {
    return {
      driverId,
      found: false,
      error: entry.error || 'Driver wallet not found',
      wallet: null,
      balance: 0,
      totalBalance: 0,
    };
  }

  const wallet = entry.wallet ?? {};
  const commissionWallet = wallet.commission_wallet ?? {};
  const mainWallet = wallet.main_wallet ?? {};

  const commissionBalance = toWalletNumber(
    wallet.commission_balance ?? commissionWallet.balance,
  );
  const mainWalletBalance = toWalletNumber(
    wallet.main_wallet_balance ?? wallet.earnings_balance ?? mainWallet.balance,
  );
  const availableBalance = toWalletNumber(
    mainWallet.available_balance,
    mainWalletBalance,
  );
  const pendingWithdrawals = toWalletNumber(mainWallet.pending_withdrawals);
  const totalBalance = toWalletNumber(
    wallet.total_balance ?? wallet.legacy_balance,
    commissionBalance + mainWalletBalance,
  );
  const negativeBalance = toWalletNumber(wallet.negative_balance);

  return {
    driverId,
    found: true,
    error: null,
    driver: entry.driver ?? null,
    walletId: wallet.wallet_id ?? null,
    walletType: wallet.wallet_type ?? null,
    currency: wallet.currency ?? 'QAR',
    commissionBalance,
    commissionCanReceiveRides: commissionWallet.can_receive_rides ?? null,
    mainWalletBalance,
    availableBalance,
    pendingWithdrawals,
    totalBalance,
    negativeBalance,
    legacyBalance: toWalletNumber(wallet.legacy_balance, totalBalance),
    createdAt: wallet.created_at ?? null,
    updatedAt: wallet.updated_at ?? null,
    balance: totalBalance,
  };
}

export function resolveDriverWalletFromPayload(payload, driverId = null) {
  const entries = extractDriverWalletEntries(payload);
  if (entries.length === 0) {
    return null;
  }

  if (driverId) {
    const match = entries.find((entry) =>
      String(entry.driver_id ?? entry.driver?.id) === String(driverId),
    );
    if (match) {
      return normalizeDriverWalletEntry(match, driverId);
    }
  }

  return normalizeDriverWalletEntry(entries[0], driverId);
}

export const parseDriverWalletBalance = (payload, driverId = null) => {
  const wallet = resolveDriverWalletFromPayload(payload, driverId);
  if (wallet?.found) {
    return wallet.totalBalance;
  }

  if (!payload || typeof payload !== 'object') {
    return 0;
  }

  const legacyWallet =
    payload.wallet ??
    payload.data?.wallet ??
    payload;

  const rawBalance =
    legacyWallet?.total_balance ??
    legacyWallet?.main_wallet_balance ??
    legacyWallet?.balance ??
    legacyWallet?.wallet_balance ??
    legacyWallet?.available_balance ??
    payload.balance ??
    0;

  return toWalletNumber(rawBalance);
};

async function requestDriverWallet(params = {}) {
  const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      query.set(key, String(value));
    }
  });

  const url = `${API_BASE_URL}/admin-driver-wallet?${query.toString()}`;
  const response = await authenticatedFetch(url, {
    method: 'GET',
    headers: {
      apikey: anonKey,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json().catch(() => ({}));
}

export const fetchDriverWallet = async (driverId, { includeVerified = true } = {}) => {
  try {
    if (!driverId) {
      throw new Error('Driver ID is required');
    }

    const params = { driver_id: String(driverId) };
    if (includeVerified) {
      params.include_verified = '1';
    }

    const data = await requestDriverWallet(params);
    const wallet = resolveDriverWalletFromPayload(data, driverId);

    if (!wallet?.found) {
      return {
        success: false,
        error: wallet?.error || 'Driver wallet not found',
        data,
      };
    }

    return {
      success: true,
      data,
      wallet,
      balance: wallet.totalBalance,
    };
  } catch (error) {
    console.error('❌ FETCH DRIVER WALLET ERROR:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch driver wallet',
    };
  }
};

export const fetchAllDriverWallets = async ({ includeVerified = true } = {}) => {
  try {
    const params = {};
    if (includeVerified) {
      params.include_verified = '1';
    }

    const data = await requestDriverWallet(params);
    const wallets = extractDriverWalletEntries(data)
      .map((entry) => normalizeDriverWalletEntry(entry))
      .filter(Boolean);

    const walletByDriverId = wallets.reduce((acc, wallet) => {
      if (wallet.driverId) {
        acc[wallet.driverId] = wallet;
      }
      return acc;
    }, {});

    return {
      success: true,
      data,
      wallets,
      walletByDriverId,
      count: data.data?.count ?? wallets.length,
    };
  } catch (error) {
    console.error('❌ FETCH ALL DRIVER WALLETS ERROR:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch driver wallets',
    };
  }
};

export const fetchDriverWalletsForIds = async (driverIds = [], options = {}) => {
  const uniqueIds = [...new Set(driverIds.filter(Boolean).map(String))];
  if (uniqueIds.length === 0) {
    return {
      success: true,
      wallets: [],
      walletByDriverId: {},
    };
  }

  const results = await Promise.all(
    uniqueIds.map((id) => fetchDriverWallet(id, options)),
  );

  const wallets = results
    .filter((result) => result.success && result.wallet)
    .map((result) => result.wallet);

  const walletByDriverId = wallets.reduce((acc, wallet) => {
    if (wallet.driverId) {
      acc[wallet.driverId] = wallet;
    }
    return acc;
  }, {});

  return {
    success: true,
    wallets,
    walletByDriverId,
  };
};

export const updateDriverCommissionBalance = async (
  driverId,
  { balance, reason = '', operation = 'set', clearDebt = false } = {}
) => {
  try {
    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    const url = `${API_BASE_URL}/admin-update-driver-balance`;

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify({
        driver_id: driverId,
        operation,
        balance: Number(balance),
        clear_debt: Boolean(clearDebt),
        reason: reason.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const walletResult = await fetchDriverWallet(driverId);
    const updatedBalance = walletResult.success
      ? walletResult.wallet?.commissionBalance
      : parseDriverBalance(data?.data?.driver ?? data?.data ?? data);

    return {
      success: true,
      data,
      balance: updatedBalance ?? Number(balance),
      wallet: walletResult.wallet ?? null,
    };
  } catch (error) {
    console.error('❌ UPDATE DRIVER COMMISSION BALANCE ERROR:', error);
    return {
      success: false,
      error: error.message || 'Failed to update commission balance',
    };
  }
};

export const updateDriverBalance = updateDriverCommissionBalance;

export const updateDriverMainWallet = async (
  driverId,
  { operation = 'credit', amount, reason = '' } = {}
) => {
  try {
    if (!driverId) {
      throw new Error('Driver ID is required');
    }

    const normalizedOperation = String(operation || 'credit').toLowerCase();
    if (!['credit', 'debit'].includes(normalizedOperation)) {
      throw new Error('Operation must be credit or debit');
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    const url = `${API_BASE_URL}/admin-update-driver-main-wallet`;

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
      },
      body: JSON.stringify({
        driver_id: driverId,
        operation: normalizedOperation,
        amount: parsedAmount,
        reason: reason.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const walletResult = await fetchDriverWallet(driverId);

    return {
      success: true,
      data,
      wallet: walletResult.wallet ?? null,
      balance: walletResult.wallet?.mainWalletBalance ?? null,
    };
  } catch (error) {
    console.error('❌ UPDATE DRIVER MAIN WALLET ERROR:', error);
    return {
      success: false,
      error: error.message || 'Failed to update main wallet balance',
    };
  }
};

// Delete driver by ID with optional reason
export const deleteDriver = async (driverId, reason = '') => {
  try {
    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    const url = `${API_BASE_URL}/admin-delete-driver`;

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
      },
      body: JSON.stringify({
        driver_id: driverId,
        reason: reason || '',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json().catch(() => ({}));

    if (data.success === false) {
      throw new Error(data.error || data.message || 'Failed to delete driver');
    }

    return { success: true, data };
  } catch (error) {
    console.error('❌ DELETE DRIVER ERROR:', error);

    return {
      success: false,
      error: error.message || 'Failed to delete driver',
    };
  }
};

// Export drivers to PDF
export const exportDriversToPDF = async (status = '', minRating = '', startDate = '', endDate = '') => {
  try {
    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;

    const params = [];
    params.push('type=drivers');
    params.push('format=pdf');

    const normalizedStatus = status?.toLowerCase?.() || '';
    if (normalizedStatus === 'online') {
      params.push('is_online=true');
    } else if (normalizedStatus === 'offline') {
      params.push('is_online=false');
    } else if (status && status !== 'All Statuses' && normalizedStatus !== 'all') {
      const apiStatus = mapStatusFilterToApiValue(status);
      if (apiStatus) {
        params.push(`status=${encodeURIComponent(apiStatus)}`);
      }
    }

    if (minRating && minRating !== 'Any Rating') {
      const ratingValue = minRating.replace('+', '');
      params.push(`min_rating=${encodeURIComponent(ratingValue)}`);
    }

    if (startDate) {
      params.push(`start_date=${encodeURIComponent(startDate)}`);
    }

    if (endDate) {
      params.push(`end_date=${encodeURIComponent(endDate)}`);
    }

    const queryString = params.join('&');
    const url = `${API_BASE_URL}/admin-drivers-list?${queryString}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const disposition = response.headers.get('content-disposition') || '';
    const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
    const filename = filenameMatch?.[1] || `drivers_export_${timestamp}.pdf`;

    if (
      contentType.includes('application/pdf') ||
      contentType.includes('octet-stream') ||
      filename.toLowerCase().endsWith('.pdf')
    ) {
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      return { success: true, filename, size: blob.size };
    }

    const data = await response.json();
    return {
      success: false,
      error: data.error || 'Unexpected export response. PDF format may not be supported yet.',
    };
  } catch (error) {
    console.error('❌ EXPORT PDF ERROR:', error);

    return {
      success: false,
      error: error.message || 'Failed to export drivers to PDF',
    };
  }
};

const DRIVER_PREVIEW_ARRAY_KEYS = [
  'recipients_preview',
  'preview',
  'preview_drivers',
  'drivers_preview',
  'driver_previews',
  'drivers',
  'recipients',
  'preview_recipients',
  'drivers_without_docs',
  'missing_vehicle_docs',
  'missing_vehicle_doc_drivers',
  'items',
  'rows',
  'results',
];

const extractDriversArray = (data) => {
  const payload = data?.data ?? data;

  if (Array.isArray(payload?.recipients_preview)) {
    return payload.recipients_preview;
  }

  return findDriverPreviewArray(data);
};

const isDriverLikeObject = (value) => (
  value
  && typeof value === 'object'
  && !Array.isArray(value)
  && (
    value.driver_id
    || value.id
    || value.full_name
    || value.name
    || value.email
    || value.driver
    || value.missing_documents
    || value.missing_docs
    || value.missing_vehicle_docs
    || value.missing_vehicle_document_types
  )
);

const objectValuesIfDriverLike = (value) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const values = Object.values(value);
  return values.length > 0 && values.every(isDriverLikeObject) ? values : [];
};

const findDriverPreviewArray = (value, depth = 0) => {
  if (value == null || depth > 3) return [];

  if (Array.isArray(value)) {
    return value.length > 0 && value.every((item) => typeof item === 'object') ? value : [];
  }

  if (typeof value !== 'object') return [];

  for (const key of DRIVER_PREVIEW_ARRAY_KEYS) {
    const candidate = value[key];
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
    const objectValues = objectValuesIfDriverLike(candidate);
    if (objectValues.length > 0) {
      return objectValues;
    }
  }

  const directObjectValues = objectValuesIfDriverLike(value);
  if (directObjectValues.length > 0) {
    return directObjectValues;
  }

  if (value.data) {
    const nested = findDriverPreviewArray(value.data, depth + 1);
    if (nested.length > 0) return nested;
  }

  if (value.preview && typeof value.preview === 'object') {
    const nested = findDriverPreviewArray(value.preview, depth + 1);
    if (nested.length > 0) return nested;
  }

  return [];
};

const extractEligibleCount = (data, driversLength = 0) => {
  const payload = data?.data ?? data;

  const count = payload?.eligible_count
    ?? payload?.recipient_count
    ?? payload?.total_count
    ?? payload?.total
    ?? payload?.count
    ?? payload?.missing_vehicle_docs_count
    ?? data?.eligible_count
    ?? data?.recipient_count
    ?? data?.total_count;

  return typeof count === 'number' ? count : driversLength;
};

export const getDriverInitials = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

export const isDriverOnline = (apiDriver) => {
  if (!apiDriver) {
    return false;
  }

  const driverProfile = apiDriver.driver_profile || {};

  if (
    apiDriver.is_suspended === true ||
    driverProfile.is_suspended === true ||
    String(apiDriver.status || '').toLowerCase() === 'suspended' ||
    String(driverProfile.status || '').toLowerCase() === 'suspended'
  ) {
    return false;
  }

  if (driverProfile.is_online === true || apiDriver.is_online === true) {
    return true;
  }

  const rawStatus = String(
    apiDriver.status || apiDriver.driver_status || driverProfile.status || ''
  ).toLowerCase();

  if (rawStatus === 'online') {
    return true;
  }

  return false;
};

export const resolveDriverProfileStatus = (apiDriver) => {
  const driverProfile = apiDriver?.driver_profile || {};

  if (apiDriver.status?.toLowerCase() === 'suspended' ||
      apiDriver.driver_profile?.status?.toLowerCase() === 'suspended' ||
      apiDriver.is_suspended === true ||
      apiDriver.driver_profile?.is_suspended === true) {
    return 'Suspended';
  }

  if (
    apiDriver.is_verified === false ||
    driverProfile.is_approved === false ||
    (driverProfile.background_check_status &&
      driverProfile.background_check_status !== 'approved')
  ) {
    return 'Pending Verification';
  }

  if (apiDriver.is_active === false) {
    return 'Offline';
  }

  if (driverProfile.is_online === true || apiDriver.is_online === true) {
    return 'Online';
  }

  if (apiDriver.is_verified && driverProfile.is_approved !== false) {
    return 'Offline';
  }

  return 'Offline';
};

export const normalizeDriverStatus = (apiDriver) => {
  const profileStatus = resolveDriverProfileStatus(apiDriver);

  if (profileStatus === 'Pending Verification') {
    return 'Pending';
  }

  return profileStatus;
};

export const matchesDriverFilters = (driver, { searchTerm = '', statusFilter = 'All Statuses', ratingFilter = 'Any Rating', applyStatusFilter = true } = {}) => {
  const search = searchTerm.trim().toLowerCase();
  const matchesSearch = !search ||
    driver.name.toLowerCase().includes(search) ||
    (driver.phone && driver.phone.toLowerCase().includes(search));

  const matchesStatus = !applyStatusFilter || driverMatchesStatusFilter(driver, statusFilter);

  const matchesRating = ratingFilter === 'Any Rating' ||
    (ratingFilter === '4.5+' && driver.rating >= 4.5) ||
    (ratingFilter === '4.0+' && driver.rating >= 4.0) ||
    (ratingFilter === '3.5+' && driver.rating >= 3.5);

  return matchesSearch && matchesStatus && matchesRating;
};

export const transformDriverWithoutDocsData = (apiDriver) => {
  const nestedDriver = apiDriver?.driver || apiDriver?.driver_profile || apiDriver?.profile || null;
  const source = nestedDriver ? { ...nestedDriver, ...apiDriver } : apiDriver;

  const missingDocs = source.missing_documents
    || source.missing_docs
    || source.missing_vehicle_docs
    || source.documents_missing
    || source.incomplete_documents
    || source.missing_vehicle_document_types
    || source.missing_document_types
    || [];

  const normalizedMissingDocs = Array.isArray(missingDocs)
    ? missingDocs.map((doc) => {
        if (typeof doc === 'string') {
          return doc
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (char) => char.toUpperCase());
        }
        return doc?.name || doc?.document_name || doc?.document_type || doc?.type || 'Document';
      })
    : [];

  return {
    id: source.driver_id || source.id || source.user_id || '',
    name: source.full_name || source.name || source.driver_name || 'Unknown Driver',
    email: source.email || source.email_address || '',
    phone: source.phone_number || source.phone || source.contact_number || '',
    avatar: source.avatar_url || source.profile_picture || source.avatar || source.profile_image || '',
    missingDocs: normalizedMissingDocs,
    registeredAt: source.created_at || source.registered_at || null,
  };
};

export const fetchDriversWithoutDocs = async (previewLimit = 50) => {
  try {
    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    const params = new URLSearchParams({
      preview_limit: String(previewLimit),
    });
    const url = `${API_BASE_URL}/admin-bulk-email-missing-vehicle-docs?${params.toString()}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const payload = data?.data ?? data;
    const driversArray = extractDriversArray(data);
    const drivers = driversArray.map(transformDriverWithoutDocsData);
    const totalCount = extractEligibleCount(data, drivers.length);

    return {
      success: true,
      data: {
        drivers,
        totalCount,
        previewLimit,
        summaryMessage: payload?.message || null,
        requiredDocuments: payload?.required_vehicle_documents || [],
      },
    };
  } catch (error) {
    console.error('❌ FETCH DRIVERS WITHOUT DOCS ERROR:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch drivers without documents',
    };
  }
};

export const sendDocumentReminderEmails = async ({ subject = '', bodyText = '' } = {}) => {
  try {
    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    const url = `${API_BASE_URL}/admin-bulk-email-missing-vehicle-docs`;

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey,
      },
      body: JSON.stringify({
        confirmed: true,
        subject: subject.trim(),
        body_text: bodyText.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const payload = data?.data ?? data;

    return {
      success: true,
      data: {
        sentCount: payload?.sent_count
          ?? payload?.emails_sent
          ?? payload?.recipient_count
          ?? payload?.sent
          ?? 0,
        failedCount: payload?.failed_count ?? payload?.failed ?? 0,
        message: payload?.message || data?.message || 'Reminder emails sent successfully',
      },
    };
  } catch (error) {
    console.error('❌ SEND DOCUMENT REMINDER EMAILS ERROR:', error);
    return {
      success: false,
      error: error.message || 'Failed to send document reminder emails',
    };
  }
};

// Helper function to transform driver data from API to UI format
export const transformDriverData = (apiDriver) => {
  return {
    id: apiDriver.id || apiDriver.driver_id || '',
    name: apiDriver.full_name || apiDriver.name || apiDriver.driver_name || 'Unknown Driver',
    phone: apiDriver.phone_number || apiDriver.phone || apiDriver.contact_number || '',
    avatar: apiDriver.avatar_url || apiDriver.profile_picture || apiDriver.avatar || apiDriver.profile_image || '',
    vehicle: {
      model: apiDriver.vehicle_model || apiDriver.vehicle?.model || apiDriver.car_model || 'Unknown Vehicle',
      year: apiDriver.vehicle_year || apiDriver.vehicle?.year || apiDriver.car_year || new Date().getFullYear()
    },
    status: normalizeDriverStatus(apiDriver),
    isOnline: isDriverOnline(apiDriver),
    rating: parseFloat(apiDriver.rating || apiDriver.average_rating || 0),
    totalRides: parseInt(apiDriver.total_rides || apiDriver.rides_count || 0),
    earnings: parseFloat(apiDriver.total_earnings || apiDriver.earnings || 0),
    joinedDate: apiDriver.created_at || apiDriver.registered_at || null
  };
};
