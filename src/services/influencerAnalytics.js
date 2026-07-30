/**
 * Deterministic hash for stable demo metrics per influencer id.
 */
import { getAuthToken, SUPABASE_ANON_KEY } from './authService';

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

function normalizeTimeSeries(raw, countKeys = ['count', 'referrals', 'logins', 'total', 'value']) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => {
    if (!item || typeof item !== 'object') return null;
    const date = pickString(item, ['date', 'day', 'period_date', 'created_date', 'logged_date'], '');
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
    const count = pickNumber(item, ['count', 'logins', 'total', 'value']);
    return { hour, count };
  }).filter(Boolean);
}

function normalizeReferralStatus(statusRaw, summary) {
  if (Array.isArray(statusRaw) && statusRaw.length > 0) {
    const colors = ['#7c3aed', '#a78bfa', '#ddd6fe', '#c4b5fd'];
    return statusRaw.map((item, i) => ({
      label: pickString(item, ['label', 'status', 'name'], 'Unknown'),
      count: pickNumber(item, ['count', 'total', 'value']),
      percentage: pickNumber(item, ['percentage', 'percent', 'share']),
      color: item.color || colors[i % colors.length],
    }));
  }

  const completed = pickNumber(summary, ['completed_referrals', 'completedReferrals']);
  const pending = pickNumber(summary, ['pending_referrals', 'pendingReferrals']);
  const signedUp = pickNumber(summary, ['signed_up_referrals', 'signedUpOnly', 'signed_up_only']);
  const total = pickNumber(summary, ['total_referrals', 'totalReferrals'], completed + pending + signedUp);

  if (!total) return [];

  const segments = [
    { label: 'Completed ride', count: completed, color: '#7c3aed' },
    { label: 'Signed up only', count: signedUp, color: '#a78bfa' },
    { label: 'Pending', count: pending, color: '#ddd6fe' },
  ].filter((s) => s.count > 0);

  return segments.map((s) => ({
    ...s,
    percentage: Math.round((s.count / total) * 100),
  }));
}

function normalizeReferralRecord(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const id = pickString(raw, ['id', 'referral_id', 'user_id'], `ref_${index}`);
  const user = pickString(raw, [
    'user',
    'user_name',
    'referred_user_name',
    'referred_user',
    'full_name',
    'name',
    'email',
  ], '—');
  const statusRaw = pickString(raw, ['status', 'referral_status', 'state'], 'Pending');
  const date = pickString(raw, ['date', 'created_at', 'referred_at', 'signed_up_at'], '');
  return { id, user, status: formatReferralStatus(statusRaw), date };
}

function formatReferralStatus(status) {
  const s = String(status || '').toLowerCase().replace(/_/g, ' ');
  if (s.includes('complete')) return 'Completed';
  if (s.includes('sign')) return 'Signed up';
  if (s.includes('pending')) return 'Pending';
  return status || 'Pending';
}

function normalizeLoginRecord(raw, index) {
  if (!raw || typeof raw !== 'object') return null;
  const id = pickString(raw, ['id', 'login_id', 'session_id'], `login_${index}`);
  const date = pickString(raw, ['date', 'logged_at', 'login_at', 'created_at', 'timestamp'], '');
  const device = pickString(raw, ['device', 'device_type', 'platform', 'user_agent'], '—');
  return { id, date, device };
}

