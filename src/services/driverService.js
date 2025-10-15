import { getAuthToken } from './authService';

const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';

export const fetchDriversList = async (params = {}) => {
  try {
    // Use saved token from login
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    // Build query parameters
    const queryParams = new URLSearchParams();
    
    if (params.search) {
      queryParams.append('search', params.search);
    }
    
    if (params.status && params.status !== 'All Statuses') {
      queryParams.append('status', params.status.toLowerCase());
    }
    
    if (params.page) {
      queryParams.append('page', params.page.toString());
    }
    
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const url = `${API_BASE_URL}/admin-drivers-list?${queryParams.toString()}`;

    console.log('🚀 API REQUEST DETAILS:', {
      '🔗 URL': url,
      '📝 Params': params,
      '🔑 Has Token': !!token,
      '📋 Query String': queryParams.toString(),
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '📋 Headers': Object.fromEntries(response.headers.entries()),
      '✅ OK': response.ok
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Ensure drivers is always an array
    let driversArray = [];
    if (Array.isArray(data.drivers)) {
      driversArray = data.drivers;
    } else if (Array.isArray(data.data)) {
      driversArray = data.data;
    } else if (Array.isArray(data)) {
      driversArray = data;
    }
    
    // Transform API response to match UI expectations
    const transformedData = {
      drivers: driversArray,
      totalCount: data.totalCount || data.total || data.count || driversArray.length,
      totalPages: data.totalPages || Math.ceil((data.totalCount || data.total || data.count || driversArray.length) / (params.limit || 20)),
      currentPage: params.page || 1,
      hasNextPage: data.hasNextPage || false,
      hasPrevPage: data.hasPrevPage || false
    };

    console.log('🔍 FULL API RESPONSE DEBUG:', {
      '📡 Raw Response': data,
      '🔍 Response Type': typeof data,
      '📊 Is Object': typeof data === 'object',
      '🔢 Response Keys': Object.keys(data || {}),
      '📝 Drivers Array': driversArray,
      '📏 Drivers Length': driversArray.length,
      '🔍 First Driver': driversArray[0] || 'No drivers',
      '📋 All Drivers': driversArray,
      '⚙️ Transformed Data': transformedData,
      '🔗 Request URL': url,
      '📝 Request Params': params
    });

    return { success: true, data: transformedData };
  } catch (error) {
    console.error('❌ FETCH DRIVERS LIST ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '🔗 Request URL': url || 'Unknown',
      '📝 Request Params': params,
      '⏰ Timestamp': new Date().toISOString()
    });
    return { 
      success: false, 
      error: error.message || 'Failed to fetch drivers list' 
    };
  }
};

// Helper function to transform driver data from API to UI format
export const transformDriverData = (apiDriver) => {
  return {
    id: apiDriver.id || apiDriver.driver_id || '',
    name: apiDriver.full_name || apiDriver.name || apiDriver.driver_name || 'Unknown Driver',
    phone: apiDriver.phone_number || apiDriver.phone || apiDriver.contact_number || '',
    avatar: apiDriver.profile_picture || apiDriver.avatar || apiDriver.profile_image || 'https://i.pravatar.cc/40',
    vehicle: {
      model: apiDriver.vehicle_model || apiDriver.vehicle?.model || apiDriver.car_model || 'Unknown Vehicle',
      year: apiDriver.vehicle_year || apiDriver.vehicle?.year || apiDriver.car_year || new Date().getFullYear()
    },
    status: apiDriver.status || apiDriver.driver_status || 'Unknown',
    rating: parseFloat(apiDriver.rating || apiDriver.average_rating || 0),
    totalRides: parseInt(apiDriver.total_rides || apiDriver.rides_count || 0),
    earnings: parseFloat(apiDriver.total_earnings || apiDriver.earnings || 0)
  };
};
