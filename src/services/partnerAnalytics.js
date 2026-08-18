import { authenticatedFetch } from './apiClient';
import { SUPABASE_ANON_KEY } from './authService';

const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

function parseErrorMessage(errorData, fallback) {
  if (!errorData || typeof errorData !== 'object') return fallback;
  const err = errorData.error ?? errorData.message;
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && typeof err.message === 'string') return err.message;
  return fallback;
}

function periodToDays(period) {
  if (period === '7d' || period === 7) return 7;
  if (period === '90d' || period === 90) return 90;
  return 30;
}

function pickNumber(obj, keys, fallback = 0) {
  if (!obj || typeof obj !== 'object') return fallback;
  for (const key of keys) {
    const val = obj[key];
    if (val != null && val !== '') return Number(val) || 0;
  }
  return fallback;
}

function pickString(obj, keys, fallback = '') {
  if (!obj || typeof obj !== 'object') return fallback;
  for (const key of keys) {
    const val = obj[key];
    if (val != null && val !== '') return String(val);
  }
  return fallback;
}

function formatSeriesLabel(dateRaw) {
  if (!dateRaw) return '';
  const d = new Date(dateRaw);
  if (Number.isNaN(d.getTime())) return String(dateRaw);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function normalizeTimeSeries(raw, countKeys = ['count', 'scans', 'downloads', 'registrations', 'rides', 'total', 'value']) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') return null;
    const date = pickString(item, ['date', 'day', 'period_date', 'created_date'], '');
    let count = 0;
    for (const key of countKeys) {
      if (item[key] != null && item[key] !== '') {
        count = Number(item[key]) || 0;
        break;
      }
    }
    return {
      date: date || `point_${index}`,
      label: formatSeriesLabel(date),
      count,
    };
  }).filter(Boolean);
}

function normalizeHourlySeries(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') return null;
    const hour = pickString(item, ['label', 'hour_label', 'hour', 'time'], `${index}`);
    const count = pickNumber(item, ['count', 'scans', 'total', 'value']);
    return { hour, count };
  }).filter(Boolean);
}

function normalizeAttributionFunnel(funnel) {
  if (!funnel || typeof funnel !== 'object' || Array.isArray(funnel)) return [];

  const meta = {
    scanned: { label: 'Scanned', color: '#0d9488' },
    scan: { label: 'Scanned', color: '#0d9488' },
    scans: { label: 'Scanned', color: '#0d9488' },
    downloaded: { label: 'Downloaded', color: '#14b8a6' },
    download: { label: 'Downloaded', color: '#14b8a6' },
    downloads: { label: 'Downloaded', color: '#14b8a6' },
    registered: { label: 'Registered', color: '#5eead4' },
    registration: { label: 'Registered', color: '#5eead4' },
    registrations: { label: 'Registered', color: '#5eead4' },
    completed_ride: { label: 'Completed ride', color: '#99f6e4' },
    completed_rides: { label: 'Completed ride', color: '#99f6e4' },
    rides_completed: { label: 'Completed ride', color: '#99f6e4' },
  };

  return Object.entries(funnel)
    .map(([key, val]) => {
      if (!val || typeof val !== 'object') return null;
      const info = meta[key] || { label: key.replace(/_/g, ' '), color: '#99f6e4' };
      return {
        label: info.label,
        count: pickNumber(val, ['count', 'total', 'value']),
        percentage: pickNumber(val, ['percent', 'percentage', 'share']),
        color: info.color,
      };
    })
    .filter((s) => s && s.count > 0);
}