function normalizeInfluencerDetailFromApi(data, fallbackInfluencer) {
  if (!data || typeof data !== 'object') return null;

  const payload = data.data ?? data;
  const summaryRaw = payload.summary ?? payload.metrics ?? payload.stats ?? payload;
  const influencerRaw = payload.influencer ?? payload.influencer_profile ?? fallbackInfluencer ?? {};

  const summary = {
    totalReferrals: pickNumber(summaryRaw, ['total_referrals', 'totalReferrals']),
    referralsToday: pickNumber(summaryRaw, ['referrals_today', 'referralsToday']),
    referralsThisMonth: pickNumber(summaryRaw, [
      'referrals_this_month',
      'referralsThisMonth',
      'referrals_in_period',
      'referralsInPeriod',
    ]),
    loginsToday: pickNumber(summaryRaw, ['logins_today', 'loginsToday']),
    loginsThisMonth: pickNumber(summaryRaw, [
      'logins_this_month',
      'loginsThisMonth',
      'logins_in_period',
      'loginsInPeriod',
    ]),
    lastLogin: pickString(summaryRaw, ['last_login', 'lastLogin', 'last_login_at', 'lastLoginAt'], null) || null,
    conversionRate: pickNumber(summaryRaw, ['conversion_rate', 'conversionRate']),
    completedReferrals: pickNumber(summaryRaw, ['completed_referrals', 'completedReferrals']),
    pendingReferrals: pickNumber(summaryRaw, ['pending_referrals', 'pendingReferrals']),
    signedUpOnly: pickNumber(summaryRaw, ['signed_up_referrals', 'signedUpOnly', 'signed_up_only']),
  };

  const referralsRaw = payload.recent_referrals ?? payload.referrals ?? payload.referral_list ?? [];
  const loginsRaw = payload.login_history ?? payload.logins ?? payload.recent_logins ?? [];

  return {
    influencer: {
      id: pickString(influencerRaw, ['id', 'influencer_id', 'user_id'], fallbackInfluencer?.id),
      displayName: pickString(
        influencerRaw,
        ['display_name', 'displayName', 'full_name', 'name'],
        fallbackInfluencer?.displayName
      ),
      email: pickString(influencerRaw, ['email', 'login_email'], fallbackInfluencer?.email),
      phone: pickString(influencerRaw, ['phone', 'phone_number'], fallbackInfluencer?.phone),
    },
    summary,
    referralsOverTime: normalizeTimeSeries(
      payload.referrals_over_time ?? payload.referrals_by_day ?? payload.referrals_timeline
    ),
    loginsOverTime: normalizeTimeSeries(
      payload.logins_over_time ?? payload.logins_by_day ?? payload.logins_timeline,
      ['count', 'logins', 'total', 'value']
    ),
    loginsByHour: normalizeHourlySeries(payload.logins_by_hour ?? payload.login_hours),
    referralStatus: normalizeReferralStatus(
      payload.referral_status ?? payload.referral_funnel ?? payload.referrals_by_status,
      summary
    ),
    recentReferrals: (Array.isArray(referralsRaw) ? referralsRaw : [])
      .map(normalizeReferralRecord)
      .filter(Boolean),
    loginHistory: (Array.isArray(loginsRaw) ? loginsRaw : [])
      .map(normalizeLoginRecord)
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
    const bump = weekend ? 0.75 : 1;
    const value = Math.round(seededValue(seed, baseMin, baseMax) * bump);
    out.push({
      date: formatDateKey(d),
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      count: value,
    });
  }
  return out;
}

function buildHourlyLogins(seed) {
  const hours = [];
  for (let h = 0; h < 24; h += 2) {
    const label = `${String(h).padStart(2, '0')}:00`;
    const peak = h >= 8 && h <= 20;
    const count = seededValue(hashSeed(`${seed}-h${h}`), peak ? 2 : 0, peak ? 18 : 4);
    hours.push({ hour: label, count });
  }
  return hours;
}

function normalizeReferralFunnel(funnel) {
  if (!funnel || typeof funnel !== 'object') return [];

  const meta = {
    completed_ride: { label: 'Completed ride', color: '#7c3aed' },
    signed_up_only: { label: 'Signed up only', color: '#a78bfa' },
    pending: { label: 'Pending', color: '#ddd6fe' },
  };

  return Object.entries(funnel)
    .map(([key, val]) => {
      if (!val || typeof val !== 'object') return null;
      const info = meta[key] || { label: key.replace(/_/g, ' '), color: '#c4b5fd' };
      return {
        label: info.label,
        count: pickNumber(val, ['count']),
        percentage: pickNumber(val, ['percent', 'percentage']),
        color: info.color,
      };
    })
    .filter((s) => s && s.count > 0);
}

