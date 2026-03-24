/**
 * Ad placement config for rider and driver consumer apps.
 * Drafts and publish state are cached locally; writes go to Supabase edge function `ad-placement`.
 * Driver slots use `driver_*` placement_key values (configure the same keys on the backend).
 */
import { getAuthToken } from './authService';

const STORAGE_KEY = 'qglide_admin_mobile_ad_placements';
const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';
const SUPABASE_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2YXpvb3dtbWl5bWJiaHhvZ2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTQzMjQsImV4cCI6MjA3NTI3MDMyNH0.9vdJHTTnW38CctYwD9GZOvoX_SEu58FLu81mbjQFBdk';

function getAnonKey() {
  return localStorage.getItem('anonKey') || SUPABASE_API_KEY;
}

export const PLACEMENT_SLOTS = [
  {
    id: 'home_hero',
    label: 'Home hero',
    description: 'Full-width spotlight on the home screen',
    icon: 'view_carousel',
    preview: 'hero',
  },
  {
    id: 'booking_ribbon',
    label: 'Booking ribbon',
    description: 'Slim strip above the ride request action',
    icon: 'horizontal_rule',
    preview: 'strip',
  },
  {
    id: 'trip_complete',
    label: 'Trip complete',
    description: 'Card shown right after a trip ends',
    icon: 'emoji_events',
    preview: 'complete',
  },
  {
    id: 'profile_spotlight',
    label: 'Profile spotlight',
    description: 'Banner under the avatar on the account tab',
    icon: 'account_circle',
    preview: 'profile',
  },
  {
    id: 'rider_wallet',
    label: 'Wallet',
    description: 'Promo placement on the wallet / payments screen',
    icon: 'account_balance_wallet',
    preview: 'wallet',
  },
];

/** Driver app — same PUT/POST shape; placement_key must exist on the edge function. */
export const DRIVER_PLACEMENT_SLOTS = [
  {
    id: 'driver_home_hero',
    label: 'Driver home hero',
    description: 'Spotlight on the driver map / home screen',
    icon: 'local_taxi',
    preview: 'hero',
  },
  {
    id: 'driver_ribbon',
    label: 'Driver ribbon',
    description: 'Slim strip near requests or the primary action',
    icon: 'horizontal_rule',
    preview: 'strip',
  },
  {
    id: 'driver_trip_complete',
    label: 'Trip complete',
    description: 'Card after a trip ends (driver view)',
    icon: 'emoji_events',
    preview: 'complete',
  },
  {
    id: 'driver_account_banner',
    label: 'Driver account banner',
    description: 'Under earnings or profile on the driver account tab',
    icon: 'account_circle',
    preview: 'profile',
  },
  {
    id: 'driver_wallet',
    label: 'Driver wallet',
    description: 'Promo on the driver wallet or payouts screen',
    icon: 'account_balance_wallet',
    preview: 'wallet',
  },
];

function defaultPlacement(slotId) {
  return {
    slotId,
    headline: '',
    body: '',
    imageUrl: '',
    ctaText: 'Learn more',
    deepLink: '',
    active: false,
    updatedAt: null,
    publishedAt: null,
  };
}

function buildRiderPlacementsMap() {
  const bySlot = {};
  PLACEMENT_SLOTS.forEach((s) => {
    bySlot[s.id] = defaultPlacement(s.id);
  });
  return bySlot;
}

function buildDriverPlacementsMap() {
  const bySlot = {};
  DRIVER_PLACEMENT_SLOTS.forEach((s) => {
    bySlot[s.id] = defaultPlacement(s.id);
  });
  return bySlot;
}

function buildDefaultState() {
  return {
    version: 2,
    placements: buildRiderPlacementsMap(),
    driverPlacements: buildDriverPlacementsMap(),
    lastPublishedAt: null,
    lastDriverPublishedAt: null,
  };
}

export function placementToApiPayload(placementKey, placement) {
  return {
    placement_key: placementKey,
    show_to_all_users: Boolean(placement.active),
    headline: (placement.headline || '').trim(),
    supporting_copy: (placement.body || '').trim(),
    creative_image_url: (placement.imageUrl || '').trim(),
    button_label: (placement.ctaText || 'Learn more').trim(),
    deep_link: (placement.deepLink || '').trim(),
  };
}

