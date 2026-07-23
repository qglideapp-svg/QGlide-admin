import { getAuthToken, SUPABASE_ANON_KEY } from './authService';

const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

const ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=com.alphatecks.qglide';
const IOS_STORE_URL = 'https://apps.apple.com/app/qglide/id6762509081';

export const DEFAULT_APP_VERSION_CONFIG = {
  minAndroidVersion: '',
  minIosVersion: '',
  latestAndroidVersion: '',
  latestIosVersion: '',
  forceUpdate: false,
  updateTitle: 'Update required',
  updateMessage: 'A new version of QGlide is available. Please update to continue.',
  androidStoreUrl: ANDROID_STORE_URL,
  iosStoreUrl: IOS_STORE_URL,
};

const getAnonApiKey = () => localStorage.getItem('anonKey') || SUPABASE_ANON_KEY;

function mapAppVersionConfigFromApi(json) {
  const payload = json?.data ?? json?.config ?? json;

  return {
    minAndroidVersion: String(payload?.min_android_version ?? payload?.minAndroidVersion ?? '').trim(),
    minIosVersion: String(payload?.min_ios_version ?? payload?.minIosVersion ?? '').trim(),
    latestAndroidVersion: String(payload?.latest_android_version ?? payload?.latestAndroidVersion ?? '').trim(),
    latestIosVersion: String(payload?.latest_ios_version ?? payload?.latestIosVersion ?? '').trim(),
    forceUpdate: payload?.force_update === true || payload?.forceUpdate === true,
    updateTitle: String(payload?.update_title ?? payload?.updateTitle ?? DEFAULT_APP_VERSION_CONFIG.updateTitle).trim(),
    updateMessage: String(payload?.update_message ?? payload?.updateMessage ?? DEFAULT_APP_VERSION_CONFIG.updateMessage).trim(),
    androidStoreUrl: String(payload?.android_store_url ?? payload?.androidStoreUrl ?? ANDROID_STORE_URL).trim(),
    iosStoreUrl: String(payload?.ios_store_url ?? payload?.iosStoreUrl ?? IOS_STORE_URL).trim(),
  };
}

function mapAppVersionConfigToApi(config) {
  return {
    min_android_version: config.minAndroidVersion || undefined,
    min_ios_version: config.minIosVersion || undefined,
    latest_android_version: config.latestAndroidVersion || undefined,
    latest_ios_version: config.latestIosVersion || undefined,
    force_update: config.forceUpdate === true,
    update_title: config.updateTitle || DEFAULT_APP_VERSION_CONFIG.updateTitle,
    update_message: config.updateMessage || DEFAULT_APP_VERSION_CONFIG.updateMessage,
    android_store_url: config.androidStoreUrl || ANDROID_STORE_URL,
    ios_store_url: config.iosStoreUrl || IOS_STORE_URL,
  };
}

async function parseJsonResponse(response) {
  const bodyText = await response.text();
  try {
    return bodyText ? JSON.parse(bodyText) : {};
  } catch {
    return null;
  }
}

export const fetchAppVersionConfig = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No authentication token found. Please login first.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin-app-version-config`, {
      method: 'GET',
      headers: {
        apikey: getAnonApiKey(),
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await parseJsonResponse(response);
    if (json == null) {
      return { success: false, error: 'Invalid response from app version config service' };
    }

    if (!response.ok) {
      const msg = json.error || json.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: msg };
    }

    return {
      success: true,
      data: mapAppVersionConfigFromApi(json),
      message: json.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to load app version config',
    };
  }
};

export const updateAppVersionConfig = async (config) => {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No authentication token found. Please login first.' };
    }

    const response = await fetch(`${API_BASE_URL}/admin-app-version-config`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: getAnonApiKey(),
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(mapAppVersionConfigToApi(config)),
    });

    const json = await parseJsonResponse(response);
    if (json == null && !response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    if (!response.ok) {
      const msg = (json && (json.error || json.message)) || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: msg };
    }

    const data = json ? mapAppVersionConfigFromApi(json) : config;

    return {
      success: true,
      data,
      message: (json && json.message) || 'App version config updated successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to update app version config',
    };
  }
};