function normalizeFunnelStatus(funnelRaw, summary) {
  if (Array.isArray(funnelRaw) && funnelRaw.length > 0) {
    const colors = ['#0d9488', '#14b8a6', '#5eead4', '#99f6e4'];
    return funnelRaw.map((item, i) => ({
      label: pickString(item, ['label', 'stage', 'name'], 'Unknown'),
      count: pickNumber(item, ['count', 'total', 'value']),
      percentage: pickNumber(item, ['percentage', 'percent', 'share']),
      color: item.color || colors[i % colors.length],
    }));
  }

  const objectFunnel = normalizeAttributionFunnel(funnelRaw);
  if (objectFunnel.length > 0) return objectFunnel;

  const scans = pickNumber(summary, ['scans', 'total_scans', 'totalScans']);
  const downloads = pickNumber(summary, ['downloads', 'total_downloads', 'totalDownloads']);
  const registrations = pickNumber(summary, ['registrations', 'total_registrations', 'totalRegistrations']);
  const completedRides = pickNumber(summary, ['completed_rides', 'completedRides', 'rides_completed']);

  const segments = [
    { label: 'Scanned', count: scans, color: '#0d9488' },
    { label: 'Downloaded', count: downloads, color: '#14b8a6' },
    { label: 'Registered', count: registrations, color: '#5eead4' },
    { label: 'Completed ride', count: completedRides, color: '#99f6e4' },
  ].filter((s) => s.count > 0);

  const total = scans || segments.reduce((sum, s) => sum + s.count, 0);
  if (!total) return [];

  return segments.map((s) => ({
    ...s,
    percentage: Math.round((s.count / total) * 100),
  }));
}

function normalizeAttributionRecord(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const id = pickString(raw, ['id', 'attribution_id', 'user_id'], `attr_${index}`);
  const user = pickString(raw, [
    'user',
    'user_name',
    'full_name',
    'name',
    'email',
    'referred_user_name',
    'referred_user',
  ], '—');
  const userType = pickString(raw, ['user_type', 'userType', 'type', 'role'], 'rider');
  const statusRaw = pickString(raw, ['status', 'attribution_status', 'state', 'stage'], 'Registered');
  const date = pickString(raw, [
    'date',
    'created_at',
    'attributed_at',
    'registered_at',
    'occurred_at',
    'timestamp',
  ], '');
  return { id, user, userType, status: formatAttributionStatus(statusRaw), date };
}

function formatAttributionStatus(status) {
  const s = String(status || '').toLowerCase().replace(/_/g, ' ');
  if (s.includes('complete')) return 'Completed ride';
  if (s.includes('register') || s.includes('sign')) return 'Registered';
  if (s.includes('download')) return 'Downloaded';
  if (s.includes('scan')) return 'Scanned';
  return status || 'Registered';
}

function normalizeRewardRecord(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const id = pickString(raw, ['id', 'reward_id', 'voucher_id'], `reward_${index}`);
  const reward = pickString(raw, [
    'reward',
    'reward_type',
    'rewardType',
    'description',
    'title',
    'reward_name',
  ], '—');
  const user = pickString(raw, [
    'user',
    'user_name',
    'full_name',
    'name',
    'beneficiary_name',
    'recipient_name',
  ], '—');
  const statusRaw = pickString(raw, ['status', 'reward_status', 'state'], 'Issued');
  const date = pickString(raw, [
    'date',
    'issued_at',
    'redeemed_at',
    'created_at',
    'occurred_at',
    'timestamp',
  ], '');
  return { id, reward, user, status: formatRewardStatus(statusRaw), date };
}

function formatRewardStatus(status) {
  const s = String(status || '').toLowerCase();
  if (s.includes('redeem')) return 'Redeemed';
  if (s.includes('expir')) return 'Expired';
  if (s.includes('revok') || s.includes('void')) return 'Revoked';
  return 'Issued';
}

