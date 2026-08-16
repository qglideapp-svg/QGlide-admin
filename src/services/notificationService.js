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

function getApiHeaders(includeJson = false) {
  const headers = { apikey: SUPABASE_ANON_KEY };
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

function extractNotificationsArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.notifications)) return data.notifications;
  if (Array.isArray(data.history)) return data.history;
  if (data.data && Array.isArray(data.data.notifications)) return data.data.notifications;
  if (data.data && Array.isArray(data.data.history)) return data.data.history;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function formatDeliverySummary(delivery) {
  if (!delivery || typeof delivery !== 'object') {
    return null;
  }

  const parts = [];

  if (delivery.fcm_success != null) {
    const failures = Number(delivery.fcm_failures ?? 0);
    const tokens = delivery.fcm_tokens != null ? Number(delivery.fcm_tokens) : null;
    if (failures > 0) {
      parts.push(tokens != null
        ? `${delivery.fcm_success}/${tokens} FCM delivered, ${failures} failed`
        : `${delivery.fcm_success} FCM delivered, ${failures} failed`);
    } else {
      parts.push(tokens != null
        ? `${delivery.fcm_success}/${tokens} FCM delivered`
        : `${delivery.fcm_success} FCM delivered`);
    }
  }

  if (delivery.inbox_records_stored != null) {
    parts.push(`${delivery.inbox_records_stored} inbox records`);
  }

  if (delivery.target_user_count != null) {
    parts.push(`${delivery.target_user_count} users targeted`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

function normalizeNotificationRecord(raw, index) {
  if (!raw || typeof raw !== 'object') return null;

  const sentAtRaw =
    raw.sent_at ??
    raw.sentAt ??
    raw.created_at ??
    raw.createdAt ??
    raw.timestamp ??
    null;

  let sentAt = null;
  if (sentAtRaw != null) {
    const parsed = new Date(sentAtRaw);
    if (!Number.isNaN(parsed.getTime())) {
      sentAt = parsed.toISOString();
    }
  }

  const sentBy = raw.sent_by ?? raw.sentBy ?? raw.actor ?? null;
  const delivery = raw.delivery && typeof raw.delivery === 'object'
    ? raw.delivery
    : (raw.stats && typeof raw.stats === 'object'
      ? { ...raw.stats, status: raw.status ?? raw.stats.status }
      : null);

  return {
    id: String(raw.id ?? raw.notification_id ?? `notification_${index}`),
    title: String(raw.title ?? '').trim(),
    message: String(raw.message ?? raw.body ?? raw.content ?? '').trim(),
    type: String(raw.notification_type ?? raw.type ?? 'event').toLowerCase(),
    targetAudience: normalizeNotificationAudience(
      raw.audience ??
      raw.target_audience ??
      raw.targetAudience ??
      raw.recipient_type ??
      raw.recipientType ??
      raw.metadata?.audience ??
      raw.metadata?.target_audience,
    ),
    imageUrl: raw.image_url ?? raw.imageUrl ?? null,
    actionUrl: raw.action_url ?? raw.actionUrl ?? null,
    sentAt,
    sentByName: sentBy?.name ?? null,
    deliveryStatus: delivery?.status ?? raw.status ?? null,
    delivery,
    deliverySummary: formatDeliverySummary(delivery),
  };
}

function normalizeNotificationAudience(value) {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (normalized === 'driver' || normalized === 'drivers') return 'drivers';
  if (normalized === 'rider' || normalized === 'riders' || normalized === 'passenger' || normalized === 'passengers') {
    return 'riders';
  }
  if (normalized === 'both' || normalized === 'all' || normalized === 'everyone') return 'all';

  return 'all';
}

function extractActivityEventsArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.events)) return data.events;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.feed)) return data.feed;
  if (Array.isArray(data.activities)) return data.activities;
  if (data.data && Array.isArray(data.data.events)) return data.data.events;
  if (data.data && Array.isArray(data.data.items)) return data.data.items;
  if (data.data && Array.isArray(data.data)) return data.data;
  return [];
}

function normalizeActivityEvent(raw, index) {
  if (!raw || typeof raw !== 'object') return null;

  const createdRaw =
    raw.created_at ??
    raw.createdAt ??
    raw.occurred_at ??
    raw.occurredAt ??
    raw.timestamp ??
    null;

  let createdAt = null;
  if (createdRaw != null) {
    const parsed = new Date(createdRaw);
    if (!Number.isNaN(parsed.getTime())) {
      createdAt = parsed.toISOString();
    }
  }

  const isRead = Boolean(
    raw.is_read ??
    raw.isRead ??
    raw.read ??
    raw.read_at ??
    raw.readAt,
  );

  return {
    id: String(raw.id ?? raw.event_id ?? raw.eventId ?? `activity_${index}`),
    title: String(raw.title ?? raw.summary ?? raw.subject ?? '').trim(),
    message: String(
      raw.message ??
      raw.description ??
      raw.body ??
      raw.content ??
      raw.details ??
      '',
    ).trim(),
    category: String(raw.category ?? raw.type ?? raw.event_type ?? 'general').toLowerCase(),
    severity: String(raw.severity ?? raw.level ?? raw.priority ?? '').toLowerCase(),
    isRead,
    actionUrl:
      raw.action_url ??
      raw.actionUrl ??
      raw.link ??
      raw.url ??
      raw.metadata?.action_url ??
      null,
    createdAt,
  };
}