function normalizeOverviewFromApi(data) {
  if (!data || typeof data !== 'object') return null;

  const payload = data.data ?? data;
  const summaryRaw = payload.summary;
  if (!summaryRaw) return null;

  const referralsOverTime = normalizeTimeSeries(payload.referrals_over_time);
  const loginsOverTime = normalizeTimeSeries(payload.logins_over_time, ['count', 'logins', 'total', 'value']);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayReferralsRow = referralsOverTime.find((d) => d.date === todayKey);
  const referralsToday = todayReferralsRow?.count ?? 0;
  const totalReferrals = pickNumber(summaryRaw, ['total_referrals', 'totalReferrals']);
  const totalInfluencers = pickNumber(summaryRaw, ['total_influencers', 'totalInfluencers']);
  const referralsThisPeriod =
    totalReferrals || referralsOverTime.reduce((sum, row) => sum + row.count, 0);

  const topPerformers = (payload.top_performers ?? payload.topPerformers ?? []).map((row) => ({
    id: pickString(row, ['influencer_id', 'id']),
    name: pickString(row, ['display_name', 'name'], '—'),
    referrals: pickNumber(row, ['referrals']),
  }));

  const leaderboard = (payload.leaderboard ?? []).map((row) => ({
    id: pickString(row, ['id', 'influencer_id']),
    rank: pickNumber(row, ['rank']),
    name: pickString(row, ['display_name', 'name'], '—'),
    email: pickString(row, ['email'], '—'),
    referrals: pickNumber(row, ['referrals']),
    logins: pickNumber(row, ['logins_period', 'logins']),
    conversionRate: pickNumber(row, ['conversion_rate', 'conversionRate']),
  }));

  const recentActivity = (payload.recent_activity ?? payload.recentActivity ?? []).map((act) => {
    const typeRaw = pickString(act, ['type'], '');
    const isLogin = typeRaw === 'login';
    return {
      id: pickString(act, ['id']),
      type: isLogin ? 'login' : 'referral',
      influencer: pickString(act, ['influencer_name', 'influencer'], '—'),
      description: pickString(act, ['description'], '—'),
      timestamp: pickString(act, ['occurred_at', 'timestamp', 'created_at'], ''),
    };
  });

  return {
    periodDays: pickNumber(payload, ['period_days'], 30),
    periodStart: pickString(payload, ['period_start'], ''),
    periodEnd: pickString(payload, ['period_end'], ''),
    summary: {
      totalReferrals,
      referralsToday,
      referralsThisMonth: referralsThisPeriod,
      loginsToday: pickNumber(summaryRaw, ['logins_today', 'loginsToday']),
      loginsThisMonth: pickNumber(summaryRaw, ['logins_this_period', 'logins_in_period', 'loginsThisMonth']),
      activeInfluencers: totalInfluencers,
      conversionRate: pickNumber(summaryRaw, ['conversion_rate', 'conversionRate']),
      avgReferralsPerInfluencer:
        totalInfluencers > 0 ? Math.round(referralsThisPeriod / totalInfluencers) : 0,
    },
    referralsOverTime,
    loginsOverTime,
    loginsByHour: normalizeHourlySeries(payload.logins_by_hour),
    topInfluencers: topPerformers,
    leaderboard,
    leaderboardPagination: payload.leaderboard_pagination ?? payload.leaderboardPagination ?? null,
    referralStatus: normalizeReferralFunnel(payload.referral_funnel ?? payload.referralFunnel),
    recentActivity,
    isDemo: false,
  };
}

