import { getAuthToken, SUPABASE_ANON_KEY } from './authService';

const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

const getAnonApiKey = () => localStorage.getItem('anonKey') || SUPABASE_ANON_KEY;

// Mapping from UI field names to API config keys (must match edge function / migration)
const FARE_CONFIG_KEY_MAP = {
  baseFare: 'base_fare',
  costPerKilometer: 'cost_per_km',
  costPerMinute: 'cost_per_minute',
  airportSurcharge: 'airport_surcharge',
  minimumFare: 'minimum_fare',
  surgeMultiplier: 'surge_multiplier',
  nightSurcharge: 'night_surcharge',
  peakHourSurcharge: 'peak_hour_surcharge',
};

/** Fallback descriptions sent on POST when creating/updating a row */
const FARE_CONFIG_DESCRIPTIONS = {
  base_fare: 'Base fare applied when a trip starts',
  minimum_fare: 'Minimum total fare charged for a trip',
  cost_per_km: 'Charged per kilometer traveled',
  cost_per_minute: 'Charged per minute of trip time',
  airport_surcharge: 'Flat surcharge for airport-related trips',
  night_surcharge: 'Additional surcharge during night hours',
  peak_hour_surcharge: 'Additional surcharge during peak traffic hours',
  surge_multiplier: 'Demand-based multiplier applied to fare components',
};

const EMPTY_FARE_COSTS = {
  baseFare: 0,
  minimumFare: 0,
  costPerKilometer: 0,
  costPerMinute: 0,
  airportSurcharge: 0,
  nightSurcharge: 0,
  peakHourSurcharge: 0,
  surgeMultiplier: 1,
};

const CONFIG_KEY_TO_UI_FIELD = Object.fromEntries(
  Object.entries(FARE_CONFIG_KEY_MAP).map(([uiField, apiKey]) => [apiKey, uiField])
);

const ARRAY_WRAPPER_KEYS = [
  'configs',
  'config',
  'data',
  'fare_configs',
  'fare_config',
  'items',
  'results',
  'records',
  'rows',
  'settings',
  'list',
];

function firstArrayOfObjects(payload) {
  if (payload == null || typeof payload !== 'object') return null;
  for (const k of ARRAY_WRAPPER_KEYS) {
    const v = payload[k];
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') return v;
  }
  const d = payload.data;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    for (const k of ARRAY_WRAPPER_KEYS) {
      const v = d[k];
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'object') return v;
    }
  }
  return null;
}

function extractFareConfigRows(payload) {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload;
  const nested = firstArrayOfObjects(payload);
  if (nested) return nested;
  if (Array.isArray(payload.configs)) return payload.configs;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.fare_configs)) return payload.fare_configs;
  if (Array.isArray(payload.items)) return payload.items;
  if (payload.config_key != null || payload.configKey != null) return [payload];
  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    const d = payload.data;
    if (d.config_key != null || d.configKey != null) return [d];
  }
  return [];
}

/** API may return a flat map of snake_case keys → numbers (no rows array). */
function mapFlatFareKeysObject(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;
  const values = { ...EMPTY_FARE_COSTS };
  const descriptions = {};
  let matched = 0;

  for (const apiKey of Object.keys(CONFIG_KEY_TO_UI_FIELD)) {
    if (!Object.prototype.hasOwnProperty.call(obj, apiKey)) continue;
    const field = CONFIG_KEY_TO_UI_FIELD[apiKey];
    const cell = obj[apiKey];
    const raw =
      cell !== null && typeof cell === 'object' && !Array.isArray(cell)
        ? cell.value ?? cell.config_value ?? cell.val
        : cell;
    const num = raw === '' || raw == null ? NaN : parseFloat(raw);
    if (Number.isFinite(num)) {
      values[field] = num;
      matched += 1;
    }
    const desc =
      cell !== null && typeof cell === 'object' && !Array.isArray(cell)
        ? cell.description ?? cell.config_description
        : undefined;
    if (desc != null && String(desc).trim() !== '') {
      descriptions[field] = String(desc).trim();
    }
  }

  if (matched === 0) return null;
  return { values, descriptions };
}