function normalizePartnerDetailFromApi(data, fallbackPartner) {
  if (!data || typeof data !== 'object') return null;

  const payload = data.data ?? data;
  const summaryRaw = payload.summary ?? payload.metrics ?? payload.stats ?? {};
  const partnerRaw = payload.partner ?? payload.partner_profile ?? fallbackPartner ?? {};

  const scans = pickNumber(summaryRaw, ['scans', 'total_scans', 'totalScans', 'scans_in_period']);
  const downloads = pickNumber(summaryRaw, ['downloads', 'total_downloads', 'totalDownloads', 'downloads_in_period']);
  const registrations = pickNumber(summaryRaw, [
    'registrations',
    'total_registrations',
    'totalRegistrations',
    'registrations_in_period',
  ]);
  const completedRides = pickNumber(summaryRaw, [
    'completed_rides',
    'completedRides',
    'rides_completed',
    'rides_in_period',
  ]);
  const activationRate =
    pickNumber(summaryRaw, ['activation_rate', 'activationRate']) ||
    (downloads > 0 ? Math.round((registrations / downloads) * 100) : 0);

  const summary = {
    scans,
    downloads,
    registrations,
    completedRides,
    activationRate,
    rewardsIssued: pickNumber(summaryRaw, ['rewards_issued', 'rewardsIssued', 'rewards_in_period']),
    rewardsRedeemed: pickNumber(summaryRaw, ['rewards_redeemed', 'rewardsRedeemed', 'rewards_redeemed_in_period']),
    driversSupplied: pickNumber(summaryRaw, ['drivers_supplied', 'driversSupplied', 'drivers_in_period']),
    commissionEarned: pickNumber(summaryRaw, [
      'commission_earned',
      'commissionEarned',
      'commission_in_period',
      'net_commission',
    ]),
    costPerAcquisition: pickNumber(summaryRaw, ['cost_per_acquisition', 'costPerAcquisition', 'cpa']),
    scansToday: pickNumber(summaryRaw, ['scans_today', 'scansToday']),
    ridesToday: pickNumber(summaryRaw, ['rides_today', 'ridesToday']),
  };

  const attributionsRaw =
    payload.recent_attributions ??
    payload.attributions ??
    payload.recent_users ??
    payload.attribution_list ??
    [];
  const rewardsRaw =
    payload.recent_rewards ??
    payload.rewards ??
    payload.vouchers ??
    payload.reward_list ??
    [];

  const funnelRaw =
    payload.funnel_status ??
    payload.attribution_funnel ??
    payload.funnel ??
    payload.attribution_funnel_breakdown ??
    summaryRaw.attribution_funnel;

  return {
    periodDays: pickNumber(payload, ['period_days', 'periodDays'], 30),
    periodStart: pickString(payload, ['period_start', 'periodStart'], ''),
    periodEnd: pickString(payload, ['period_end', 'periodEnd'], ''),
    partner: {
      id: pickString(partnerRaw, ['id', 'partner_id', 'user_id'], fallbackPartner?.id),
      displayName: pickString(
        partnerRaw,
        ['display_name', 'displayName', 'trading_name', 'name'],
        fallbackPartner?.displayName
      ),
      legalName: pickString(partnerRaw, ['legal_name', 'legalName'], fallbackPartner?.legalName),
      email: pickString(partnerRaw, ['email', 'login_email'], fallbackPartner?.email),
      category: pickString(partnerRaw, ['category', 'partner_category'], fallbackPartner?.category),
      partnerCode: pickString(
        partnerRaw,
        ['partner_code', 'partnerCode', 'primary_code', 'code'],
        fallbackPartner?.partnerCode
      ),
      municipality: pickString(partnerRaw, ['municipality'], fallbackPartner?.municipality),
      status: pickString(partnerRaw, ['status'], fallbackPartner?.status),
    },
    summary,
    scansOverTime: normalizeTimeSeries(
      payload.scans_over_time ??
        payload.scans_by_day ??
        payload.scans_timeline ??
        payload.scan_activity_over_time,
      ['count', 'scans', 'total', 'value']
    ),
    ridesOverTime: normalizeTimeSeries(
      payload.rides_over_time ??
        payload.rides_by_day ??
        payload.completed_rides_timeline ??
        payload.completed_rides_over_time,
      ['count', 'rides', 'completed_rides', 'total', 'value']
    ),
    activityByHour: normalizeHourlySeries(
      payload.activity_by_hour ?? payload.scans_by_hour ?? payload.hourly_activity
    ),
    funnelStatus: normalizeFunnelStatus(funnelRaw, summary),
    recentAttributions: (Array.isArray(attributionsRaw) ? attributionsRaw : [])
      .map(normalizeAttributionRecord)
      .filter(Boolean),
    recentRewards: (Array.isArray(rewardsRaw) ? rewardsRaw : [])
      .map(normalizeRewardRecord)
      .filter(Boolean),
    isDemo: false,
  };
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function seededValue(seed, min, max) {
  const n = (seed % 1000) / 1000;
  return Math.floor(min + n * (max - min + 1));
}

function formatDateKey(d) {
  return d.toISOString().slice(0, 10);
}

function buildDailySeries(days, baseSeed, baseMin, baseMax) {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const seed = hashSeed(`${baseSeed}-${formatDateKey(d)}`);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const bump = weekend ? 1.15 : 1;
    const value = Math.round(seededValue(seed, baseMin, baseMax) * bump);
    out.push({
      date: formatDateKey(d),
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: value,
    });
  }
  return out;
}

