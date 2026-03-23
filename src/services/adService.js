/**
 * Ad placement config for the consumer mobile app.
 * Persists locally until a backend endpoint is wired (replace fetch/save with API calls).
 */
const STORAGE_KEY = 'qglide_admin_mobile_ad_placements';

export const PLACEMENT_SLOTS = [
  {
    id: 'home_hero',
    label: 'Home hero',
    description: 'Full-width spotlight on the home screen',
    icon: 'view_carousel',
    preview: 'hero',
  },
  {
    id: 'booking_strip',
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
    id: 'profile_banner',
    label: 'Profile spotlight',
    description: 'Banner under the avatar on the account tab',
    icon: 'account_circle',
    preview: 'profile',
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
  };
}

function buildDefaultState() {
  const bySlot = {};
  PLACEMENT_SLOTS.forEach((s) => {
    bySlot[s.id] = defaultPlacement(s.id);
  });
  return { version: 1, placements: bySlot, lastPublishedAt: null };
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
    merged.lastPublishedAt = parsed.lastPublishedAt ?? null;
    return { success: true, data: merged };
  } catch (e) {
    console.error('loadAdConfig', e);
    return { success: false, error: e.message, data: buildDefaultState() };
  }
}

export async function saveAdConfig(config) {
  await new Promise((r) => setTimeout(r, 280));
  try {
    const payload = {
      ...config,
      lastPublishedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}