function mapFareRowsToState(rows) {
  const values = { ...EMPTY_FARE_COSTS };
  const descriptions = {};
  let matchedKeys = 0;

  for (const row of rows) {
    const apiKey =
      row.config_key ?? row.configKey ?? row.key ?? row.name ?? row.id;
    const field = apiKey != null ? CONFIG_KEY_TO_UI_FIELD[String(apiKey)] : undefined;
    if (!field) continue;

    const raw =
      row.config_value ??
      row.configValue ??
      row.value ??
      (typeof row.config_value === 'object' && row.config_value !== null
        ? row.config_value.value
        : undefined);
    const num = raw === '' || raw == null ? NaN : parseFloat(raw);
    if (Number.isFinite(num)) {
      values[field] = num;
      matchedKeys += 1;
    }

    const desc = row.description ?? row.config_description;
    if (desc != null && String(desc).trim() !== '') {
      descriptions[field] = String(desc).trim();
    }
  }

  return { values, descriptions, matchedKeys };
}

function mapFareApiResponseToState(json) {
  const rows = extractFareConfigRows(json);
  if (rows.length > 0) {
    const fromRows = mapFareRowsToState(rows);
    if (fromRows.matchedKeys > 0) {
      const { matchedKeys, ...rest } = fromRows;
      void matchedKeys;
      return { ...rest, fareSource: 'rows' };
    }
  }

  const flat = mapFlatFareKeysObject(json) || mapFlatFareKeysObject(json?.data);
  if (flat) return { ...flat, fareSource: 'flat' };

  return {
    values: { ...EMPTY_FARE_COSTS },
    descriptions: {},
    fareSource: 'empty',
  };
}

// Mock data for admin roles
const mockRoles = [
  {
    id: 'role_001',
    name: 'Super Admin',
    permissions: 'All access',
    users: 2,
    canDelete: false
  },
  {
    id: 'role_002',
    name: 'Manager',
    permissions: 'View/Edit Rides, Drivers, Users',
    users: 5,
    canDelete: true
  },
  {
    id: 'role_003',
    name: 'Support Agent',
    permissions: 'Support tickets, Live chat',
    users: 12,
    canDelete: true
  }
];

// Mock data for notification templates
const mockNotificationTemplates = [
  {
    id: 'template_001',
    title: 'Welcome Email',
    description: 'Sent to new users upon registration.',
    type: 'email',
    category: 'user_onboarding'
  },
  {
    id: 'template_002',
    title: 'Password Reset',
    description: 'Sent when a user requests a password reset.',
    type: 'email',
    category: 'authentication'
  },
  {
    id: 'template_003',
    title: 'Ride Completed SMS',
    description: 'Confirmation SMS after a ride ends.',
    type: 'sms',
    category: 'ride_completion'
  },
  {
    id: 'template_004',
    title: 'Driver Payout',
    description: 'Notification for successful payouts.',
    type: 'email',
    category: 'financial'
  }
];

// Mock API keys
const mockApiKeys = {
  googleMaps: 'AIzaSyBvOkBwXyZ1234567890abcdefghijklmnop',
  qpay: 'qpay_sk_live_1234567890abcdefghijklmnopqrstuvwxyz'
};

// Mock system settings
const mockSystemSettings = {
  language: 'english', // 'english' or 'arabic'
  theme: 'light', // display only when merging; real theme comes from localStorage on load
  apiKeys: mockApiKeys,
};

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch all admin roles
export const fetchRoles = async () => {
  await delay(500);
  return {
    success: true,
    data: mockRoles
  };
};