function buildHourlyActivity(seed) {
  const hours = [];
  for (let h = 0; h < 24; h += 2) {
    const label = `${String(h).padStart(2, '0')}:00`;
    const evening = h >= 18 && h <= 23;
    const lunch = h >= 11 && h <= 14;
    const peak = evening || lunch;
    const count = seededValue(hashSeed(`${seed}-h${h}`), peak ? 4 : 0, peak ? 32 : 8);
    hours.push({ hour: label, count });
  }
  return hours;
}

function categoryRewardLabel(category) {
  switch (String(category || '').toLowerCase()) {
    case 'limousine':
      return 'Commission credit';
    case 'restaurant':
      return 'Complimentary meal';
    case 'club':
      return 'Venue discount';
    case 'bar':
      return 'Complimentary drink';
    default:
      return 'Partner reward';
  }
}

export function buildDemoPartnerDetail(partner, period = '30d') {
  const category = String(partner?.category || 'restaurant').toLowerCase();
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const seed = hashSeed(partner?.id || partner?.email || partner?.partnerCode || 'pt');

  const categoryScale = {
    limousine: 0.85,
    restaurant: 1,
    club: 1.2,
    bar: 1.1,
  }[category] ?? 1;

  const scans = Math.round(seededValue(seed, 600, 14000) * categoryScale);
  const downloads = Math.round(scans * (seededValue(seed + 1, 38, 68) / 100));
  const registrations = Math.round(downloads * (seededValue(seed + 2, 52, 82) / 100));
  const completedRides = Math.round(registrations * (seededValue(seed + 3, 28, 58) / 100));
  const activationRate = downloads ? Math.round((registrations / downloads) * 100) : 0;
  const rewardsIssued = Math.round(completedRides * (seededValue(seed + 4, 18, 42) / 100));
  const rewardsRedeemed = Math.round(rewardsIssued * (seededValue(seed + 5, 55, 88) / 100));
  const driversSupplied = category === 'limousine' ? seededValue(seed + 6, 8, 64) : 0;
  const commissionEarned = category === 'limousine'
    ? seededValue(seed + 7, 1200, 28000)
    : 0;
  const costPerAcquisition = registrations
    ? Math.round((seededValue(seed + 8, 8, 45) * 100) / 10) / 10
    : 0;

  const scansOverTime = buildDailySeries(days, `scan-${seed}`, 8, 120);
  const ridesOverTime = buildDailySeries(days, `ride-${seed}`, 1, 28);

  const funnelStatus = [
    { label: 'Scanned', count: scans, percentage: 100, color: '#0d9488' },
    {
      label: 'Downloaded',
      count: downloads,
      percentage: scans ? Math.round((downloads / scans) * 100) : 0,
      color: '#14b8a6',
    },
    {
      label: 'Registered',
      count: registrations,
      percentage: scans ? Math.round((registrations / scans) * 100) : 0,
      color: '#5eead4',
    },
    {
      label: 'Completed ride',
      count: completedRides,
      percentage: scans ? Math.round((completedRides / scans) * 100) : 0,
      color: '#99f6e4',
    },
  ].filter((s) => s.count > 0);

  const userTypes = category === 'limousine' ? ['driver', 'rider'] : ['rider', 'rider', 'driver'];
  const statuses = ['Completed ride', 'Registered', 'Downloaded', 'Scanned'];

  const recentAttributions = Array.from({ length: 8 }, (_, i) => ({
    id: `attr-${i}`,
    user: `User ${seed % 900 + i + 200}`,
    userType: userTypes[i % userTypes.length],
    status: statuses[i % statuses.length],
    date: new Date(Date.now() - i * 86400000 * 1.5).toISOString(),
  }));

  const rewardStatuses = ['Redeemed', 'Issued', 'Redeemed', 'Expired', 'Issued'];
  const recentRewards = Array.from({ length: 6 }, (_, i) => ({
    id: `reward-${i}`,
    reward: categoryRewardLabel(category),
    user: `User ${seed % 700 + i + 50}`,
    status: rewardStatuses[i % rewardStatuses.length],
    date: new Date(Date.now() - i * 86400000 * 2.2).toISOString(),
  }));

  return {
    partner: {
      id: partner?.id,
      displayName: partner?.displayName,
      legalName: partner?.legalName,
      email: partner?.email,
      category: partner?.category,
      partnerCode: partner?.partnerCode,
    },
    summary: {
      scans,
      downloads,
      registrations,
      completedRides,
      activationRate,
      rewardsIssued,
      rewardsRedeemed,
      driversSupplied,
      commissionEarned,
      costPerAcquisition,
      scansToday: scansOverTime[scansOverTime.length - 1]?.count ?? 0,
      ridesToday: ridesOverTime[ridesOverTime.length - 1]?.count ?? 0,
    },
    scansOverTime,
    ridesOverTime,
    activityByHour: buildHourlyActivity(String(seed)),
    funnelStatus,
    recentAttributions,
    recentRewards,
    isDemo: true,
  };
}