export function buildDemoAnalyticsOverview(influencers = [], period = '30d') {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const count = influencers.length || 5;

  let totalReferrals = 0;
  let loginsThisMonth = 0;
  const topInfluencers = influencers.slice(0, 10).map((inf, i) => {
    const seed = hashSeed(inf.id || inf.email || String(i));
    const referrals = seededValue(seed, 12, 340);
    const logins = seededValue(seed + 1, 8, 62);
    const conversionRate = seededValue(seed + 2, 18, 72);
    totalReferrals += referrals;
    loginsThisMonth += logins;
    return {
      id: inf.id,
      name: inf.displayName !== '—' ? inf.displayName : inf.email,
      email: inf.email,
      referrals,
      logins,
      conversionRate,
    };
  });

  if (topInfluencers.length === 0) {
    for (let i = 0; i < 5; i += 1) {
      const seed = hashSeed(`demo-${i}`);
      const referrals = seededValue(seed, 20, 280);
      const logins = seededValue(seed + 1, 10, 55);
      totalReferrals += referrals;
      loginsThisMonth += logins;
      topInfluencers.push({
        id: `demo_${i}`,
        name: `Influencer ${i + 1}`,
        email: `influencer${i + 1}@example.com`,
        referrals,
        logins,
        conversionRate: seededValue(seed + 2, 20, 68),
      });
    }
  }

  topInfluencers.sort((a, b) => b.referrals - a.referrals);

  const referralsOverTime = buildDailySeries(days, 'ref-all', 3, 28);
  const loginsOverTime = buildDailySeries(days, 'login-all', 2, 18);
  const todayReferrals = referralsOverTime[referralsOverTime.length - 1]?.count ?? 0;
  const todayLogins = loginsOverTime[loginsOverTime.length - 1]?.count ?? 0;
  const monthReferrals = referralsOverTime.reduce((s, d) => s + d.count, 0);

  const completed = Math.round(totalReferrals * 0.58);
  const pending = Math.round(totalReferrals * 0.22);
  const signedUp = totalReferrals - completed - pending;

  return {
    summary: {
      totalReferrals,
      referralsToday: todayReferrals,
      referralsThisMonth: monthReferrals,
      loginsToday: todayLogins,
      loginsThisMonth,
      activeInfluencers: Math.max(1, Math.min(count, Math.round(count * 0.85))),
      conversionRate: totalReferrals ? Math.round((completed / totalReferrals) * 100) : 0,
      avgReferralsPerInfluencer: count ? Math.round(totalReferrals / count) : 0,
    },
    referralsOverTime,
    loginsOverTime,
    loginsByHour: buildHourlyLogins('overview'),
    topInfluencers,
    referralStatus: [
      { label: 'Completed ride', count: completed, percentage: 58, color: '#7c3aed' },
      { label: 'Signed up only', count: signedUp, percentage: 20, color: '#a78bfa' },
      { label: 'Pending', count: pending, percentage: 22, color: '#ddd6fe' },
    ],
    recentActivity: topInfluencers.slice(0, 5).flatMap((inf, i) => [
      {
        id: `act-ref-${i}`,
        type: 'referral',
        influencer: inf.name,
        description: 'New referral signup',
        timestamp: new Date(Date.now() - i * 3600000 * 4).toISOString(),
      },
      {
        id: `act-login-${i}`,
        type: 'login',
        influencer: inf.name,
        description: 'Logged into influencer app',
        timestamp: new Date(Date.now() - i * 3600000 * 2 - 900000).toISOString(),
      },
    ]),
    isDemo: true,
  };
}