// Add a new role
export const addRole = async (roleData) => {
  await delay(800);
  
  const newRole = {
    id: `role_${Date.now()}`,
    name: roleData.name,
    permissions: roleData.permissions,
    users: 0,
    canDelete: true
  };
  
  mockRoles.push(newRole);
  
  return {
    success: true,
    data: newRole
  };
};

// Update an existing role
export const updateRole = async (roleId, roleData) => {
  await delay(600);
  
  const roleIndex = mockRoles.findIndex(role => role.id === roleId);
  if (roleIndex !== -1) {
    mockRoles[roleIndex] = {
      ...mockRoles[roleIndex],
      ...roleData
    };
    
    return {
      success: true,
      data: mockRoles[roleIndex]
    };
  }
  
  return {
    success: false,
    error: 'Role not found'
  };
};

// Delete a role
export const deleteRole = async (roleId) => {
  await delay(400);
  
  const roleIndex = mockRoles.findIndex(role => role.id === roleId);
  if (roleIndex !== -1) {
    mockRoles.splice(roleIndex, 1);
    return {
      success: true,
      message: 'Role deleted successfully'
    };
  }
  
  return {
    success: false,
    error: 'Role not found'
  };
};

// Fetch notification templates
export const fetchNotificationTemplates = async () => {
  await delay(300);
  return {
    success: true,
    data: mockNotificationTemplates
  };
};

// Update notification template
export const updateNotificationTemplate = async (templateId, templateData) => {
  await delay(500);
  
  const templateIndex = mockNotificationTemplates.findIndex(template => template.id === templateId);
  if (templateIndex !== -1) {
    mockNotificationTemplates[templateIndex] = {
      ...mockNotificationTemplates[templateIndex],
      ...templateData
    };
    
    return {
      success: true,
      data: mockNotificationTemplates[templateIndex]
    };
  }
  
  return {
    success: false,
    error: 'Template not found'
  };
};

// Fetch system settings
export const fetchSystemSettings = async () => {
  await delay(300);
  
  // Get language from localStorage if available
  const savedLanguage = localStorage.getItem('appLanguage');
  if (savedLanguage) {
    mockSystemSettings.language = savedLanguage;
  }
  
  return {
    success: true,
    data: mockSystemSettings
  };
};

// Update system settings
export const updateSystemSettings = async (settingsData) => {
  await delay(500);
  
  // Update the mock settings
  Object.assign(mockSystemSettings, settingsData);
  
  return {
    success: true,
    data: mockSystemSettings
  };
};

// Copy API key to clipboard
export const copyApiKey = async (keyType) => {
  await delay(200);
  
  const keyValue = keyType === 'googleMaps' ? mockApiKeys.googleMaps : mockApiKeys.qpay;
  
  try {
    await navigator.clipboard.writeText(keyValue);
    return {
      success: true,
      message: `${keyType} API key copied to clipboard`
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to copy to clipboard'
    };
  }
};

// Toggle language setting
export const toggleLanguage = async (language) => {
  await delay(300);
  
  mockSystemSettings.language = language;
  
  // Sync with localStorage
  localStorage.setItem('appLanguage', language);
  
  return {
    success: true,
    data: mockSystemSettings
  };
};

// Toggle theme setting
export const toggleTheme = async (theme) => {
  await delay(300);
  
  mockSystemSettings.theme = theme;
  
  return {
    success: true,
    data: mockSystemSettings
  };
};

// Search settings
export const searchSettings = async (searchTerm) => {
  await delay(400);
  
  const searchLower = searchTerm.toLowerCase();
  
  const filteredRoles = mockRoles.filter(role =>
    role.name.toLowerCase().includes(searchLower) ||
    role.permissions.toLowerCase().includes(searchLower)
  );
  
  const filteredTemplates = mockNotificationTemplates.filter(template =>
    template.title.toLowerCase().includes(searchLower) ||
    template.description.toLowerCase().includes(searchLower)
  );
  
  return {
    success: true,
    data: {
      roles: filteredRoles,
      templates: filteredTemplates
    }
  };
};

