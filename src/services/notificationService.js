import { getAuthToken } from './authService';

const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

// Send push notification to all users
export const sendPushNotification = async (notificationData) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-notifications`;
    
    console.log('🚀 SEND NOTIFICATION REQUEST:', {
      '🔗 URL': url,
      '📝 Notification Data': notificationData,
      '🔑 Has Token': !!token,
      '🔑 Token Preview': token ? `${token.substring(0, 20)}...` : 'No token',
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification_type: notificationData.type || 'event', // 'news' or 'event'
        title: notificationData.title,
        message: notificationData.message,
        image_url: notificationData.imageUrl || null,
        action_url: notificationData.actionUrl || null,
      })
    });

    console.log('📡 SEND NOTIFICATION HTTP RESPONSE:', {
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
    
    console.log('📡 SEND NOTIFICATION RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ SEND NOTIFICATION ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to send notification' 
    };
  }
};

// Fetch notification history (if needed in the future)
export const fetchNotificationHistory = async (page = 1, limit = 20) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-notifications-history?page=${page}&limit=${limit}`;
    
    console.log('🚀 FETCH NOTIFICATION HISTORY REQUEST:', {
      '🔗 URL': url,
      '📄 Page': page,
      '📏 Limit': limit,
      '🔑 Has Token': !!token,
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ FETCH NOTIFICATION HISTORY ERROR:', error);
    
    return { 
      success: false, 
      error: error.message || 'Failed to fetch notification history' 
    };
  }
};
