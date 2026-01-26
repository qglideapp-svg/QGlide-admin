import { getAuthToken } from './authService';

const API_BASE_URL = 'https://bvazoowmmiymbbhxoggo.supabase.co/functions/v1';
const SUPABASE_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2YXpvb3dtbWl5bWJiaHhvZ2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTQzMjQsImV4cCI6MjA3NTI3MDMyNH0.9vdJHTTnW38CctYwD9GZOvoX_SEu58FLu81mbjQFBdk';

export const fetchDriversList = async (searchTerm = '', statusFilter = '') => {
  try {
    // Use saved token from login
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    // Build URL with type, search and status parameters
    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    const params = [];
    params.push('type=drivers'); // Add type parameter for unified endpoint
    
    if (searchTerm && searchTerm.trim()) {
      params.push(`search=${encodeURIComponent(searchTerm.trim())}`);
    }
    
    if (statusFilter && statusFilter !== 'All Statuses' && statusFilter.toLowerCase() !== 'all') {
      params.push(`status=${encodeURIComponent(statusFilter.toLowerCase())}`);
    }
    
    const queryString = params.join('&');
    const url = `${API_BASE_URL}/admin-drivers-list?${queryString}`;

    console.log('🚀 API REQUEST DETAILS:', {
      '🔗 URL': url,
      '🔍 Search Term': searchTerm,
      '📊 Status Filter': statusFilter,
      '🔑 Has Token': !!token,
      '🔑 Has Anon Key': !!anonKey,
      '⏰ Timestamp': new Date().toISOString(),
      '🔍 Making request to admin-drivers-list endpoint': true
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'apikey': anonKey,
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
    
    // Log the raw response first to see what we're getting
    console.log('📡 RAW API RESPONSE:', JSON.stringify(data, null, 2));
    
    // Try to find drivers in the response - check multiple possible locations
    let driversArray = [];
    
    // Check if response is directly an array
    if (Array.isArray(data)) {
      driversArray = data;
      console.log('✅ Found drivers as direct array');
    }
    // Check the actual API response structure: data.data.drivers
    else if (data.data && data.data.drivers && Array.isArray(data.data.drivers)) {
      driversArray = data.data.drivers;
      console.log('✅ Found drivers in data.data.drivers');
    }
    // Check other common API response structures
    else if (data.drivers && Array.isArray(data.drivers)) {
      driversArray = data.drivers;
      console.log('✅ Found drivers in data.drivers');
    }
    else if (data.data && Array.isArray(data.data)) {
      driversArray = data.data;
      console.log('✅ Found drivers in data.data');
    }
    else if (data.results && Array.isArray(data.results)) {
      driversArray = data.results;
      console.log('✅ Found drivers in data.results');
    }
    else if (data.items && Array.isArray(data.items)) {
      driversArray = data.items;
      console.log('✅ Found drivers in data.items');
    }
    else {
      console.log('❌ No drivers array found in response');
      console.log('Available keys:', Object.keys(data));
    }
    
    // Transform API response to match UI expectations
    const transformedData = {
      drivers: driversArray,
      totalCount: data.data?.total_count || data.totalCount || data.total || data.count || driversArray.length,
      totalPages: data.data?.total_pages || data.totalPages || Math.ceil((data.data?.total_count || data.totalCount || data.total || data.count || driversArray.length) / 20),
      currentPage: data.data?.page || 1,
      hasNextPage: data.data?.hasNextPage || data.hasNextPage || false,
      hasPrevPage: data.data?.hasPrevPage || data.hasPrevPage || false
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
      '🔍 Data.drivers check': data.drivers,
      '🔍 Data.data check': data.data,
      '🔍 Is data.drivers array?': Array.isArray(data.drivers),
      '🔍 Is data.data array?': Array.isArray(data.data),
      '🔍 Is data array?': Array.isArray(data),
      '🔍 Raw data stringified': JSON.stringify(data, null, 2)
    });

    return { success: true, data: transformedData };
  } catch (error) {
    console.error('❌ FETCH DRIVERS LIST ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    return { 
      success: false, 
      error: error.message || 'Failed to fetch drivers list' 
    };
  }
};

// Fetch driver details by ID
export const fetchDriverDetails = async (driverId) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-driver-details?driver_id=${driverId}`;
    
    console.log('🚀 FETCH DRIVER DETAILS REQUEST:', {
      '🔗 URL': url,
      '🆔 Driver ID': driverId,
      '🔑 Has Token': !!token,
      '🔑 Token Preview': token ? `${token.substring(0, 20)}...` : 'No token',
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 DRIVER DETAILS HTTP RESPONSE:', {
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
    
    console.log('📡 RAW DRIVER DETAILS RESPONSE:', JSON.stringify(data, null, 2));
    
    // Extract driver from data.data.driver
    if (data.success && data.data && data.data.driver) {
      console.log('✅ DRIVER DETAILS EXTRACTED SUCCESSFULLY:', {
        '📊 Driver Data': data.data.driver,
        '🔍 Driver ID': data.data.driver.id,
        '👤 Driver Name': data.data.driver.full_name,
        '📱 Phone': data.data.driver.phone,
        '🚗 Vehicle Info': data.data.driver.driver_profile,
        '💰 Earnings': data.data.driver.earnings,
        '🚕 Recent Rides': data.data.driver.recent_rides
      });
      
      return { success: true, data: data.data.driver };
    }
    
    console.log('❌ INVALID DRIVER DETAILS RESPONSE STRUCTURE:', {
      '📊 Raw Data': data,
      '🔍 Success': data.success,
      '🔍 Has Data': !!data.data,
      '🔍 Has Driver': !!data.data?.driver
    });
    
    return { success: false, error: 'Invalid response structure' };
  } catch (error) {
    console.error('❌ FETCH DRIVER DETAILS ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to fetch driver details' 
    };
  }
};

// Approve driver by ID
export const approveDriver = async (driverId) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/approve-driver`;
    
    console.log('🚀 APPROVE DRIVER REQUEST:', {
      '🔗 URL': url,
      '🆔 Driver ID': driverId,
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
      body: JSON.stringify({ driver_id: driverId })
    });

    console.log('📡 APPROVE DRIVER HTTP RESPONSE:', {
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
    
    console.log('📡 APPROVE DRIVER RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ APPROVE DRIVER ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to approve driver' 
    };
  }
};

// Unsuspend driver by ID with optional reason
export const unsuspendDriver = async (driverId, reason = '') => {
  try {
    const token = getAuthToken();
    const anonKey = localStorage.getItem('anonKey') || SUPABASE_API_KEY;
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-unsuspend-driver`;
    
    console.log('🚀 UNSUSPEND DRIVER REQUEST:', {
      '🔗 URL': url,
      '🆔 Driver ID': driverId,
      '📝 Reason': reason,
      '🔑 Has Token': !!token,
      '🔑 Has Anon Key': !!anonKey,
      '⏰ Timestamp': new Date().toISOString()
    });

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': anonKey,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        driver_id: driverId,
        reason: reason || 'Suspension lifted after review'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('📡 UNSUSPEND DRIVER RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ UNSUSPEND DRIVER ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to unsuspend driver' 
    };
  }
};

// Suspend driver by ID with reason
export const suspendDriver = async (driverId, reason) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-update-driver-status`;
    
    console.log('🚀 SUSPEND DRIVER REQUEST:', {
      '🔗 URL': url,
      '🆔 Driver ID': driverId,
      '📝 Reason': reason,
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
        driver_id: driverId,
        status: 'suspended',
        reason: reason
      })
    });

    console.log('📡 SUSPEND DRIVER HTTP RESPONSE:', {
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
    
    console.log('📡 SUSPEND DRIVER RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ SUSPEND DRIVER ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to suspend driver' 
    };
  }
};

// Update driver details
export const updateDriver = async (driverId, updateData) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-update-driver`;
    
    console.log('🚀 UPDATE DRIVER REQUEST:', {
      '🔗 URL': url,
      '🆔 Driver ID': driverId,
      '📝 Update Data': updateData,
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
        driver_id: driverId,
        ...updateData
      })
    });

    console.log('📡 UPDATE DRIVER HTTP RESPONSE:', {
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
    
    console.log('📡 UPDATE DRIVER RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ UPDATE DRIVER ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to update driver' 
    };
  }
};

// Delete driver by ID with reason
export const deleteDriver = async (driverId, reason) => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    const url = `${API_BASE_URL}/admin-delete-driver`;
    
    console.log('🚀 DELETE DRIVER REQUEST:', {
      '🔗 URL': url,
      '🆔 Driver ID': driverId,
      '📝 Reason': reason,
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
        driver_id: driverId,
        reason: reason
      })
    });

    console.log('📡 DELETE DRIVER HTTP RESPONSE:', {
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
    
    console.log('📡 DELETE DRIVER RESPONSE:', JSON.stringify(data, null, 2));
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ DELETE DRIVER ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to delete driver' 
    };
  }
};

// Export drivers to CSV
export const exportDriversToCSV = async (status = '', minRating = '') => {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    let url = `${API_BASE_URL}/admin-drivers-export-csv`;
    const params = [];
    
    if (status && status !== 'All Statuses' && status.toLowerCase() !== 'all') {
      params.push(`status=${encodeURIComponent(status.toLowerCase())}`);
    }
    
    if (minRating && minRating !== 'Any Rating') {
      // Extract numeric value from rating filter (e.g., "4.5+" -> "4.5")
      const ratingValue = minRating.replace('+', '');
      params.push(`min_rating=${encodeURIComponent(ratingValue)}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    console.log('🚀 EXPORT DRIVERS CSV REQUEST:', {
      '🔗 URL': url,
      '📊 Status Filter': status,
      '⭐ Min Rating': minRating,
      '🔑 Has Token': !!token,
      '🔑 Token Preview': token ? `${token.substring(0, 20)}...` : 'No token',
      '⏰ Timestamp': new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 EXPORT CSV HTTP RESPONSE:', {
      '✅ Status': response.status,
      '📝 Status Text': response.statusText,
      '🔗 URL': response.url,
      '✅ OK': response.ok,
      '📋 Content Type': response.headers.get('content-type'),
      '📏 Content Length': response.headers.get('content-length')
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if response is CSV content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/csv')) {
      const csvContent = await response.text();
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `drivers_export_${timestamp}.csv`;
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url_blob = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url_blob;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url_blob);
      
      console.log('✅ CSV EXPORT SUCCESSFUL:', {
        '📄 Filename': filename,
        '📏 Content Length': csvContent.length,
        '📊 Export Filters': { status, minRating }
      });
      
      return { success: true, filename, size: csvContent.length };
    } else {
      // If not CSV, try to parse as JSON for error messages
      const data = await response.json();
      console.log('📡 EXPORT RESPONSE (JSON):', JSON.stringify(data, null, 2));
      
      return { success: true, data };
    }
  } catch (error) {
    console.error('❌ EXPORT CSV ERROR:', {
      '🚨 Error Message': error.message,
      '🔍 Error Type': error.constructor.name,
      '📝 Error Stack': error.stack,
      '⏰ Timestamp': new Date().toISOString()
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to export drivers to CSV' 
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