// Points / loyalty program config (GET/PUT /admin-points-config)
const EMPTY_POINTS_CONFIG = {
  pointsPerCompletedRide: 0,
  pointsForFreeRide: 0,
};

function parsePointsValue(raw) {
  const num = raw === '' || raw == null ? NaN : parseInt(raw, 10);
  return Number.isFinite(num) ? num : null;
}

function mapPointsApiResponseToState(json) {
  const payload = json?.data ?? json;
  const program = payload?.rider_program ?? {};

  const pointsPerCompletedRide =
    parsePointsValue(payload?.points_per_completed_ride) ??
    parsePointsValue(program.points_per_completed_ride);
  const pointsForFreeRide =
    parsePointsValue(payload?.points_for_free_ride) ??
    parsePointsValue(program.points_for_free_ride);

  const values = {
    pointsPerCompletedRide: pointsPerCompletedRide ?? EMPTY_POINTS_CONFIG.pointsPerCompletedRide,
    pointsForFreeRide: pointsForFreeRide ?? EMPTY_POINTS_CONFIG.pointsForFreeRide,
  };

  const descriptions = {};
  if (program.points_per_ride_text) {
    descriptions.pointsPerCompletedRide = String(program.points_per_ride_text);
  }
  if (program.free_ride_text) {
    descriptions.pointsForFreeRide = String(program.free_ride_text);
  }

  const hasData = pointsPerCompletedRide != null || pointsForFreeRide != null;

  return {
    values,
    descriptions,
    pointsSource: hasData ? 'data' : 'empty',
  };
}

export const fetchPointsConfig = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No authentication token found. Please login first.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin-points-config`, {
      method: 'GET',
      headers: {
        apikey: getAnonApiKey(),
        Authorization: `Bearer ${token}`,
      },
    });

    const bodyText = await response.text();
    let json;
    try {
      json = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return {
        success: false,
        error: 'Invalid response from points config service',
      };
    }

    if (!response.ok) {
      const msg = json.error || json.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: msg };
    }

    const { values, descriptions, pointsSource } = mapPointsApiResponseToState(json);
    return {
      success: true,
      data: values,
      descriptions,
      pointsSource,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to load points config',
    };
  }
};

export const updatePointsConfig = async (pointsData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No authentication token found. Please login first.' };
    }

    const pointsPerCompletedRide = parsePointsValue(pointsData.pointsPerCompletedRide) ?? 0;
    const pointsForFreeRide = parsePointsValue(pointsData.pointsForFreeRide) ?? 0;

    const response = await fetch(`${API_BASE_URL}/admin-points-config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: getAnonApiKey(),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        points_per_completed_ride: pointsPerCompletedRide,
        points_for_free_ride: pointsForFreeRide,
      }),
    });

    const bodyText = await response.text();
    let json;
    try {
      json = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      json = {};
    }

    if (!response.ok) {
      const msg = json.error || json.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: msg };
    }

    const refreshed = mapPointsApiResponseToState(json);
    const hasRefreshedData = refreshed.pointsSource !== 'empty';

    if (hasRefreshedData) {
      return {
        success: true,
        data: refreshed.values,
        descriptions: refreshed.descriptions,
        message: 'Points config updated successfully',
      };
    }

    const refetch = await fetchPointsConfig();
    if (refetch.success && refetch.pointsSource !== 'empty') {
      return {
        success: true,
        data: refetch.data,
        descriptions: refetch.descriptions || {},
        message: 'Points config updated successfully',
      };
    }

    return {
      success: true,
      data: {
        pointsPerCompletedRide,
        pointsForFreeRide,
      },
      descriptions: {},
      message: 'Points config updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to update points config',
    };
  }
};

