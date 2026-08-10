import { authenticatedFetch } from './apiClient';

const DASHBOARD_API_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1/admin-dashboard-overview';

export const fetchDashboardData = async () => {
  try {
    const response = await authenticatedFetch(DASHBOARD_API_URL, {
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
    console.error('Dashboard API Error:', error);
    return { success: false, error: error.message };
  }
};

export const fetchRidesAnalytics = async (timeframe = 'month') => {
  try {
    const response = await authenticatedFetch(`https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1/admin-rides-analytics?timeframe=${timeframe}`, {
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
    console.error('Rides Analytics API Error:', error);
    return { success: false, error: error.message };
  }
};

export const fetchRidesData = async () => {
  try {
    const response = await authenticatedFetch('https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1/admin-rides', {
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
    console.error('Rides API Error:', error);
    return { success: false, error: error.message };
  }
};
