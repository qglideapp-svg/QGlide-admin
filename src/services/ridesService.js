import { getAuthToken } from './authService';

const RIDES_API_BASE = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

export const fetchRidesList = async (filters = {}) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Build query parameters
    const params = new URLSearchParams();
    
    if (filters.status && filters.status !== 'All Statuses') {
      params.append('status', filters.status.toLowerCase());
    }
    
    if (filters.date) {
      params.append('date', filters.date);
    }
    
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    if (filters.page) {
      params.append('page', filters.page.toString());
    }
    
    if (filters.pageSize) {
      params.append('page_size', filters.pageSize.toString());
    }

    const url = `${RIDES_API_BASE}/admin-rides-list?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    console.error('Rides List API Error:', error);
    return { success: false, error: error.message };
  }
};

export const fetchRideDetails = async (rideId) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const params = new URLSearchParams();
    params.append('ride_id', rideId);

    const url = `${RIDES_API_BASE}/admin-ride-details?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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
    console.error('Ride Details API Error:', error);
    return { success: false, error: error.message };
  }
};