export function buildDemoInfluencerDetail(influencer, period = '30d') {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const seed = hashSeed(influencer?.id || influencer?.email || 'inf');
  const totalReferrals = seededValue(seed, 24, 420);
  const loginsThisMonth = seededValue(seed + 3, 12, 48);
  const loginsToday = seededValue(seed + 4, 0, 3);
  const conversionRate = seededValue(seed + 5, 22, 78);
  const completed = Math.round(totalReferrals * (conversionRate / 100));
  const pending = Math.round(totalReferrals * 0.15);

  const referralsOverTime = buildDailySeries(days, `ref-${seed}`, 0, 8);
  const loginsOverTime = buildDailySeries(days, `login-${seed}`, 0, 4);

  const recentReferrals = Array.from({ length: 8 }, (_, i) => ({
    id: `ref-${i}`,
    user: `User ${seed % 900 + i + 100}`,
    status: i % 3 === 0 ? 'Completed' : i % 3 === 1 ? 'Signed up' : 'Pending',
    date: new Date(Date.now() - i * 86400000 * 2).toISOString(),
  }));

  const loginHistory = Array.from({ length: 10 }, (_, i) => ({
    id: `login-${i}`,
    date: new Date(Date.now() - i * 86400000 * 1.2).toISOString(),
    device: i % 2 === 0 ? 'iOS App' : 'Android App',
  }));

  return {
    influencer: {
      id: influencer.id,
      displayName: influencer.displayName,
      email: influencer.email,
      phone: influencer.phone,
    },
    summary: {
      totalReferrals,
      referralsToday: referralsOverTime[referralsOverTime.length - 1]?.count ?? 0,
      referralsThisMonth: referralsOverTime.reduce((s, d) => s + d.count, 0),
      loginsToday,
      loginsThisMonth,
      lastLogin: loginHistory[0]?.date ?? null,
      conversionRate,
      completedReferrals: completed,
      pendingReferrals: pending,
      signedUpOnly: totalReferrals - completed - pending,
    },
    referralsOverTime,
    loginsOverTime,
    loginsByHour: buildHourlyLogins(String(seed)),
    recentReferrals,
    loginHistory,
    isDemo: true,
  };
}

/**
 * Fetch influencers overview analytics (GET `admin-influencers-overview`).
 */
export async function fetchInfluencerAnalyticsOverview(opts = {}) {
  const periodDays = periodToDays(opts.period ?? opts.periodDays ?? '30d');
  const page = Math.max(1, parseInt(String(opts.page ?? 1), 10) || 1);
  const limit = Math.max(1, parseInt(String(opts.limit ?? 20), 10) || 20);
  const topPerformersLimit = Math.max(1, parseInt(String(opts.topPerformersLimit ?? 3), 10) || 3);
  const activityLimit = Math.max(1, parseInt(String(opts.activityLimit ?? 20), 10) || 20);

  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No authentication token found. Please login first.' };
    }

    const params = new URLSearchParams({
      period_days: String(periodDays),
      page: String(page),
      limit: String(limit),
      top_performers_limit: String(topPerformersLimit),
      activity_limit: String(activityLimit),
    });

    const url = `${API_BASE_URL}/admin-influencers-overview?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
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
        error: parseErrorMessage(data, 'Failed to load influencers overview'),
      };
    }

    const normalized = normalizeOverviewFromApi(data);
    if (!normalized) {
      return {
        success: false,
        error: 'Unexpected overview response format',
      };
    }

    return { success: true, data: normalized };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to load influencers overview',
    };
  }
}

/**
 * Fetch single-influencer activity (GET `admin-influencer-analytics`).
 * Query: influencer_id, period_days (7|30|90), referrals_limit, logins_limit
 */
export async function fetchInfluencerDetailAnalytics(influencerId, influencer, opts = {}) {
  const periodDays = periodToDays(opts.period ?? opts.periodDays ?? '30d');
  const referralsLimit = Math.max(1, parseInt(String(opts.referralsLimit ?? 20), 10) || 20);
  const loginsLimit = Math.max(1, parseInt(String(opts.loginsLimit ?? 20), 10) || 20);

  try {
    const token = getAuthToken();
    if (!token) {
      return { success: false, error: 'No authentication token found. Please login first.' };
    }

    const params = new URLSearchParams({
      influencer_id: influencerId,
      period_days: String(periodDays),
      referrals_limit: String(referralsLimit),
      logins_limit: String(loginsLimit),
    });

    const url = `${API_BASE_URL}/admin-influencer-analytics?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
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
        error: parseErrorMessage(data, 'Failed to load influencer analytics'),
      };
    }

    const normalized = normalizeInfluencerDetailFromApi(data, influencer || { id: influencerId });
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
      error: error.message || 'Failed to load influencer analytics',
    };
  }
}