export async function saveAdPlacementDraft(placementKey, placement) {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No authentication token found. Please login first.' };
    }
    const body = placementToApiPayload(placementKey, placement);
    const response = await fetch(`${API_BASE_URL}/ad-placement`, {
      method: 'PUT',
      headers: {
        apikey: getAnonKey(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: msg };
    }
    return { success: true, data };
  } catch (e) {
    console.error('saveAdPlacementDraft', e);
    return { success: false, error: e.message || 'Could not save placement.' };
  }
}

export async function publishAdPlacement(placementKey) {
  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No authentication token found. Please login first.' };
    }
    const response = await fetch(`${API_BASE_URL}/ad-placement`, {
      method: 'POST',
      headers: {
        apikey: getAnonKey(),
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'publish', placement_key: placementKey }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
      return { success: false, error: msg };
    }
    return { success: true, data };
  } catch (e) {
    console.error('publishAdPlacement', e);
    return { success: false, error: e.message || 'Could not publish placement.' };
  }
}

export function loadAdConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { success: true, data: buildDefaultState() };
    const parsed = JSON.parse(raw);
    if (!parsed?.placements) return { success: true, data: buildDefaultState() };
    const merged = buildDefaultState();
    Object.keys(merged.placements).forEach((id) => {
      if (parsed.placements[id]) {
        merged.placements[id] = { ...merged.placements[id], ...parsed.placements[id] };
      }
    });
    // Legacy key before API used placement_key "booking_ribbon"
    if (parsed.placements.booking_strip && !parsed.placements.booking_ribbon) {
      merged.placements.booking_ribbon = {
        ...merged.placements.booking_ribbon,
        ...parsed.placements.booking_strip,
        slotId: 'booking_ribbon',
      };
    }
    // Legacy id before API used placement_key "profile_spotlight"
    if (parsed.placements.profile_banner && !parsed.placements.profile_spotlight) {
      merged.placements.profile_spotlight = {
        ...merged.placements.profile_spotlight,
        ...parsed.placements.profile_banner,
        slotId: 'profile_spotlight',
      };
    }
    // Legacy id before API used placement_key "rider_wallet"
    if (parsed.placements.wallet && !parsed.placements.rider_wallet) {
      merged.placements.rider_wallet = {
        ...merged.placements.rider_wallet,
        ...parsed.placements.wallet,
        slotId: 'rider_wallet',
      };
    }
    if (parsed.driverPlacements && typeof parsed.driverPlacements === 'object') {
      Object.keys(merged.driverPlacements).forEach((id) => {
        if (parsed.driverPlacements[id]) {
          merged.driverPlacements[id] = {
            ...merged.driverPlacements[id],
            ...parsed.driverPlacements[id],
          };
        }
      });
      // Legacy id before API used placement_key "driver_ribbon"
      if (parsed.driverPlacements.driver_booking_ribbon && !parsed.driverPlacements.driver_ribbon) {
        merged.driverPlacements.driver_ribbon = {
          ...merged.driverPlacements.driver_ribbon,
          ...parsed.driverPlacements.driver_booking_ribbon,
          slotId: 'driver_ribbon',
        };
      }
      if (parsed.driverPlacements.driver_profile_banner && !parsed.driverPlacements.driver_account_banner) {
        merged.driverPlacements.driver_account_banner = {
          ...merged.driverPlacements.driver_account_banner,
          ...parsed.driverPlacements.driver_profile_banner,
          slotId: 'driver_account_banner',
        };
      }
    }
    merged.lastPublishedAt = parsed.lastPublishedAt ?? null;
    merged.lastDriverPublishedAt = parsed.lastDriverPublishedAt ?? null;
    return { success: true, data: merged };
  } catch (e) {
    console.error('loadAdConfig', e);
    return { success: false, error: e.message, data: buildDefaultState() };
  }
}

export function persistAdConfigLocal(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