/**
 * Fetch single-partner analytics (GET `admin-partner-analytics`).
 * Query: partner_id, period_days (7|30|90), attributions_limit, rewards_limit
 */
export async function fetchPartnerDetailAnalytics(partnerId, partner, opts = {}) {
  const periodDays = periodToDays(opts.period ?? opts.periodDays ?? '30d');
  const attributionsLimit = Math.max(1, parseInt(String(opts.attributionsLimit ?? 20), 10) || 20);
  const rewardsLimit = Math.max(1, parseInt(String(opts.rewardsLimit ?? 20), 10) || 20);

  try {
    const params = new URLSearchParams({
      partner_id: String(partnerId),
      period_days: String(periodDays),
      attributions_limit: String(attributionsLimit),
      rewards_limit: String(rewardsLimit),
    });

    const url = `${API_BASE_URL}/admin-partner-analytics?${params.toString()}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: parseErrorMessage(data, `HTTP ${response.status}: ${response.statusText}`),
      };
    }

    if (data.success === false) {
      return {
        success: false,
        error: parseErrorMessage(data, 'Failed to load partner analytics'),
      };
    }

    const normalized = normalizePartnerDetailFromApi(data, partner || { id: partnerId });
    if (!normalized) {
      return {
        success: false,
        error: 'Unexpected analytics response format',
      };
    }

    return { success: true, data: normalized };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to load partner analytics',
    };
  }
}