// Fetch fare cost settings (GET /admin-fare-config)
export const fetchFareCosts = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No authentication token found. Please login first.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin-fare-config`, {
      method: 'GET',
      headers: {
        apikey: getAnonApiKey(),
        Authorization: `Bearer ${token}`,
      },
    });

    const bodyText = await response.text();
    let json;
    try {
      json = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return {
        success: false,
        error: 'Invalid response from fare config service',
      };
    }

    if (!response.ok) {
      const msg = json.error || json.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: msg };
    }

    const { values, descriptions, fareSource } = mapFareApiResponseToState(json);
    return {
      success: true,
      data: values,
      descriptions,
      fareSource,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to load fare costs',
    };
  }
};

// Update fare cost settings (POST /admin-fare-config per key)
export const updateFareCosts = async (fareCostData) => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No authentication token found. Please login first.' };
    }

    const apiKey = getAnonApiKey();
    const updatePromises = Object.entries(FARE_CONFIG_KEY_MAP).map(
      async ([fieldName, configKey]) => {
        const raw = fareCostData[fieldName];
        const configValue =
          raw === '' || raw == null ? 0 : parseFloat(raw);
        const num = Number.isFinite(configValue) ? configValue : 0;

        const response = await fetch(`${API_BASE_URL}/admin-fare-config`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: apiKey,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            config_key: configKey,
            config_value: num,
            description: FARE_CONFIG_DESCRIPTIONS[configKey] || '',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const msg = errorData.error || errorData.message || `${response.status} ${response.statusText}`;
          return { configKey, success: false, error: msg };
        }

        return { configKey, success: true };
      }
    );

    const results = await Promise.all(updatePromises);
    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      const errorMessages = failed.map((r) => `${r.configKey}: ${r.error}`).join(', ');
      return {
        success: false,
        error: `Failed to update some fare costs: ${errorMessages}`,
      };
    }

    const refreshed = await fetchFareCosts();
    if (refreshed.success) {
      const dataToUse =
        refreshed.fareSource === 'empty'
          ? fareCostData
          : refreshed.data;
      return {
        success: true,
        data: dataToUse,
        descriptions: refreshed.descriptions || {},
        message: 'Fare costs updated successfully',
        ...(refreshed.fareSource === 'empty' && {
          error:
            'Values were saved, but the list response was empty or in an unexpected format. Showing what you entered until reload.',
        }),
      };
    }

    return {
      success: true,
      data: fareCostData,
      descriptions: {},
      message: 'Fare costs updated successfully',
      error: refreshed.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to update fare costs',
    };
  }
};

function parseGovernmentImpositionApproved(json) {
  const raw =
    json?.government_imposition_ad_approved ??
    json?.data?.government_imposition_ad_approved ??
    json?.approved ??
    json?.data?.approved;
  return raw === true;
}

// Government imposition ad (GET/PUT /admin-government-imposition-ad)
export const fetchGovernmentImpositionAd = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No authentication token found. Please login first.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin-government-imposition-ad`, {
      method: 'GET',
      headers: {
        apikey: getAnonApiKey(),
        Authorization: `Bearer ${token}`,
      },
    });

    const bodyText = await response.text();
    let json;
    try {
      json = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      return {
        success: false,
        error: 'Invalid response from government imposition service',
      };
    }

    if (!response.ok) {
      const msg = json.error || json.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: msg };
    }

    return {
      success: true,
      approved: parseGovernmentImpositionApproved(json),
      message: json.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to load government imposition setting',
    };
  }
};

export const updateGovernmentImpositionAd = async (approved) => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No authentication token found. Please login first.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin-government-imposition-ad`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        apikey: getAnonApiKey(),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ approved: approved === true }),
    });

    const bodyText = await response.text();
    let json;
    try {
      json = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
      json = {};
    }

    if (!response.ok) {
      const msg = json.error || json.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: msg };
    }

    return {
      success: true,
      approved: parseGovernmentImpositionApproved(json),
      message: json.message || (approved ? 'Government imposition modal enabled' : 'Government imposition modal disabled'),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to update government imposition setting',
    };
  }
};