export async function fetchAdminActivityFeed(opts = {}) {
  try {
    const limit = Math.max(1, parseInt(String(opts.limit ?? 30), 10) || 30);
    const params = new URLSearchParams({ limit: String(limit) });

    if (opts.cursor) params.set('cursor', opts.cursor);
    if (opts.category) params.set('category', opts.category);
    if (opts.eventType?.trim()) params.set('event_type', opts.eventType.trim());
    if (opts.since?.trim()) params.set('since', opts.since.trim());
    if (opts.unreadOnly) params.set('unread_only', 'true');
    if (opts.search?.trim()) params.set('search', opts.search.trim());

    const url = `${API_BASE_URL}/admin-activity-feed?${params.toString()}`;
    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: getApiHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(parseErrorMessage(errorData, `HTTP ${response.status}: ${response.statusText}`));
    }

    const data = await response.json().catch(() => ({}));
    const rawList = extractActivityEventsArray(data);
    const events = rawList.map((row, index) => normalizeActivityEvent(row, index)).filter(Boolean);

    const nextCursor =
      data.next_cursor ??
      data.nextCursor ??
      data.data?.next_cursor ??
      data.data?.nextCursor ??
      null;

    const unreadCount =
      data.unread_count ??
      data.unreadCount ??
      data.data?.unread_count ??
      data.data?.unreadCount ??
      null;

    return {
      success: true,
      data: {
        events,
        nextCursor: nextCursor || null,
        unreadCount: unreadCount != null ? Number(unreadCount) : null,
        hasMore: Boolean(nextCursor),
      },
    };
  } catch (error) {
    console.error('❌ FETCH ADMIN ACTIVITY FEED ERROR:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch activity feed',
    };
  }
}

export async function markActivityEventsRead(eventIds = []) {
  try {
    const ids = Array.isArray(eventIds) ? eventIds.filter(Boolean) : [];
    if (ids.length === 0) {
      return { success: true, data: {} };
    }

    const response = await authenticatedFetch(`${API_BASE_URL}/admin-activity-feed`, {
      method: 'PATCH',
      headers: getApiHeaders(true),
      body: JSON.stringify({ event_ids: ids }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(parseErrorMessage(errorData, `HTTP ${response.status}: ${response.statusText}`));
    }

    const data = await response.json().catch(() => ({}));
    return { success: true, data };
  } catch (error) {
    console.error('❌ MARK ACTIVITY EVENTS READ ERROR:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark notifications as read',
    };
  }
}

export async function markAllActivityEventsRead() {
  try {
    const response = await authenticatedFetch(`${API_BASE_URL}/admin-activity-feed`, {
      method: 'PATCH',
      headers: getApiHeaders(true),
      body: JSON.stringify({ mark_all_read: true }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(parseErrorMessage(errorData, `HTTP ${response.status}: ${response.statusText}`));
    }

    const data = await response.json().catch(() => ({}));
    return { success: true, data };
  } catch (error) {
    console.error('❌ MARK ALL ACTIVITY EVENTS READ ERROR:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark all notifications as read',
    };
  }
}

export const fetchNotificationHistory = async (opts = {}) => {
  try {
    const safePage = Math.max(1, parseInt(String(opts.page ?? 1), 10) || 1);
    const safeLimit = Math.max(1, parseInt(String(opts.limit ?? 20), 10) || 20);
    const params = new URLSearchParams({
      page: String(safePage),
      limit: String(safeLimit),
    });

    if (opts.notificationType && opts.notificationType !== 'all') {
      params.set('notification_type', opts.notificationType);
    }
    if (opts.audience && opts.audience !== 'all') {
      params.set('audience', opts.audience);
    } else if (opts.targetAudience && opts.targetAudience !== 'all') {
      params.set('audience', opts.targetAudience);
    }
    if (opts.search?.trim()) {
      params.set('search', opts.search.trim());
    }

    const url = `${API_BASE_URL}/admin-push-notification-history?${params.toString()}`;

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: getApiHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(parseErrorMessage(errorData, `HTTP ${response.status}: ${response.statusText}`));
    }

    const data = await response.json().catch(() => ({}));
    const rawList = extractNotificationsArray(data);
    const notifications = rawList
      .map((row, index) => normalizeNotificationRecord(row, index))
      .filter(Boolean);

    const pagination = data.pagination ?? data.data?.pagination ?? {};
    const responsePage = pagination.page ?? safePage;
    const responseLimit = pagination.limit ?? safeLimit;
    const hasMore = Boolean(pagination.has_more ?? pagination.hasMore);
    const totalCount = pagination.total_count ?? pagination.totalCount ?? null;
    const totalPages = pagination.total_pages ?? pagination.totalPages ?? null;

    return {
      success: true,
      data: {
        notifications,
        page: responsePage,
        limit: responseLimit,
        hasMore,
        totalCount: totalCount != null ? Number(totalCount) : null,
        totalPages: totalPages != null ? Number(totalPages) : null,
      },
    };
  } catch (error) {
    console.error('❌ FETCH PUSH NOTIFICATION HISTORY ERROR:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch push notification history',
    };
  }
};

// Send push notification to drivers or riders
export const sendPushNotification = async (notificationData) => {
  try {
    const url = `${API_BASE_URL}/admin-notifications`;
    const audience = normalizeNotificationAudience(
      notificationData.audience ?? notificationData.targetAudience,
    );

    if (audience !== 'drivers' && audience !== 'riders') {
      throw new Error('Audience must be drivers or riders');
    }

    const response = await authenticatedFetch(url, {
      method: 'POST',
      headers: getApiHeaders(true),
      body: JSON.stringify({
        notification_type: notificationData.type || 'event',
        audience,
        title: notificationData.title,
        message: notificationData.message,
        image_url: notificationData.imageUrl || null,
        action_url: notificationData.actionUrl || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(parseErrorMessage(errorData, `HTTP ${response.status}: ${response.statusText}`));
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('❌ SEND NOTIFICATION ERROR:', error);
    return {
      success: false,
      error: error.message || 'Failed to send notification',
    };
  }
};
